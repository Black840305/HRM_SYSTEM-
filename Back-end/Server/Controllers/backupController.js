const Backup = require("../models/backupModel");

exports.getAllBackups = async (req, res) => {
  try {
    const backups = await Backup.find();
    res.json(backups);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

exports.getBackupById = async (req, res) => {
  try {
    const backup = await Backup.findById(req.params.id);
    if (!backup) return res.status(404).json({ msg: "Backup not found" });
    res.json(backup);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

exports.createBackup = async (req, res) => {
  const { fileName } = req.body;

  try {
    const newBackup = new Backup({ fileName });
    await newBackup.save();
    res.status(201).json(newBackup);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

exports.updateBackup = async (req, res) => {
  const { fileName } = req.body;

  try {
    const backup = await Backup.findById(req.params.id);
    if (!backup) return res.status(404).json({ msg: "Backup not found" });

    backup.fileName = fileName || backup.fileName;

    await backup.save();
    res.json(backup);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

exports.deleteBackup = async (req, res) => {
  try {
    const backup = await Backup.findById(req.params.id);
    if (!backup) return res.status(404).json({ msg: "Backup not found" });

    await backup.remove();
    res.json({ msg: "Backup removed" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};
