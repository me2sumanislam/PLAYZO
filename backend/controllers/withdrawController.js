 const Withdraw = require("../models/withdraw");
const User = require("../models/User");
const axios = require("axios");

// ─── SMS helper ───────────────────────────────────────────────────────────
const sendSMS = async (phone, message) => {
  try {
    const apiKey = process.env.SMS_API_KEY;
    const sender = process.env.SMS_SENDER_ID || "YourApp";
    if (!apiKey) return;

    await axios.get("https://api.greenweb.com.bd/api.php", {
      params: { token: apiKey, to: phone, message, sender },
    });
  } catch (err) {
    console.error("SMS failed:", err.message);
  }
};

// ─── USER: submit request ─────────────────────────────────────────────────
exports.createWithdraw = async (req, res) => {
  try {
    const { amount, method, accountNo } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (amount < 100)
      return res.status(400).json({ message: "Minimum ৳100" });

    if (user.balance < amount)
      return res.status(400).json({ message: "Insufficient balance" });

    const pending = await Withdraw.findOne({ user: user._id, status: "pending" });
    if (pending)
      return res.status(400).json({ message: "You already have a pending request" });

    // ✅ Balance কাটো
    user.balance -= amount;
    await user.save();

    const withdraw = await Withdraw.create({
      user: user._id,
      amount,
      method,
      accountNo,
    });

    res.json({ message: "Request submitted", withdraw });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── USER: my history ─────────────────────────────────────────────────────
exports.myWithdraw = async (req, res) => {
  try {
    const data = await Withdraw.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ─── ADMIN: all requests ──────────────────────────────────────────────────
exports.getAllWithdraw = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};

    const data = await Withdraw.find(filter)
      .populate("user", "phone name balance")
      .sort({ createdAt: -1 });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ─── ADMIN: approve ───────────────────────────────────────────────────────
exports.approveWithdraw = async (req, res) => {
  try {
    const { trxId, note, adminName } = req.body;

    const withdraw = await Withdraw.findById(req.params.id).populate("user", "phone name balance");
    if (!withdraw) return res.status(404).json({ message: "Not found" });
    if (withdraw.status !== "pending")
      return res.status(400).json({ message: "Already processed" });

    // ✅ Balance আগেই কাটা হয়েছে, এখন শুধু status update
    withdraw.status     = "approved";
    withdraw.trxId      = trxId || "";
    withdraw.note       = note  || "Payment sent";
    withdraw.approvedBy = adminName;
    await withdraw.save();

    const smsText = `আপনার ৳${withdraw.amount} উইথড্র রিকোয়েস্ট অনুমোদিত হয়েছে। ${withdraw.method}: ${withdraw.accountNo}${trxId ? `. TrxID: ${trxId}` : ""}`;
    await sendSMS(withdraw.user.phone, smsText);

    res.json({ message: "Approved", withdraw });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── ADMIN: reject ────────────────────────────────────────────────────────
exports.rejectWithdraw = async (req, res) => {
  try {
    const { note, adminName } = req.body;

    const withdraw = await Withdraw.findById(req.params.id).populate("user", "phone name balance");
    if (!withdraw) return res.status(404).json({ message: "Not found" });
    if (withdraw.status !== "pending")
      return res.status(400).json({ message: "Already processed" });

    // ✅ Reject হলে balance ফেরত দাও
    const user = await User.findById(withdraw.user._id);
    if (user) {
      user.balance += withdraw.amount;
      await user.save();
    }

    withdraw.status     = "rejected";
    withdraw.note       = note || "Rejected by admin";
    withdraw.rejectedBy = adminName;
    await withdraw.save();

    const smsText = `আপনার ৳${withdraw.amount} উইথড্র রিকোয়েস্ট বাতিল হয়েছে। কারণ: ${note || "Admin কর্তৃক বাতিল"}`;
    await sendSMS(withdraw.user.phone, smsText);

    res.json({ message: "Rejected", withdraw });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};