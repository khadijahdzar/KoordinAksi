import api from "../api";

const basePath = "/v1/volunteers";

export const getVolunteerProfile = () => api.get(`${basePath}/profile/me`);
export const updateVolunteerProfile = (profile) => api.put(`${basePath}/profile/me`, profile);
export const getVolunteerActions = () => api.get(`${basePath}/actions`);
export const getVolunteerFeed = () => api.get(`${basePath}/feed`);
export const createVolunteerPost = (post) => api.post(`${basePath}/feed`, post);