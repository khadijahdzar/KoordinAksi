import { Router } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Organization from "../models/Organization.js";
import { protect } from "../middleware/auth.js";

const router = Router();

function createToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  });
}

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password, role = "volunteer", phone, organizationName } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Nama, email, dan password wajib diisi." });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password minimal 8 karakter." });
    }
    if (!["volunteer", "organization"].includes(role)) {
      return res.status(400).json({ message: "Role pendaftaran tidak valid." });
    }
    if (role === "organization" && !organizationName?.trim()) {
      return res.status(400).json({ message: "Nama organisasi wajib diisi." });
    }
    const user = await User.create({ name, email, password, role, phone });
    if (role === "organization") {
      const organization = await Organization.create({
        name: organizationName,
        email,
        phone,
        owner: user._id
      });
      user.organization = organization._id;
      await user.save();
    }
    const safeUser = await User.findById(user._id).select("-password").populate("organization");
    return res.status(201).json({ token: createToken(user), user: safeUser });
  } catch (error) {
    return next(error);
  }
});

router.post("/login", async (req, res, next) => {
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
