import Joi from "joi";
import { ACTIVITY_CATEGORIES } from "../models/Activity.js";

const email = Joi.string().trim().lowercase().email().max(254).required();
const password = Joi.string().min(8).max(128).required();
const volunteerInterests = [
  "Lingkungan & Konservasi",
  "Pendidikan & Literasi",
  "Medis & PKS",
  "Tanggap Bencana",
  "Logistik",
  "Dokumen & Media"
];

export const registerSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  email,
  password,
  role: Joi.string().valid("volunteer", "organization").default("volunteer"),
  phone: Joi.when("role", {
    is: "volunteer",
    then: Joi.string().trim().min(8).max(30).required(),
    otherwise: Joi.string().trim().max(30).allow("")
  }),
  city: Joi.when("role", {
    is: "volunteer",
    then: Joi.string().trim().min(1).max(100).required(),
    otherwise: Joi.string().trim().max(100).allow("")
  }),
  interests: Joi.when("role", {
    is: "volunteer",
    then: Joi.array().items(Joi.string().valid(...volunteerInterests)).min(1).max(volunteerInterests.length).unique().required(),
    otherwise: Joi.array().items(Joi.string().valid(...volunteerInterests)).max(volunteerInterests.length).unique()
  }),
  acceptedTerms: Joi.when("role", {
    is: "volunteer",
    then: Joi.boolean().valid(true).required(),
    otherwise: Joi.boolean()
  }),
  organizationName: Joi.when("role", {
    is: "organization",
    then: Joi.string().trim().min(1).max(150).required(),
    otherwise: Joi.string().trim().max(150).allow("")
  }),
  focusCategory: Joi.string().trim().max(100).allow(""),
  legalNumber: Joi.string().trim().max(100).allow(""),
  picTitle: Joi.string().trim().max(100).allow("")
}).unknown(false);

export const loginSchema = Joi.object({
  email,
  password
}).unknown(false);

export const activityCreateSchema = Joi.object({
  title: Joi.string().trim().min(1).max(160).required(),
  description: Joi.string().trim().min(1).max(5000).required(),
  category: Joi.string().valid(...ACTIVITY_CATEGORIES).required(),
  location: Joi.string().trim().min(1).max(200).required(),
  date: Joi.date().iso().required(),
  endDate: Joi.date().iso().greater(Joi.ref("date")),
  capacity: Joi.number().integer().min(1).required(),
  imageUrl: Joi.string().trim().uri().allow(""),
  status: Joi.string().valid("draft", "published").default("published")
}).unknown(false);

export const activityUpdateSchema = Joi.object({
  title: Joi.string().trim().min(1).max(160),
  description: Joi.string().trim().min(1).max(5000),
  category: Joi.string().valid(...ACTIVITY_CATEGORIES),
  location: Joi.string().trim().min(1).max(200),
  date: Joi.date().iso(),
  endDate: Joi.date().iso(),
  capacity: Joi.number().integer().min(1),
  imageUrl: Joi.string().trim().uri().allow(""),
  status: Joi.string().valid("draft", "published", "cancelled")
}).min(1).unknown(false);

export const registrationCreateSchema = Joi.object({
  activityId: Joi.string().hex().length(24).required(),
  note: Joi.string().trim().max(1000).allow("")
}).unknown(false);

export const registrationStatusSchema = Joi.object({
  status: Joi.string().valid("approved", "rejected", "attended", "cancelled").required()
}).unknown(false);

export const volunteerProfileUpdateSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100),
  username: Joi.string().trim().lowercase().pattern(/^[a-z0-9_]{3,30}$/),
  bio: Joi.string().trim().max(500).allow(""),
  avatarUrl: Joi.string().trim().uri().max(500).allow("")
}).min(1).unknown(false);

export const volunteerPostSchema = Joi.object({
  content: Joi.string().trim().min(1).max(2000).required(),
  imageUrl: Joi.string().trim().uri().max(500).allow(""),
  actionTitle: Joi.string().trim().max(160).allow("")
}).unknown(false);

export const attendanceLogSchema = Joi.object({
  volunteerId: Joi.string().hex().length(24).required(),
  attendanceStatus: Joi.string().valid("Hadir", "Alpha").required(),
  hoursLogged: Joi.number().min(0).max(24).default(0)
}).unknown(false);
