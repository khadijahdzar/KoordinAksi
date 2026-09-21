<?php

/**
 * Smoke test end-to-end API KoordinAksi.
 * Menjalankan seluruh alur bisnis: register -> org profile -> verify -> event -> registration -> task.
 */

$base = 'http://127.0.0.1:8000/api';

function api(string $method, string $url, ?array $body = null, ?string $token = null): array
{
    global $base;

    $headers = ["Accept: application/json", "Content-Type: application/json"];
    if ($token) {
        $headers[] = "Authorization: Bearer {$token}";
    }

    $context = stream_context_create(['http' => [
        'method' => $method,
        'header' => implode("\r\n", $headers),
        'content' => $body ? json_encode($body) : null,
        'ignore_errors' => true,
    ]]);

    $response = file_get_contents($base.$url, false, $context);
    $code = explode(' ', $http_response_header[0])[1];

    echo "\n=== [{$method}] {$url} => HTTP {$code} ===\n";
    echo json_encode(json_decode($response), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)."\n";

    return ['code' => (int) $code, 'body' => json_decode($response, true)];
}

// 1. Register organization user
$r = api('POST', '/register', [
    'name' => 'Org Bahari', 'email' => 'org@test.com',
    'password' => 'password123', 'password_confirmation' => 'password123', 'role' => 'organization',
]);
$orgToken = $r['body']['data']['token'];

// 2. Register organization profile (pending)
api('POST', '/organizations', [
    'organization_name' => 'Komunitas Bahari', 'city' => 'Pati',
    'phone' => '081234567890', 'description' => 'Komunitas sosial bahari.',
], $orgToken);

// 3. Coba buat event sebelum diverifikasi (harus 403)
api('POST', '/organization/events', [
    'title' => 'Bersih Pantai', 'category' => 'penghijauan', 'location' => 'Pantai Ujungnegoro',
    'event_date' => '2026-12-01 08:00:00', 'quota' => 50, 'requirements' => 'Siap kerja bakti',
], $orgToken);

// 4. Login admin & verifikasi organisasi
$r = api('POST', '/login', ['email' => 'admin@koordinaksi.test', 'password' => 'password']);
$adminToken = $r['body']['data']['token'];
api('PATCH', '/admin/organizations/1/verify', ['verification_status' => 'approved'], $adminToken);

// 5. Buat event setelah approved
$r = api('POST', '/organization/events', [
    'title' => 'Aksi Bersih Pantai', 'category' => 'penghijauan', 'location' => 'Pantai Ujungnegoro, Batang',
    'event_date' => '2026-12-01 08:00:00', 'quota' => 50, 'requirements' => 'Usia 17+, siap kerja bakti',
], $orgToken);
$eventId = $r['body']['data']['event']['id'];

// 6. Register & login volunteer
$r = api('POST', '/register', [
    'name' => 'Relawan Satu', 'email' => 'volunteer1@test.com',
    'password' => 'password123', 'password_confirmation' => 'password123', 'role' => 'volunteer',
]);
$volunteerId = $r['body']['data']['user']['id'];
$r = api('POST', '/login', ['email' => 'volunteer1@test.com', 'password' => 'password123']);
$volToken = $r['body']['data']['token'];
$r = api('POST', "/events/{$eventId}/register", null, $volToken);
$regId = $r['body']['data']['registration']['id'];

// 7. Volunteer coba akses endpoint admin (harus 403)
api('GET', '/admin/organizations', null, $volToken);

// 8. Organization accept pendaftaran
api('PATCH', "/registrations/{$regId}/accept", null, $orgToken);

// 9. Organization buat tugas untuk volunteer
$r = api('POST', "/organization/events/{$eventId}/tasks", [
    'user_id' => $volunteerId, 'task_name' => 'Koordinator Tim Sampah', 'description' => 'Memimpin tim pembersihan',
], $orgToken);
$taskId = $r['body']['data']['task']['id'];

// 10. Volunteer update status tugas: in_progress lalu completed
api('PATCH', "/tasks/{$taskId}/status", ['status' => 'in_progress'], $volToken);
api('PATCH', "/tasks/{$taskId}/status", ['status' => 'completed'], $volToken);

// 11. Riwayat volunteer
api('GET', '/registrations/my', null, $volToken);
api('GET', '/tasks/my', null, $volToken);

// 12. Logout volunteer
api('POST', '/logout', null, $volToken);

echo "\n=== SMOKE TEST SELESAI ===\n";