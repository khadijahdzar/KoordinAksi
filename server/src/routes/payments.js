import { Router } from "express";
import crypto from "crypto";
import mongoose from "mongoose";
import Activity from "../models/Activity.js";
import Payment from "../models/Payment.js";
import Registration from "../models/Registration.js";
import AdminLog from "../models/AdminLog.js";
import { authorize, protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import Joi from "joi";

const router = Router();

const donationPackages = {
  regular: { id: "regular", label: "Reguler", amount: 50000 },
  supporter: { id: "supporter", label: "Supporter", amount: 100000 }
};

const createPaymentSchema = Joi.object({
  activityId: Joi.string().hex().length(24).required(),
  packageId: Joi.string().valid("regular", "supporter").default("regular")
}).unknown(false);

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function midtransConfig() {
  const serverKey = process.env.MIDTRANS_SERVER_KEY?.trim();
  const clientKey = process.env.MIDTRANS_CLIENT_KEY?.trim();
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
  return { serverKey, clientKey, isProduction, ready: Boolean(serverKey && clientKey) };
}

function snapApiBase(isProduction) {
  return isProduction
    ? "https://app.midtrans.com/snap/v1/transactions"
    : "https://app.sandbox.midtrans.com/snap/v1/transactions";
}

function verifySignature(orderId, statusCode, grossAmount, signatureKey, serverKey) {
  const payload = `${orderId}${statusCode}${grossAmount}${serverKey}`;
  const expected = crypto.createHash("sha512").update(payload).digest("hex");
  return expected === signatureKey;
}

router.get("/impact", async (req, res, next) => {
  try {
    const paidFilter = { status: "paid" };
    const [totals, byActivity, recent] = await Promise.all([
      Payment.aggregate([
        { $match: paidFilter },
        { $group: { _id: null, totalAmount: { $sum: "$amount" }, totalDonations: { $sum: 1 } } }
      ]),
      Payment.aggregate([
        { $match: paidFilter },
        { $group: { _id: "$activity", amount: { $sum: "$amount" }, count: { $sum: 1 } } },
        { $sort: { amount: -1 } },
        { $limit: 6 },
        { $lookup: { from: "activities", localField: "_id", foreignField: "_id", as: "activity" } },
        { $unwind: { path: "$activity", preserveNullAndEmptyArrays: true } },
        { $lookup: { from: "organizations", localField: "activity.organization", foreignField: "_id", as: "organization" } },
        { $unwind: { path: "$organization", preserveNullAndEmptyArrays: true } },
        { $project: { activityId: "$_id", title: "$activity.title", category: "$activity.category", organizationName: "$organization.name", amount: 1, count: 1 } }
      ]),
      Payment.find(paidFilter).sort({ paidAt: -1, createdAt: -1 }).limit(12)
        .populate("volunteer", "name")
        .populate({ path: "activity", select: "title category", populate: { path: "organization", select: "name" } })
        .lean()
    ]);

    const summary = totals[0] || { totalAmount: 0, totalDonations: 0 };
    const goal = Number(process.env.DONATION_DISPLAY_GOAL) || 5000000;

    return res.json({
      totalAmount: summary.totalAmount,
      totalDonations: summary.totalDonations,
      goal,
      progressPercent: Math.min(100, Math.round((summary.totalAmount / goal) * 100)),
      campaigns: byActivity.map((row) => ({
        activityId: row.activityId,
        title: row.title || "Kegiatan",
        category: row.category || "Sosial",
        organizationName: row.organizationName || "Organisasi",
        amount: row.amount,
        count: row.count
      })),
      recentDonors: recent.map((payment) => ({
        id: payment._id,
        donorName: payment.volunteer?.name
          ? `${payment.volunteer.name.split(" ")[0]}${payment.volunteer.name.split(" ").length > 1 ? " ···" : ""}`
          : "Relawan",
        amount: payment.amount,
        packageLabel: payment.packageLabel,
        activityTitle: payment.activity?.title || "Kegiatan",
        organizationName: payment.activity?.organization?.name || "Organisasi",
        paidAt: payment.paidAt || payment.createdAt
      }))
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/status", (req, res) => {
  const { ready, isProduction } = midtransConfig();
  return res.json({ ready, isProduction });
});

/** Publik: total donasi lunas untuk satu kegiatan (detail page) */
router.get("/activity/:activityId", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.activityId)) {
      return res.status(400).json({ message: "ID kegiatan tidak valid." });
    }
    const activityObjectId = new mongoose.Types.ObjectId(req.params.activityId);
    const [row] = await Payment.aggregate([
      { $match: { activity: activityObjectId, status: "paid" } },
      { $group: { _id: null, totalAmount: { $sum: "$amount" }, count: { $sum: 1 } } }
    ]);
    return res.json({
      totalAmount: row?.totalAmount || 0,
      count: row?.count || 0
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/", validate(createPaymentSchema), protect, authorize("volunteer"), async (req, res, next) => {
  try {
    const { serverKey, clientKey, isProduction, ready } = midtransConfig();
    if (!ready) {
      return res.status(503).json({ message: "Pembayaran belum tersedia. Gateway Midtrans belum dikonfigurasi." });
    }

    const pack = donationPackages[req.body.packageId] || donationPackages.regular;
    const activity = await Activity.findOne({
      _id: req.body.activityId,
      status: "published",
      verificationStatus: { $nin: ["pending", "rejected"] }
    });
    if (!activity) return res.status(404).json({ message: "Kegiatan tidak tersedia." });
    if (activity.date <= new Date()) {
      return res.status(400).json({ message: "Pendaftaran kegiatan yang sudah berlangsung ditutup." });
    }

    const orderId = `KA-${activity._id.toString().slice(-6)}-${req.user.id.toString().slice(-6)}-${Date.now()}`;
    const auth = Buffer.from(`${serverKey}:`).toString("base64");
    const snapResponse = await fetch(snapApiBase(isProduction), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Basic ${auth}`
      },
      body: JSON.stringify({
        transaction_details: { order_id: orderId, gross_amount: pack.amount },
        item_details: [{ id: pack.id, price: pack.amount, quantity: 1, name: `Donasi ${pack.label}`.slice(0, 50) }],
        customer_details: { first_name: (req.user.name || "Relawan").slice(0, 50), email: req.user.email },
        callbacks: { finish: `${process.env.CLIENT_URL || "http://localhost:5173"}/kegiatan/${activity._id}` }
      })
    });

    const snapBody = await snapResponse.json().catch(() => ({}));
    if (!snapResponse.ok || !snapBody.token) {
      const detail = snapBody?.error_messages?.join?.(", ") || snapBody?.message || "Gagal membuat transaksi Midtrans.";
      return res.status(502).json({ message: detail });
    }

    const payment = await Payment.create({
      orderId,
      activity: activity._id,
      volunteer: req.user.id,
      packageId: pack.id,
      packageLabel: pack.label,
      amount: pack.amount,
      status: "pending",
      snapToken: snapBody.token
    });

    await AdminLog.create({
      actorId: req.user.id,
      action: "payment.pending",
      targetModel: "Payment",
      targetId: payment._id,
      details: { orderId, activityId: activity._id, activityTitle: activity.title, amount: pack.amount, packageId: pack.id }
    });

    return res.status(201).json({
      paymentId: payment._id,
      orderId,
      snapToken: snapBody.token,
      clientKey,
      isProduction,
      amount: pack.amount,
      packageId: pack.id
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/notification", async (req, res, next) => {
  let session;
  try {
    const { serverKey, ready } = midtransConfig();
    if (!ready) return res.status(503).json({ message: "Gateway belum dikonfigurasi." });

    const {
      order_id: orderId,
      status_code: statusCode,
      gross_amount: grossAmount,
      signature_key: signatureKey,
      transaction_status: transactionStatus,
      fraud_status: fraudStatus,
      transaction_id: transactionId
    } = req.body || {};

    if (!orderId || !signatureKey) {
      return res.status(400).json({ message: "Payload notifikasi tidak valid." });
    }
    if (!verifySignature(orderId, statusCode, grossAmount, signatureKey, serverKey)) {
      return res.status(403).json({ message: "Signature tidak valid." });
    }

    session = await mongoose.startSession();
    let payment;
    await session.withTransaction(async () => {
      payment = await Payment.findOne({ orderId }).session(session);
      if (!payment) throw createHttpError(404, "Transaksi tidak ditemukan.");

      payment.rawNotification = req.body;
      payment.midtransTransactionId = transactionId || payment.midtransTransactionId;

      const paidOk = ["capture", "settlement"].includes(transactionStatus)
        && (fraudStatus === "accept" || fraudStatus == null || transactionStatus === "settlement");
      const failed = ["deny", "cancel", "expire", "failure"].includes(transactionStatus);

      if (paidOk && payment.status !== "paid") {
        payment.status = "paid";
        payment.paidAt = new Date();

        let registration = await Registration.findOne({
          activity: payment.activity,
          volunteer: payment.volunteer
        }).session(session);

        if (!registration) {
          const reserved = await Activity.findOneAndUpdate({
            _id: payment.activity,
            status: "published",
            $expr: { $lt: ["$activeRegistrations", "$capacity"] }
          }, { $inc: { activeRegistrations: 1 } }, { new: true, session });

          if (reserved) {
            [registration] = await Registration.create([{
              activity: payment.activity,
              volunteer: payment.volunteer,
              note: [
                "Jalur keikutsertaan: Mandiri & Donasi",
                `Paket: ${payment.packageLabel}`,
                `Nominal: Rp${payment.amount.toLocaleString("id-ID")}`,
                `Order: ${payment.orderId}`,
                "Status pembayaran: paid"
              ].join("\n")
            }], { session });
          }
        }

        if (registration) payment.registration = registration._id;

        await AdminLog.create([{
          actorId: payment.volunteer,
          action: "payment.paid",
          targetModel: "Payment",
          targetId: payment._id,
          details: {
            orderId: payment.orderId,
            activityId: payment.activity,
            amount: payment.amount,
            registrationId: registration?._id || null
          }
        }], { session });
      } else if (failed && payment.status === "pending") {
        payment.status = transactionStatus === "expire" ? "expired"
          : transactionStatus === "cancel" ? "cancelled"
            : "failed";
      }

      await payment.save({ session });
    });

    return res.json({ ok: true, orderId, status: payment?.status });
  } catch (error) {
    return next(error);
  } finally {
    if (session) await session.endSession();
  }
});

export default router;
