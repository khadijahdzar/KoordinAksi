import { authorize, protect } from "./auth.js";

export const verifyAdminToken = [protect, authorize("admin")];
