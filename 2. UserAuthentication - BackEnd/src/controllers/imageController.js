const fs = require('fs');
const path = require('path');
const Image = require('../models/Image');
const Package = require('../models/Package');
const AppError = require('../utils/AppError');

exports.uploadImage = async (req, res, next) => {
  try {
    const { packageId, isCover } = req.body;
    if (!packageId) {
      return next(new AppError('packageId is required', 400));
    }

    if (!req.file) {
      return next(new AppError('Image file is required', 400));
    }

    const pkg = await Package.findById(packageId);
    if (!pkg) {
      return next(new AppError('Package not found', 404));
    }

    // If this is a cover image, remove existing cover for this package
    if (isCover === 'true' || isCover === true) {
      const existingCover = await Image.findOne({ packageId, isCover: true });
      if (existingCover) {
        const oldFilePath = path.resolve(__dirname, '../../uploads', existingCover.filename);
        await fs.promises.unlink(oldFilePath).catch(() => {});
        await existingCover.deleteOne();
      }
    }

    const image = await Image.create({
      url: `/uploads/${req.file.filename}`,
      filename: req.file.filename,
      packageId: pkg._id,
      isCover: isCover === 'true' || isCover === true ? true : false,
    });

    res.status(201).json({ success: true, image });
  } catch (error) {
    next(error);
  }
};

exports.getImagesByPackage = async (req, res, next) => {
  try {
    const { packageId } = req.params;
    const images = await Image.find({ packageId }).sort({ uploadedAt: -1 });

    // Separate cover and gallery images
    const coverImage = images.find(img => img.isCover);
    const galleryImages = images.filter(img => !img.isCover);

    res.json({ 
      success: true, 
      coverImage: coverImage || null,
      galleryImages,
      images // Keep for backward compatibility
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteImage = async (req, res, next) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) {
      return next(new AppError('Image not found', 404));
    }

    const filePath = path.resolve(__dirname, '../../uploads', image.filename);
    await fs.promises.unlink(filePath).catch(() => {});

    await image.deleteOne();
    res.json({ success: true, message: 'Image deleted' });
  } catch (error) {
    next(error);
  }
};
