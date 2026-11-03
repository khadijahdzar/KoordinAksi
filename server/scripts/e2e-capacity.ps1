param(
  [string]$BaseUrl = "http://localhost:5000/api"
)

$ErrorActionPreference = "Stop"

if ($BaseUrl -notmatch '^http://(localhost|127\.0\.0\.1):\d+/api$') {
  throw "This test only allows a local API URL. Use a dedicated local test database."
}

Write-Warning "This E2E test creates an organization, one activity, and four user accounts. Records are not deleted."
$confirmation = Read-Host 'Type RUN TEST DATA to continue against your dedicated test database'
if ($confirmation -cne "RUN TEST DATA") {
  throw "Cancelled. No test data was created."
}

function Invoke-Api {
  param(
    [Parameter(Mandatory = $true)][string]$Method,
    [Parameter(Mandatory = $true)][string]$Path,
    [object]$Body,
    [string]$Token
  )

  $headers = @{}
  if ($Token) {
    $headers.Authorization = "Bearer $Token"
  }

  $request = @{
    Uri = "$BaseUrl$Path"
    Method = $Method
    Headers = $headers
    ContentType = "application/json"
  }
  if ($null -ne $Body) {
    $request.Body = $Body | ConvertTo-Json -Depth 8
  }

  Invoke-RestMethod @request
}

function Get-HttpErrorStatus {
  param([Parameter(Mandatory = $true)]$ErrorRecord)
  if ($ErrorRecord.Exception.Response) {
    return [int]$ErrorRecord.Exception.Response.StatusCode
  }
  return $null
}

$suffix = [guid]::NewGuid().ToString("N")
$testPassword = "E2eTest-$([guid]::NewGuid().ToString('N'))-Aa1!"
$adminEmail = Read-Host "Admin email"
$secureAdminPassword = Read-Host "Admin password" -AsSecureString
$passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureAdminPassword)
try {
  $adminPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
}

$jobs = @()
try {
  $admin = Invoke-Api -Method "POST" -Path "/auth/login" -Body @{
    email = $adminEmail
    password = $adminPassword
  }
  $adminPassword = $null
  if ($admin.user.role -ne "admin") {
    throw "The supplied account is not an admin."
  }
  Write-Output "PASS: admin login."

  $organizationEmail = "e2e-org-$suffix@example.test"
  $organizationName = "E2E Organization $suffix"
  $organizationRegistration = Invoke-Api -Method "POST" -Path "/auth/register" -Body @{
    name = "E2E Organization Owner"
    email = $organizationEmail
    password = $testPassword
    role = "organization"
    organizationName = $organizationName
  }
  $organizationLogin = Invoke-Api -Method "POST" -Path "/auth/login" -Body @{
    email = $organizationEmail
    password = $testPassword
  }
  $organizationId = $organizationRegistration.user.organization._id
  if (-not $organizationId -or $organizationLogin.user.organization.verified) {
    throw "The test organization was not created in the expected unverified state."
  }
  Write-Output "PASS: organization registered and login returned an unverified organization."

  $futureDate = (Get-Date).AddDays(30).ToUniversalTime().ToString("o")
  $activityBody = @{
    title = "E2E Capacity Test $suffix"
    description = "Temporary activity created by the KoordinAksi E2E capacity test."
    category = "Bakti Sosial"
    location = "Jakarta"
    date = $futureDate
    capacity = 2
  }

  try {
    Invoke-Api -Method "POST" -Path "/activities" -Token $organizationLogin.token -Body $activityBody | Out-Null
    throw "Unverified organization unexpectedly created a published activity."
  } catch {
    $status = Get-HttpErrorStatus -ErrorRecord $_
    if ($status -ne 403) { throw }
  }
  Write-Output "PASS: unverified organization cannot publish an activity (403)."

  Invoke-Api -Method "PATCH" -Path "/organizations/$organizationId/verify" -Token $admin.token -Body @{
    verified = $true
  } | Out-Null
  Write-Output "PASS: admin verified the organization."

  $verifiedOrganizationLogin = Invoke-Api -Method "POST" -Path "/auth/login" -Body @{
    email = $organizationEmail
    password = $testPassword
  }
  if (-not $verifiedOrganizationLogin.user.organization.verified) {
    throw "Organization login did not return the updated verified state."
  }

  $activityResponse = Invoke-Api -Method "POST" -Path "/activities" -Token $verifiedOrganizationLogin.token -Body $activityBody
  $activityId = $activityResponse.activity._id
  if (-not $activityId) { throw "Activity creation did not return an ID." }
  Write-Output "PASS: verified organization created activity $activityId with capacity 2."

  $volunteerTokens = @()
  for ($index = 1; $index -le 3; $index++) {
    $volunteerEmail = "e2e-volunteer-$index-$suffix@example.test"
    $volunteer = Invoke-Api -Method "POST" -Path "/auth/register" -Body @{
      name = "E2E Volunteer $index"
      email = $volunteerEmail
      password = $testPassword
      role = "volunteer"
    }
    $volunteerTokens += $volunteer.token
  }
  Write-Output "PASS: created three separate volunteer accounts."

  for ($index = 0; $index -lt 3; $index++) {
    $jobs += Start-Job -ArgumentList $BaseUrl, $activityId, $volunteerTokens[$index], $index -ScriptBlock {
      param($ApiBaseUrl, $ActivityId, $Token, $Index)
      $body = @{ activityId = $ActivityId; note = "E2E concurrent request $Index" } | ConvertTo-Json
      try {
        $response = Invoke-WebRequest -Uri "$ApiBaseUrl/registrations" -Method Post `
          -Headers @{ Authorization = "Bearer $Token" } -ContentType "application/json" -Body $body
        [pscustomobject]@{ Status = [int]$response.StatusCode; Index = $Index }
      } catch {
        if ($_.Exception.Response) {
          [pscustomobject]@{ Status = [int]$_.Exception.Response.StatusCode; Index = $Index }
        } else {
          throw
        }
      }
    }
  }

  $results = @($jobs | Wait-Job | Receive-Job)
  $jobs | Remove-Job -Force
  $jobs = @()

  $created = @($results | Where-Object { $_.Status -eq 201 }).Count
  $conflicts = @($results | Where-Object { $_.Status -eq 409 }).Count
  if ($results.Count -ne 3 -or $created -ne 2 -or $conflicts -ne 1) {
    throw "Expected two 201 and one 409 response; received: $($results.Status -join ', ')."
  }

  $savedActivity = (Invoke-Api -Method "GET" -Path "/activities/$activityId").activity
  if ($savedActivity.activeRegistrations -ne 2) {
    throw "Expected activeRegistrations=2, found $($savedActivity.activeRegistrations)."
  }

  Write-Output "PASS: concurrent capacity check returned two 201 and one 409."
  Write-Output "PASS: persisted activeRegistrations is exactly 2."
  Write-Warning "E2E records remain in the test database. Remove them using your test-data cleanup procedure."
} finally {
  $adminPassword = $null
  if ($jobs.Count -gt 0) {
    $jobs | Stop-Job -ErrorAction SilentlyContinue
    $jobs | Remove-Job -Force -ErrorAction SilentlyContinue
  }
}
