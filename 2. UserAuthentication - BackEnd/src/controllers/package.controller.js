// src/controllers/package.controller.js
const Package = require('../models/Package');
const Image = require('../models/Image');

// GET all packages
exports.getPackages = async (req, res) => {
  const packages = await Package.find().sort({ createdAt: -1 });
  
  // Attach cover image URL for each package
  const packagesWithCover = await Promise.all(
    packages.map(async (pkg) => {
      const coverImage = await Image.findOne({ packageId: pkg._id, isCover: true });
      const pkgObj = pkg.toObject();
      pkgObj.coverImageUrl = coverImage ? coverImage.url : null;
      return pkgObj;
    })
  );
  
  res.json(packagesWithCover);
};

// GET one package
exports.getPackage = async (req, res) => {
  const pkg = await Package.findById(req.params.id);
  if (!pkg) return res.status(404).json({ message: 'Not found' });
  res.json(pkg);
};

// CREATE (admin)
exports.createPackage = async (req, res) => {
  try{
  const pkg = await Package.create({
    ...req.body,
    createdBy: req.user._id
  });
  res.status(201).json(pkg);
  } catch (err) {
    console.error(err); // 👈 see if it's a validator error
    res.status(400).json({ message: err.message });
  }
  
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