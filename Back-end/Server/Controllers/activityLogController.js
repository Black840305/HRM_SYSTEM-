const ActivityLog = require("../models/activityLogModel");

exports.getAllActivityLogs = async (req, res) => {
  try {
    const activityLogs = await ActivityLog.find().populate("user");
    res.json(activityLogs);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

exports.getActivityLogById = async (req, res) => {
  try {
    const activityLog = await ActivityLog.findById(req.params.id).populate(
      "user"
    );
    if (!activityLog)
      return res.status(404).json({ msg: "Activity log not found" });
    res.json(activityLog);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

exports.createActivityLog = async (req, res) => {
  const { user, action } = req.body;

  try {
    const newActivityLog = new ActivityLog({ user, action });
    await newActivityLog.save();
    res.status(201).json(newActivityLog);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

exports.updateActivityLog = async (req, res) => {
  const { action } = req.body;

  try {
    const activityLog = await ActivityLog.findById(req.params.id);
    if (!activityLog)
      return res.status(404).json({ msg: "Activity log not found" });

    activityLog.action = action || activityLog.action;

    await activityLog.save();
    res.json(activityLog);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

exports.deleteActivityLog = async (req, res) => {
  try {
    const activityLog = await ActivityLog.findById(req.params.id);
    if (!activityLog)
      return res.status(404).json({ msg: "Activity log not found" });

    await activityLog.remove();
    res.json({ msg: "Activity log removed" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};
