import api from "../api";

const basePath = "/v1/organizations";

export const getOrganizationStats = () => api.get(`${basePath}/dashboard/stats`);
export const getOrganizationVolunteers = () => api.get(`${basePath}/volunteers/database`);
export const createOrganizationAction = (action) => api.post(`${basePath}/actions`, action);
export const logOrganizationAttendance = (actionId, attendance) =>
  api.post(`${basePath}/actions/${actionId}/attendance`, attendance);
export const getOrganizationDirectory = (params) => api.get(basePath, { params });