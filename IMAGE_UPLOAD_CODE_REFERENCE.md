# Image Upload Enhancement - Code Reference & Examples

## Quick Integration Guide

### How Package Creation Now Works

**Before:**
```
User fills form → Package created → (Optional) Image upload
```

**After:**
```
User fills form → Package created → Auto-navigate to UploadImagesScreen → Upload multiple images
```

---

## Code Examples

### 1. Frontend: Upload Single Image with Cover Flag

```javascript
const handleUploadCoverImage = async (image, packageId) => {
  const formData = new FormData();
  formData.append('packageId', packageId);
  formData.append('isCover', true);  // Mark as cover
  formData.append('image', {
    uri: image.uri,
    name: image.fileName,
    type: 'image/jpeg',
  });

  try {
    const { data } = await uploadImage(formData);
    console.log('Cover image uploaded:', data.image);
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

### 2. Frontend: Fetch and Display Images

```javascript
const handleFetchImages = async (packageId) => {
  try {
    const { data } = await getImagesByPackage(packageId);
    
    // Access cover and gallery separately
    const cover = data.coverImage;
    const gallery = data.galleryImages;
    
    if (cover) {
      console.log('Cover image URL:', cover.url);
    }
    
    gallery.forEach(img => {
      console.log('Gallery image:', img.url);
    });
  } catch (error) {
    console.error('Fetch failed:', error);
  }
};
```

### 3. Backend: Handle Cover Image Logic

**In Controller:**
```javascript
// When isCover=true, automatically remove previous cover
if (isCover === 'true' || isCover === true) {
  const existingCover = await Image.findOne({ packageId, isCover: true });
  if (existingCover) {
    // Delete old cover file
    const oldFilePath = path.resolve(__dirname, '../../uploads', existingCover.filename);
    await fs.promises.unlink(oldFilePath).catch(() => {});
    // Delete old cover from DB
    await existingCover.deleteOne();
  }
}

// Create new image
const image = await Image.create({
  url: `/uploads/${req.file.filename}`,
  filename: req.file.filename,
  packageId: pkg._id,
  isCover: isCover === 'true' || isCover === true ? true : false,
});
```

### 4. Backend: Separate Cover from Gallery

**In Controller:**
```javascript
// Get all images
const images = await Image.find({ packageId }).sort({ uploadedAt: -1 });

// Separate cover and gallery
const coverImage = images.find(img => img.isCover);
const galleryImages = images.filter(img => !img.isCover);

// Return with both formats for compatibility
res.json({ 
  success: true, 
  coverImage: coverImage || null,
  galleryImages,
  images // backward compatibility
});
```

### 5. Frontend: Auto-Navigate After Package Creation

**In AdminPackages:**
```javascript
const handleSave = async () => {
  // ... form validation ...

  try {
    let savedPackage;
    let isNewPackage = false;

    if (editingPackage) {
      // Update existing package
      const { data } = await updatePackage(editingPackage._id, payload);
      savedPackage = data.data || data;
    } else {
      // Create new package
      const { data } = await createPackage(payload);
      savedPackage = data.data || data;
      isNewPackage = true;  // Flag that this is new
    }

    // Upload image if selected
    if (selectedImage && savedPackage?._id) {
      await uploadPackageImage(savedPackage._id);
    }

    // Auto-navigate to upload screen for NEW packages only
    if (isNewPackage && savedPackage?._id) {
      navigation.navigate('UploadImages', { packageId: savedPackage._id });
    }
  } catch (err) {
    Alert.alert('Error', err.message);
  }
};
```

### 6. Frontend: Multi-Image Selection in UploadImagesScreen

```javascript
const pickMultipleImages = async () => {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultiple: true,  // KEY: Allow multiple
      quality: 0.8,
    });

    if (!result.cancelled) {
      const newImages = result.assets || [result];
      setSelectedImages(prev => [...prev, ...newImages]);  // Append to list
    }
  } catch (err) {
    Alert.alert('Error', 'Unable to select images');
  }
};
```

### 7. Frontend: Mark One Image as Cover

```javascript
const [selectedImages, setSelectedImages] = useState([]);
const [coverImageIndex, setCoverImageIndex] = useState(null);

const handleToggleCover = (index) => {
  // If clicking same image, deselect cover
  if (coverImageIndex === index) {
    setCoverImageIndex(null);
  } else {
    // Otherwise, set as new cover
    setCoverImageIndex(index);
  }
};

// In upload loop:
for (let i = 0; i < selectedImages.length; i++) {
  const image = selectedImages[i];
  const isCover = i === coverImageIndex;  // Compare with selected index
  
  const formData = prepareImageFormData(image, isCover);
  await uploadImage(formData);
}
```

### 8. Frontend: Display Cover Separately

**In PackageDetails:**
```javascript
// State for cover and gallery
const [coverImage, setCoverImage] = useState(null);
const [galleryImages, setGalleryImages] = useState([]);

// Fetch and separate
const [packageRes, imagesRes] = await Promise.all([
  getPackageById(packageId),
  getImagesByPackage(packageId),
]);

// Handle both new and old API response formats
const imagesData = imagesRes.data;
if (imagesData.coverImage !== undefined) {
  // New format
  setCoverImage(imagesData.coverImage);
  setGalleryImages(imagesData.galleryImages || []);
} else {
  // Old format (backward compatibility)
  setGalleryImages(imagesData.images || []);
}
```

### 9. Frontend: Render Cover Image

```jsx
{(coverImage || pkg.image) && (
  <View style={styles.coverImageSection}>
    <Image
      source={{
        uri: coverImage
          ? resolveUploadUrl(coverImage.url)
          : resolveUploadUrl(pkg.image),
      }}
      style={styles.coverImage}
      resizeMode="cover"
    />
    {coverImage && (
      <TouchableOpacity
        style={styles.coverDeleteButton}
        onPress={() => handleDeleteImage(coverImage._id)}
      >
        <Text style={styles.deleteIcon}>×</Text>
      </TouchableOpacity>
    )}
    <View style={styles.coverBadge}>
      <Text style={styles.coverBadgeText}>Cover Image</Text>
    </View>
  </View>
)}
```

### 10. Frontend: Render Gallery Images

```jsx
{galleryImages.length > 0 && (
  <View style={styles.gallerySection}>
    <Text style={styles.sectionTitle}>Gallery</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {galleryImages.map((image) => (
        <View key={image._id} style={styles.imageContainer}>
          <Image
            source={{ uri: resolveUploadUrl(image.url) }}
            style={styles.galleryImage}
            resizeMode="cover"
          />
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteImage(image._id)}
          >
            <Text style={styles.deleteIcon}>×</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  </View>
)}
```

---

## Common Patterns

### Pattern 1: Check if Package Has Cover Image

```javascript
const hasCoverImage = (imageData) => imageData.coverImage !== null && imageData.coverImage !== undefined;
```

### Pattern 2: Get All Package Images (Combined)

```javascript
const getAllImages = (imageData) => {
  const images = [];
  if (imageData.coverImage) images.push(imageData.coverImage);
  if (imageData.galleryImages) images.push(...imageData.galleryImages);
  return images;
};
```

### Pattern 3: Upload with Error Handling

```javascript
const uploadWithRetry = async (formData, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const { data } = await uploadImage(formData);
      return data.image;
    } catch (error) {
      if (attempt === retries) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};
```

### Pattern 4: Batch Upload with Progress

```javascript
const batchUpload = async (images, packageId) => {
  let uploaded = 0;
  const results = [];

  for (let i = 0; i < images.length; i++) {
    try {
      const formData = prepareFormData(images[i], packageId, i === 0);
      const result = await uploadImage(formData);
      results.push(result);
      uploaded++;
      
      // Progress callback
      onProgress?.(uploaded / images.length);
    } catch (error) {
      console.error(`Image ${i} failed:`, error);
    }
  }

  return { uploaded, total: images.length, results };
};
```

---

## Troubleshooting

### Q: Images upload but don't show cover/gallery separation?
**A:** Ensure backend is returning new format. Check:
```javascript
// Should have both:
{
  coverImage: { ... },
  galleryImages: [ ... ],
  images: [ ... ]  // backward compat
}
```

### Q: Previous cover image not being deleted?
**A:** Check that `isCover === 'true' || isCover === true` condition works correctly:
```javascript
// Should handle both string and boolean
const isCoverFlag = isCover === 'true' || isCover === true;
```

### Q: Navigation not working after package creation?
**A:** Ensure:
1. `useNavigation()` is imported in component
2. `isNewPackage` flag is set correctly (only for new, not edit)
3. `packageId` is passed in route params

### Q: Old packages showing as no images?
**A:** This is backward compatible by design. They'll show package.image as fallback or appear in gallery array.

---

## Performance Tips

1. **Image Compression:** Set quality to 0.7-0.8 before upload
2. **Batch Uploads:** Upload multiple images in parallel with Promise.all()
3. **Lazy Loading:** Load package details before images
4. **Caching:** Cache image URLs to prevent re-renders
5. **Cleanup:** Clear selected images state after upload

---

## Security Notes

✅ **Protected Operations:**
- Upload requires authentication
- Delete requires authentication
- Package ownership verified server-side
- File type validation on backend

✅ **Safe for Production:**
- No breaking changes
- Modular implementation
- Full backward compatibility
- Error handling at all levels
