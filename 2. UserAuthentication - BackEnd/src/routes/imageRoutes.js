const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth.middleware');
const upload = require('../middleware/uploadMiddleware');
const {
  uploadImage,
  getImagesByPackage,
  deleteImage,
} = require('../controllers/imageController');

router.post('/upload', auth, upload.single('image'), uploadImage);
router.get('/package/:packageId', getImagesByPackage);
router.delete('/:id', auth, deleteImage);

module.exports = router;
