# Image Upload Module - Enhancement Documentation

## Overview
Enhanced the image upload system to support:
- **Multiple images** per travel package
- **Cover image** (single main image marked as special)
- **Gallery images** (all other images for the package)

---

## BACKEND CHANGES

### 1. Image Model Updated
**File:** `2. UserAuthentication - BackEnd/src/models/Image.js`

```javascript
{
  url: String,                           // Image file path
  filename: String,                      // Original filename
  packageId: ObjectId (ref: Package),    // Reference to package
  isCover: Boolean (default: false),     // True if this is the cover image
  uploadedAt: Date                       // Upload timestamp
}
```

**Rules:**
- Only ONE image can have `isCover = true` per package
- When setting `isCover = true`, automatically removes previous cover image
- Multiple gallery images allowed (isCover = false)

### 2. Image Controller Enhanced
**File:** `2. UserAuthentication - BackEnd/src/controllers/imageController.js`

#### `uploadImage()` - POST /api/images/upload
**Behavior:**
- Accepts `isCover` parameter in request body
- If `isCover = true`: Removes existing cover for that package before uploading
- Saves new image with appropriate `isCover` flag
- Returns uploaded image details

**Request FormData:**
```
image: File        // Image file
packageId: String  // Target package ID
isCover: Boolean   // Optional (default: false)
```

#### `getImagesByPackage()` - GET /api/images/package/:packageId
**New Response Format:**
```javascript
{
  success: true,
  coverImage: {                    // Single object or null
    _id, url, filename, isCover, uploadedAt
  },
  galleryImages: [                 // Array of objects
    { _id, url, filename, isCover, uploadedAt }
  ],
  images: [...]                    // Backward compatibility
}
```

#### `deleteImage()` - DELETE /api/images/:id
- Deletes image from database
- Removes file from uploads folder
- Works for both cover and gallery images

### 3. Routes (No changes needed)
**File:** `2. UserAuthentication - BackEnd/src/routes/imageRoutes.js`

Routes remain the same - controller handles new logic internally

---

## FRONTEND CHANGES

### 1. New Screen: UploadImagesScreen
**File:** `1. UserAuthentication - FrontEnd/src/screens/packages/UploadImagesScreen.jsx`

**Features:**
- Multi-image selection (expo-image-picker)
- Set one image as cover (visual indicator with star icon)
- Preview all selected images before upload
- Progress indicator during upload
- Batch upload all images at once
- Option to add more images before uploading

**Props:**
- `route.params.packageId` - Package ID to upload images to

**Navigation:**
```javascript
navigation.navigate('UploadImages', { packageId: packageId })
```

### 2. Updated Navigation
**File:** `1. UserAuthentication - FrontEnd/src/navigation/MainNavigator.jsx`

Added new screen route:
```javascript
<Stack.Screen 
  name="UploadImages" 
  component={UploadImagesScreen} 
  options={{ title: 'Upload Package Images', ...modalOpts }} 
/>
```

### 3. Updated AdminPackages Screen
**File:** `1. UserAuthentication - FrontEnd/src/screens/packages/AdminPackages.jsx`

**Changes:**
- Added `useNavigation()` hook
- After successful package creation (not edit):
  - Automatically navigates to `UploadImagesScreen`
  - Passes `packageId` as route parameter
  - User can upload multiple images immediately

**Workflow:**
1. User fills package form
2. Package is created successfully
3. Modal closes
4. Auto-navigates to UploadImagesScreen
5. User can select and upload images

### 4. Updated Image API
**File:** `1. UserAuthentication - FrontEnd/src/api/image.api.js`

No breaking changes - all functions remain the same:
- `uploadImage(formData)` - Supports `isCover` in FormData
- `getImagesByPackage(packageId)` - Returns cover + gallery
- `deleteImage(id)` - Works for all image types
- `resolveUploadUrl(url)` - Unchanged

### 5. Enhanced PackageDetails Screen
**File:** `1. UserAuthentication - FrontEnd/src/screens/packages/PackageDetails.jsx`

**New Structure:**
1. **Cover Image Section** (Top)
   - Large, prominent display
   - Shows "Cover Image" badge
   - Delete button to remove cover
   - Takes full width

2. **Package Info Section** (Middle)
   - Title, price, description (unchanged)
   - Ratings and reviews (unchanged)

3. **Gallery Section** (Bottom)
   - Only shows gallery images (non-cover)
   - Horizontal scrollable view
   - Each image has delete option
   - Only shows if gallery has images

**State Management:**
- `coverImage` - Single image object
- `galleryImages` - Array of non-cover images
- Backward compatible with old API responses

**Delete Handling:**
- Deleting cover image: clears `coverImage` state
- Deleting gallery image: removes from `galleryImages` array
- Refreshes display immediately

---

## API ENDPOINTS REFERENCE

### Upload Image
```
POST /api/images/upload
Headers: Content-Type: multipart/form-data, Authorization: Bearer token

FormData:
  - image: File
  - packageId: String
  - isCover: Boolean (optional)

Response:
{
  success: true,
  image: {
    _id: String,
    url: String,
    filename: String,
    packageId: String,
    isCover: Boolean,
    uploadedAt: ISO Date
  }
}
```

### Get Images by Package
```
GET /api/images/package/:packageId

Response:
{
  success: true,
  coverImage: { ... } or null,
  galleryImages: [ ... ],
  images: [ ... ]  // for backward compatibility
}
```

### Delete Image
```
DELETE /api/images/:id
Headers: Authorization: Bearer token

Response:
{
  success: true,
  message: "Image deleted"
}
```

---

## USAGE FLOW

### Admin Creating Package with Images

1. **Navigate to Admin Packages**
   - Tap "Manage Packages"

2. **Create New Package**
   - Tap "+ Add New Package"
   - Fill form (Title, Description, Price)
   - Optionally select thumbnail for package list
   - Tap "Create Package"

3. **Auto-Navigate to Image Upload**
   - Screen automatically shows UploadImagesScreen
   - PackageId passed automatically

4. **Select and Upload Images**
   - Tap "Add More Images"
   - Select multiple images
   - Mark one as cover image (optional)
   - Tap "Upload Images"
   - Progress indicator shows upload status

5. **View in Package Details**
   - Cover image displays prominently at top
   - Gallery images below in horizontal scroll
   - Both have delete options

### Viewing Package (User/Admin)

1. **Package Details Screen**
   - Large cover image displayed at top
   - Title, price, description below
   - Ratings section
   - Gallery section with other images below
   - Each image can be deleted (admin only)

---

## BACKWARD COMPATIBILITY

✅ **All existing functionality preserved:**
- Old packages without images still work
- Package.image field still supported (fallback)
- Old API response format still accessible via `images` array
- No changes to authentication or other modules
- No database migrations needed (isCover defaults to false)

---

## SAFETY FEATURES

✅ **Non-Breaking Changes:**
- Image model safely extends with optional fields
- Controller logic is additive only
- API responses include both new and old formats
- Frontend gracefully handles both response types
- Package form logic completely unchanged
- No existing data is modified or deleted

---

## TESTING CHECKLIST

### Backend
- [ ] Create package
- [ ] Upload image with isCover=false → saves as gallery
- [ ] Upload image with isCover=true → becomes cover
- [ ] Upload another image with isCover=true → removes previous cover
- [ ] Get images → returns correct coverImage and galleryImages
- [ ] Delete cover image → coverImage becomes null
- [ ] Delete gallery image → removed from gallery

### Frontend
- [ ] Create package → auto-navigates to UploadImagesScreen
- [ ] Select multiple images → all shown in preview
- [ ] Mark image as cover → shows star badge
- [ ] Upload images → all uploaded successfully
- [ ] PackageDetails → displays cover at top and gallery below
- [ ] Delete cover → cover section updates
- [ ] Delete gallery → gallery updates

---

## FILE CHANGES SUMMARY

### Backend
- ✅ Updated: `Image.js` (model)
- ✅ Updated: `imageController.js` (logic)
- ✅ No changes: `imageRoutes.js`

### Frontend
- ✅ Created: `UploadImagesScreen.jsx` (new screen)
- ✅ Updated: `MainNavigator.jsx` (added route)
- ✅ Updated: `AdminPackages.jsx` (navigation logic)
- ✅ Updated: `image.api.js` (no breaking changes)
- ✅ Updated: `PackageDetails.jsx` (display logic)

---

## NOTES

- Cover image is optional (package can have gallery-only)
- Package can have multiple gallery images
- Cover image automatically replaces previous when setting isCover=true
- Original package form remains untouched
- No TravelPackage model modifications needed
- All changes are modular and isolated
