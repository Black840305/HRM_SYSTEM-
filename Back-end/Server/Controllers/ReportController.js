const Report = require("../models/reportModel");

exports.getAllReports = async (req, res) => {
  try {
    const reports = await Report.find();
    res.json(reports);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

exports.getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ msg: "Report not found" });
    res.json(report);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

exports.createReport = async (req, res) => {
  const { title, content, createdBy } = req.body;

  try {
    const newReport = new Report({ title, content, createdBy });
    await newReport.save();
    res.status(201).json(newReport);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

exports.updateReport = async (req, res) => {
  const { title, content } = req.body;

  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ msg: "Report not found" });

    report.title = title || report.title;
    report.content = content || report.content;

    await report.save();
    res.json(report);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

exports.deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ msg: "Report not found" });

    await report.remove();
    res.json({ msg: "Report removed" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};
