 const { protect } = require("../middleware/auth"); // path ঠিক করো

// GET /api/notifications
router.get("/", protect, async (req, res) => {
  try {
    const { isRead, limit = 20, category } = req.query;

    const filter = { userId: req.user.id }; // ✅ req.user.id (decoded থেকে আসে)

    if (isRead === "false") filter.isRead = false;
    if (isRead === "true") filter.isRead = true;
    if (category) filter.category = category;

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    const unreadCount = await Notification.countDocuments({ 
      userId: req.user.id,  // ✅ এখানেও userId filter
      isRead: false 
    });

    res.json({
      success: true,
      notifications,
      unreadCount,
      count: notifications.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});