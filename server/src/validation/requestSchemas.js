import Joi from "joi";
import { ACTIVITY_CATEGORIES } from "../models/Activity.js";

const email = Joi.string().trim().lowercase().email().max(254).required();
const password = Joi.string().min(8).max(128).required();

export const registerSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  email,
  password,
  role: Joi.string().valid("volunteer", "organization").default("volunteer"),
  phone: Joi.string().trim().max(30).allow(""),
  organizationName: Joi.when("role", {
    is: "organization",
    then: Joi.string().trim().min(1).max(150).required(),
    otherwise: Joi.string().trim().max(150).allow("")
  })
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
