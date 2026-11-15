export function getOrganizationActivitiesUrl(organization) {
  return `/jelajah?organization=${encodeURIComponent(organization._id)}`;
}
