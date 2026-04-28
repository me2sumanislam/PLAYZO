 const express = require("express");
 const router  = express.Router();
 const Deposit = require("../models/Deposit");
 const User    = require("../models/User");
 
 // ══════════════════════════════════════════════════════
 // POST /api/wallet/deposit
 // User deposit submit করে
 // ══════════════════════════════════════════════════════
 router.post("/deposit", async (req, res) => {
   try {
     const { method, amount, trxId, userId } = req.body;
 
     if (!method || !amount || !trxId) {
       return res.status(400).json({
         success: false,
         message: "method, amount এবং trxId দিন",
       });
     }
 
     const deposit = await Deposit.create({
       method,
       amount: Number(amount),
       trxId,
       userId: userId || null,
     });
 
     res.json({ success: true, deposit });
   } catch (err) {
     res.status(500).json({ success: false, message: err.message });
   }
 });
 
 // ══════════════════════════════════════════════════════
 // GET /api/wallet/deposits
 // Admin — সব pending deposit দেখে
 // ══════════════════════════════════════════════════════
 router.get("/deposits", async (req, res) => {
   try {
     const deposits = await Deposit.find({ status: "pending" })
       .sort({ createdAt: -1 });
 
     res.json(deposits);
   } catch (err) {
     res.status(500).json({ message: err.message });
   }
 });
 
 // ══════════════════════════════════════════════════════
 // PATCH /api/wallet/deposit/:id
 // Admin — approve বা reject করে
 //
 // ✅ approve → User.balance += deposit.amount
 // ❌ reject  → balance change হয় না
 // ══════════════════════════════════════════════════════
 router.patch("/deposit/:id", async (req, res) => {
   try {
     const { status } = req.body;
 
     if (!["approved", "rejected"].includes(status)) {
       return res.status(400).json({
         success: false,
         message: "status হবে 'approved' অথবা 'rejected'",
       });
     }
 
     // ১. Deposit খোঁজো
     const deposit = await Deposit.findById(req.params.id);
     if (!deposit) {
       return res.status(404).json({
         success: false,
         message: "Deposit পাওয়া যায়নি",
       });
     }
 
     // ২. Already processed কিনা চেক
     if (deposit.status !== "pending") {
       return res.status(400).json({
         success: false,
         message: "এই request আগেই process হয়ে গেছে",
       });
     }
 
     // ৩. Status update
     deposit.status = status;
     await deposit.save();
 
     // ৪. Approve হলে → User এর balance বাড়াও
     if (status === "approved" && deposit.userId) {
       const user = await User.findByIdAndUpdate(
         deposit.userId,
         { $inc: { balance: deposit.amount } },
         { new: true }
       );
 
       return res.json({
         success: true,
         message: `✅ Approved! ৳${deposit.amount} user এর balance এ যোগ হয়েছে`,
         deposit,
         newBalance: user?.balance,
       });
     }
 
     res.json({
       success: true,
       message: status === "approved"
         ? "✅ Approved!"
         : "❌ Rejected",
       deposit,
     });
   } catch (err) {
     res.status(500).json({ success: false, message: err.message });
   }
 });
 
 module.exports = router;
 