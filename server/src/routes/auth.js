import { Router } from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Organization from "../models/Organization.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  googleAuthSchema,
  googleOrganizationRegistrationSchema,
  loginSchema,
  registerSchema
} from "../validation/requestSchemas.js";

const router = Router();
const googleClientId = process.env.GOOGLE_CLIENT_ID ||
  "556610423581-7jlqlqe9ljov699gtveoga9oa9q999ht.apps.googleusercontent.com";
const googleClient = new OAuth2Client(googleClientId);

function createToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  });
}

router.post("/register", validate(registerSchema), async (req, res, next) => {
  let session;
  try {
    const {
      name, email, password, role = "volunteer", phone, city, interests,
      acceptedTerms, organizationName, focusCategory, legalNumber, picTitle
    } = req.body;

    session = await User.startSession();
    let userId;

    await session.withTransaction(async () => {
      const [user] = await User.create([{
        name,
        email,
        password,
        role,
        phone,
        city,
        interests,
        acceptedTerms
      }], { session });

      if (role === "organization") {
        const [organization] = await Organization.create([{
          name: organizationName,
          email,
          phone,
          focusCategory,
          legalNumber,
          picTitle,
          owner: user._id
        }], { session });

        user.organization = organization._id;
        await user.save({ session });
      }

      userId = user._id;
    });

    const safeUser = await User.findById(userId)
      .select("-password")
      .populate("organization");
    if (!safeUser) {
      throw new Error("User registration completed but the account could not be loaded.");
    }

    return res.status(201).json({ token: createToken(safeUser), user: safeUser });
  } catch (error) {
    return next(error);
  } finally {
    if (session) await session.endSession();
  }
});

router.post("/login", validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: String(email || "").toLowerCase() }).select("+password").populate("organization");
    if (!user || !await user.comparePassword(password || "")) {
      return res.status(401).json({ message: "Email atau password salah." });
    }
    user.password = undefined;
    return res.json({ token: createToken(user), user });
  } catch (error) {
    return next(error);
  }
});

router.post("/google", validate(googleAuthSchema), async (req, res, next) => {
  let session;
  try {
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: req.body.credential,
        audience: googleClientId
      });
      payload = ticket.getPayload();
    } catch {
      return res.status(401).json({ message: "Credential Google tidak valid atau sudah kedaluwarsa." });
    }

    if (!payload?.sub || !payload.email || payload.email_verified !== true || !payload.name) {
      return res.status(401).json({ message: "Profil Google belum memiliki email terverifikasi yang diperlukan." });
    }

    const email = payload.email.toLowerCase();
    const requestedRole = req.body.role;
    const existingUser = await User.findOne({ email }).populate("organization");
    if (existingUser) {
      if (requestedRole && existingUser.role !== requestedRole) {
        return res.status(409).json({ message: "Email Google ini sudah terdaftar dengan peran yang berbeda." });
      }
      return res.json({ token: createToken(existingUser), user: existingUser });
    }

    const role = requestedRole || "volunteer";
    let newUserDetails = {
      name: req.body.name || payload.name,
      email,
      role,
      avatarUrl: payload.picture
    };

    if (role === "organization") {
      const { error, value } = googleOrganizationRegistrationSchema.validate({
        phone: req.body.phone,
        email: req.body.organizationEmail,
        organizationName: req.body.organizationName,
        focusCategory: req.body.focusCategory,
        legalNumber: req.body.legalNumber,
        picTitle: req.body.picTitle
      }, {
        abortEarly: false,
        convert: true
      });
      if (error) {
        return res.status(400).json({
          message: "Lengkapi data wajib organisasi sebelum mendaftar dengan Google.",
          errors: error.details.map(({ message, path }) => ({
            field: path.join("."),
            message
          }))
        });
      }

      session = await User.startSession();
      let userId;
      await session.withTransaction(async () => {
        const [user] = await User.create([newUserDetails], { session });
        const [organization] = await Organization.create([{
          name: value.organizationName,
          email: value.email || email,
          phone: value.phone,
          focusCategory: value.focusCategory,
          legalNumber: value.legalNumber,
          picTitle: value.picTitle,
          owner: user._id
        }], { session });
        user.organization = organization._id;
        await user.save({ session });
        userId = user._id;
      });
      newUserDetails = await User.findById(userId).select("-password").populate("organization");
    } else {
      if (req.body.acceptedTerms !== true) {
        return res.status(400).json({
          message: "Setujui Ketentuan Layanan dan Kebijakan Data Privasi untuk membuat akun relawan dengan Google.",
          errors: [{ field: "acceptedTerms", message: "Persetujuan diperlukan untuk membuat akun." }]
        });
      }
      newUserDetails = await User.create({
        ...newUserDetails,
        phone: req.body.phone,
        city: req.body.city,
        interests: req.body.interests || [],
        acceptedTerms: true
      });
      newUserDetails = await User.findById(newUserDetails._id).select("-password");
    }

    if (!newUserDetails) {
      throw new Error("Google account registration completed but the account could not be loaded.");
    }
    return res.status(201).json({ token: createToken(newUserDetails), user: newUserDetails });
  } catch (error) {
    return next(error);
  } finally {
    if (session) await session.endSession();
  }
});

router.get("/me", protect, async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Sesi tidak valid.", code: "INVALID_SESSION" });
    }
    const user = await req.user.populate("organization");
    return res.json({ user: user.toObject() });
  } catch (error) {
    return next(error);
  }
});

export default router;
