 const Withdraw = require("../models/Withdraw");
const User = require("../models/User");

// USER REQUEST
exports.createWithdraw = async (req, res) => {
  try {
    const { amount, method, accountNo } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (amount < 500)
      return res.status(400).json({ message: "Minimum ৳500" });

    if (user.balance < amount)
      return res.status(400).json({ message: "Insufficient balance" });

    const pending = await Withdraw.findOne({
      user: user._id,
      status: "pending",
    });

    if (pending)
      return res.status(400).json({ message: "Pending request exists" });

    const withdraw = await Withdraw.create({
      user: user._id,
      amount,
      method,
      accountNo,
    });

    res.json({ message: "Request submitted", withdraw });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

// USER HISTORY
exports.myWithdraw = async (req, res) => {
  const data = await Withdraw.find({ user: req.user.id })
    .sort({ createdAt: -1 });

  res.json(data);
};

// ADMIN ALL
exports.getAllWithdraw = async (req, res) => {
  const data = await Withdraw.find()
    .populate("user", "name balance")
    .sort({ createdAt: -1 });

  res.json(data);
};

// APPROVE
exports.approveWithdraw = async (req, res) => {
  const { trxId, note, adminName } = req.body;

  const withdraw = await Withdraw.findById(req.params.id);
  if (!withdraw) return res.status(404).json({ message: "Not found" });

  if (withdraw.status !== "pending")
    return res.status(400).json({ message: "Already processed" });

  const user = await User.findById(withdraw.user);

  if (!user || user.balance < withdraw.amount)
    return res.status(400).json({ message: "Insufficient balance" });

  user.balance -= withdraw.amount;
  await user.save();

  withdraw.status = "approved";
  withdraw.trxId = trxId;
  withdraw.note = note || "Paid";
  withdraw.approvedBy = adminName;

  await withdraw.save();

  res.json({ message: "Approved", withdraw });
};

// REJECT
exports.rejectWithdraw = async (req, res) => {
  const { note, adminName } = req.body;

  const withdraw = await Withdraw.findById(req.params.id);
  if (!withdraw) return res.status(404).json({ message: "Not found" });

  if (withdraw.status !== "pending")
    return res.status(400).json({ message: "Already processed" });

  withdraw.status = "rejected";
  withdraw.note = note || "Rejected";
  withdraw.rejectedBy = adminName;

  await withdraw.save();

  res.json({ message: "Rejected", withdraw });
};