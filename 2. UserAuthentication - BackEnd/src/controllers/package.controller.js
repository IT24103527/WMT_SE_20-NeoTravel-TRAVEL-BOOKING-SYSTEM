// src/controllers/package.controller.js
const Package = require('../models/Package');

// GET all packages
exports.getPackages = async (req, res) => {
  const packages = await Package.find().sort({ createdAt: -1 });
  res.json(packages);
};

// GET one package
exports.getPackage = async (req, res) => {
  const pkg = await Package.findById(req.params.id);
  if (!pkg) return res.status(404).json({ message: 'Not found' });
  res.json(pkg);
};

// CREATE (admin)
exports.createPackage = async (req, res) => {
  const pkg = await Package.create({
    ...req.body,
    createdBy: req.user._id
  });
  res.status(201).json(pkg);
};

// UPDATE (admin)
exports.updatePackage = async (req, res) => {
  const pkg = await Package.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(pkg);
};

// DELETE (admin)
exports.deletePackage = async (req, res) => {
  await Package.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
};