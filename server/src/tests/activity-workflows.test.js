import assert from "node:assert/strict";
import { once } from "node:events";
import { after, before, test } from "node:test";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import app from "../app.js";
import AdminLog from "../models/AdminLog.js";
import Activity from "../models/Activity.js";
import AuditLog from "../models/AuditLog.js";
import Organization from "../models/Organization.js";
import Registration from "../models/Registration.js";
import User from "../models/User.js";
import VolunteerLog from "../models/VolunteerLog.js";

const createdUserIds = [];
const createdOrganizationIds = [];
let activityId;
let registrationId;
let rejectedRegistrationId;
let unverifiedOrganizationId;
let server;
let baseUrl;
let unverifiedOrganizationToken;
let verifiedOrganizationToken;
let existingVolunteerToken;
let adminToken;
let adminId;

function createToken(user) {
  return jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET);
}

async function createUser(role, index) {
  const user = await User.create({
    name: `Integration ${role} ${index}`,
    email: `integration-${role}-${index}-${Date.now()}@example.test`,
    password: "Integration-test-password-123",
    role
  });
  createdUserIds.push(user._id);
  return user;
}

async function request(path, { method = "GET", token, body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { "Content-Type": "application/json" } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  return { response, data: await response.json() };
}

before(async () => {
  if (!process.env.MONGO_URI) throw new Error("Set MONGO_URI in server/.env.test.");
  if (!process.env.JWT_SECRET) throw new Error("Set JWT_SECRET in server/.env.test.");

  await mongoose.connect(process.env.MONGO_URI);
  if (!mongoose.connection.name.toLowerCase().includes("test")) {
    const databaseName = mongoose.connection.name;
    await mongoose.disconnect();
    throw new Error(`Refusing to run integration tests against non-test database "${databaseName}".`);
  }

  await Promise.all([Activity.init(), AuditLog.init(), Organization.init(), Registration.init(), User.init()]);

  const unverifiedOwner = await createUser("organization", "unverified");
  const unverifiedOrganization = await Organization.create({
    name: "Unverified Integration Organization",
    email: unverifiedOwner.email,
    owner: unverifiedOwner._id,
    verified: false
  });
  createdOrganizationIds.push(unverifiedOrganization._id);
  unverifiedOrganizationId = unverifiedOrganization._id;
  unverifiedOwner.organization = unverifiedOrganization._id;
  await unverifiedOwner.save();
  unverifiedOrganizationToken = createToken(unverifiedOwner);

  const verifiedOwner = await createUser("organization", "verified");
  const verifiedOrganization = await Organization.create({
    name: "Verified Integration Organization",
    email: verifiedOwner.email,
    owner: verifiedOwner._id,
    verified: true
  });
  createdOrganizationIds.push(verifiedOrganization._id);
  verifiedOwner.organization = verifiedOrganization._id;
  await verifiedOwner.save();
  verifiedOrganizationToken = createToken(verifiedOwner);

  const volunteer1 = await createUser("volunteer", 1);
  const volunteer2 = await createUser("volunteer", 2);
  const volunteer3 = await createUser("volunteer", 3);
  existingVolunteerToken = createToken(volunteer1);
  const admin = await createUser("admin", 1);
  adminId = admin._id;
  adminToken = createToken(admin);

  const activity = await Activity.create({
    title: "Integration capacity activity",
    description: "Activity used by isolated route integration tests.",
    category: "Bakti Sosial",
    location: "Jakarta",
    date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    capacity: 5,
    activeRegistrations: 3,
    organization: verifiedOrganization._id
  });
  activityId = activity._id;

  const registrations = await Registration.create([
    { activity: activityId, volunteer: volunteer1._id },
    { activity: activityId, volunteer: volunteer2._id },
    { activity: activityId, volunteer: volunteer3._id }
  ]);
  registrationId = registrations[1]._id;
  rejectedRegistrationId = registrations[2]._id;

  server = app.listen(0);
  await once(server, "listening");
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
  if (createdOrganizationIds.length) {
    await AuditLog.deleteMany({ targetId: { $in: createdOrganizationIds } });
  }
  if (activityId) {
    await AdminLog.deleteMany({ targetId: activityId });
    await VolunteerLog.deleteMany({ actionId: activityId });
    await Registration.deleteMany({ activity: activityId });
    await Activity.deleteOne({ _id: activityId });
  }
  if (createdOrganizationIds.length) {
    await Organization.deleteMany({ _id: { $in: createdOrganizationIds } });
  }
  if (createdUserIds.length) {
    await User.deleteMany({ _id: { $in: createdUserIds } });
  }
  if (mongoose.connection.readyState) await mongoose.disconnect();
});

test("unverified organization cannot create draft activities", async () => {
  for (const status of ["draft", "published"]) {
    const { response, data } = await request("/activities", {
      method: "POST",
      token: unverifiedOrganizationToken,
      body: {
        title: `Blocked ${status}`,
        description: "Unverified organizations cannot create activities.",
        category: "Bakti Sosial",
        location: "Jakarta",
        date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        capacity: 10,
        status
      }
    });

    assert.equal(response.status, 403);
    assert.equal(data.message, "Organisasi Anda belum diverifikasi oleh Admin.");
  }
});

test("activity capacity cannot be reduced below active registrations", async () => {
  const { response, data } = await request(`/activities/${activityId}`, {
    method: "PATCH",
    token: verifiedOrganizationToken,
    body: { capacity: 1 }
  });

  assert.equal(response.status, 409);
  assert.equal(
    data.message,
    "Kapasitas baru (1) tidak boleh lebih kecil dari jumlah pendaftar aktif saat ini (3)."
  );
  const activity = await Activity.findById(activityId).select("capacity");
  assert.equal(activity.capacity, 5);
});

test("a volunteer cannot register for the same activity twice", async () => {
  const { response, data } = await request("/registrations", {
    method: "POST",
    token: existingVolunteerToken,
    body: { activityId: activityId.toString() }
  });

  assert.equal(response.status, 409);
  assert.equal(data.message, "Data sudah terdaftar.");

  const activity = await Activity.findById(activityId).select("activeRegistrations");
  assert.equal(activity.activeRegistrations, 3);
});

test("a volunteer can cancel their own pending registration and release its slot", async () => {
  const volunteer = await createUser("volunteer", "withdrawal");
  const volunteerToken = createToken(volunteer);
  const registration = await Registration.create({
    activity: activityId,
    volunteer: volunteer._id
  });
  await Activity.updateOne({ _id: activityId }, { $inc: { activeRegistrations: 1 } });

  const otherVolunteerAttempt = await request(`/registrations/${registration._id}/cancel`, {
    method: "PATCH",
    token: existingVolunteerToken
  });
  assert.equal(otherVolunteerAttempt.response.status, 403);

  const cancelled = await request(`/registrations/${registration._id}/cancel`, {
    method: "PATCH",
    token: volunteerToken
  });
  assert.equal(cancelled.response.status, 200);
  assert.equal(cancelled.data.registration.status, "cancelled");

  const activity = await Activity.findById(activityId).select("activeRegistrations");
  assert.equal(activity.activeRegistrations, 3);

  const repeatedCancellation = await request(`/registrations/${registration._id}/cancel`, {
    method: "PATCH",
    token: volunteerToken
  });
  assert.equal(repeatedCancellation.response.status, 409);
});

test("registration lifecycle rejects terminal transitions and keeps capacity accurate", async () => {
  const approved = await request(`/registrations/${registrationId}/status`, {
    method: "PATCH",
    token: verifiedOrganizationToken,
    body: { status: "approved" }
  });
  assert.equal(approved.response.status, 200);

  const attended = await request(`/registrations/${registrationId}/status`, {
    method: "PATCH",
    token: verifiedOrganizationToken,
    body: { status: "attended" }
  });
  assert.equal(attended.response.status, 200);

  let activity = await Activity.findById(activityId).select("activeRegistrations");
  assert.equal(activity.activeRegistrations, 3);

  const rejected = await request(`/registrations/${registrationId}/status`, {
    method: "PATCH",
    token: verifiedOrganizationToken,
    body: { status: "rejected" }
  });
  assert.equal(rejected.response.status, 409);

  const pendingRejected = await request(`/registrations/${rejectedRegistrationId}/status`, {
    method: "PATCH",
    token: verifiedOrganizationToken,
    body: { status: "rejected" }
  });
  assert.equal(pendingRejected.response.status, 200);

  activity = await Activity.findById(activityId).select("activeRegistrations");
  assert.equal(activity.activeRegistrations, 2);

  const invalidTransition = await request(`/registrations/${rejectedRegistrationId}/status`, {
    method: "PATCH",
    token: verifiedOrganizationToken,
    body: { status: "attended" }
  });
  assert.equal(invalidTransition.response.status, 409);

  activity = await Activity.findById(activityId).select("activeRegistrations");
  assert.equal(activity.activeRegistrations, 2);
});

test("attendance corrections and volunteer profile totals use recorded log values", async () => {
  const volunteer = await createUser("volunteer", "attendance-report");
  const registration = await Registration.create({
    activity: activityId,
    volunteer: volunteer._id,
    status: "approved"
  });
  await Activity.updateOne({ _id: activityId }, { $inc: { activeRegistrations: 1 } });
  const volunteerToken = createToken(volunteer);

  const present = await request(`/v1/organizations/actions/${activityId}/attendance`, {
    method: "POST",
    token: verifiedOrganizationToken,
    body: { volunteerId: volunteer._id.toString(), attendanceStatus: "Hadir", hoursLogged: 3.5 }
  });
  assert.equal(present.response.status, 200);
  assert.equal(present.data.attendance.hoursLogged, 3.5);

  let profile = await request("/v1/volunteers/profile/me", { token: volunteerToken });
  assert.equal(profile.response.status, 200);
  assert.equal(profile.data.profile.stats.totalActions, 1);
  assert.equal(profile.data.profile.stats.totalHours, 3.5);

  const absent = await request(`/v1/organizations/actions/${activityId}/attendance`, {
    method: "POST",
    token: verifiedOrganizationToken,
    body: { volunteerId: volunteer._id.toString(), attendanceStatus: "Alpha", hoursLogged: 0 }
  });
  assert.equal(absent.response.status, 200);
  assert.equal(absent.data.attendance.hoursLogged, 0);

  profile = await request("/v1/volunteers/profile/me", { token: volunteerToken });
  assert.equal(profile.data.profile.stats.totalActions, 0);
  assert.equal(profile.data.profile.stats.totalHours, 0);
  assert.equal((await Registration.findById(registration._id)).status, "approved");
});

test("admin verification changes are atomically recorded and audit logs are admin-only", async () => {
  const verified = await request(`/organizations/${unverifiedOrganizationId}/verify`, {
    method: "PATCH",
    token: adminToken,
    body: { verified: true }
  });
  assert.equal(verified.response.status, 200);

  const rejected = await request(`/organizations/${unverifiedOrganizationId}/verify`, {
    method: "PATCH",
    token: adminToken,
    body: { verified: false }
  });
  assert.equal(rejected.response.status, 200);

  const repeatedRejection = await request(`/organizations/${unverifiedOrganizationId}/verify`, {
    method: "PATCH",
    token: adminToken,
    body: { verified: false }
  });
  assert.equal(repeatedRejection.response.status, 200);

  const logs = await AuditLog.find({ actorId: adminId, targetId: unverifiedOrganizationId }).sort({ timestamp: 1 });
  assert.deepEqual(logs.map((log) => log.action), [
    "organization.verified",
    "organization.rejected",
    "organization.rejected"
  ]);
  assert.equal(logs[0].actorId.toString(), adminId.toString());
  assert.equal(logs[0].targetId.toString(), unverifiedOrganizationId.toString());
  assert.equal(logs[0].details.organizationName, "Unverified Integration Organization");
  assert.equal(logs[0].details.verified, true);
  const organization = await Organization.findById(unverifiedOrganizationId);
  assert.equal(organization.verificationStatus, "rejected");

  const pendingOrganizations = await request("/organizations/pending", { token: adminToken });
  assert.equal(pendingOrganizations.response.status, 200);
  assert.ok(pendingOrganizations.data.organizations.every(
    (pendingOrganization) => pendingOrganization._id !== unverifiedOrganizationId.toString()
  ));

  const adminFeed = await request("/admin/audit-logs?limit=100", { token: adminToken });
  assert.equal(adminFeed.response.status, 200);
  assert.ok(adminFeed.data.auditLogs.some((log) => log.targetId === unverifiedOrganizationId.toString()));

  const forbidden = await request("/admin/audit-logs", { token: existingVolunteerToken });
  assert.equal(forbidden.response.status, 403);

  const metrics = await request("/v1/admin/metrics", { token: adminToken });
  assert.equal(metrics.response.status, 200);
  assert.equal(typeof metrics.data.totalImpactHours, "number");
  assert.equal(metrics.data.monthlyImpact.length, 6);

  const unauthenticated = await request("/v1/admin/metrics");
  assert.equal(unauthenticated.response.status, 401);
  const forbiddenMetrics = await request("/v1/admin/metrics", { token: existingVolunteerToken });
  assert.equal(forbiddenMetrics.response.status, 403);

  const activityModeration = await request(`/v1/admin/verify/${activityId}`, {
    method: "PATCH",
    token: adminToken,
    body: { entityType: "activity", decision: "rejected" }
  });
  assert.equal(activityModeration.response.status, 200);
  assert.equal(activityModeration.data.entity.verificationStatus, "rejected");
  assert.equal(activityModeration.data.entity.status, "cancelled");

  const firstAuditPage = await request("/v1/admin/audit-logs?page=1&limit=1", { token: adminToken });
  const secondAuditPage = await request("/v1/admin/audit-logs?page=2&limit=1", { token: adminToken });
  assert.equal(firstAuditPage.response.status, 200);
  assert.equal(secondAuditPage.response.status, 200);
  assert.equal(firstAuditPage.data.auditLogs.length, 1);
  assert.equal(secondAuditPage.data.auditLogs.length, 1);
  assert.notEqual(firstAuditPage.data.auditLogs[0]._id, secondAuditPage.data.auditLogs[0]._id);
});
