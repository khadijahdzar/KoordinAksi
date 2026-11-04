import { Router } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Organization from "../models/Organization.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { loginSchema, registerSchema } from "../validation/requestSchemas.js";

const router = Router();

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

router.get("/me", protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("-password").populate("organization");
    return res.json({ user });
  } catch (error) {
    return next(error);
  }
});

export default router;
