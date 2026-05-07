# Presigned URL Implementation Guide (AWS S3)

## Why Use Presigned URLs?
- ✅ No large payloads through your server
- ✅ Direct upload to S3 from browser
- ✅ Reduced server bandwidth
- ✅ Better performance
- ✅ Scalable for large files

---

## Step 1: Install AWS SDK (Backend)

```bash
cd backend
npm install aws-sdk
```

---

## Step 2: Add AWS Credentials to .env

```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

---

## Step 3: Create S3 Utility (Backend)

**File: `backend/utils/s3Utils.js`**

```javascript
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

/**
 * Generate presigned URL for upload
 * @param {string} fileName - Original file name
 * @param {string} fileType - MIME type
 * @returns {Promise<{uploadURL: string, key: string}>}
 */
async function generatePresignedUploadURL(fileName, fileType) {
  const key = `items/${Date.now()}-${fileName}`;
  
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Expires: 300, // 5 minutes
    ContentType: fileType,
    ACL: 'public-read', // Or 'private' if you want
  };

  const uploadURL = await s3.getSignedUrlPromise('putObject', params);
  
  return {
    uploadURL,
    key,
    publicURL: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
  };
}

module.exports = { generatePresignedUploadURL };
```

---

## Step 4: Create Presigned URL Endpoint (Backend)

**File: `backend/routes/uploadRoutes.js`**

```javascript
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { generatePresignedUploadURL } = require('../utils/s3Utils');

// @desc    Get presigned URL for image upload
// @route   POST /api/upload/presigned-url
// @access  Private
router.post('/presigned-url', protect, async (req, res) => {
  try {
    const { fileName, fileType } = req.body;

    if (!fileName || !fileType) {
      return res.status(400).json({ message: 'fileName and fileType required' });
    }

    if (!fileType.startsWith('image/')) {
      return res.status(400).json({ message: 'Only images allowed' });
    }

    const { uploadURL, key, publicURL } = await generatePresignedUploadURL(fileName, fileType);

    res.json({ uploadURL, key, publicURL });
  } catch (error) {
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
});

module.exports = router;
```

**Add to `server.js`:**

```javascript
app.use('/api/upload', require('./routes/uploadRoutes'));
```

---

## Step 5: Frontend Upload Function

**File: `frontend/src/utils/s3Upload.js`**

```javascript
import axios from 'axios';
import { compressImage } from './imageCompression';

/**
 * Upload image to S3 using presigned URL
 * @param {File} file - Image file
 * @returns {Promise<string>} Public URL of uploaded image
 */
export async function uploadImageToS3(file) {
  try {
    // Step 1: Compress image
    const compressedBase64 = await compressImage(file, 1200, 0.8);
    
    // Convert base64 to blob
    const blob = await fetch(compressedBase64).then(r => r.blob());

    // Step 2: Get presigned URL from backend
    const token = localStorage.getItem('token');
    const { data } = await axios.post(
      'http://localhost:5000/api/upload/presigned-url',
      {
        fileName: file.name,
        fileType: file.type,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    // Step 3: Upload directly to S3
    await axios.put(data.uploadURL, blob, {
      headers: {
        'Content-Type': file.type,
      },
    });

    // Step 4: Return public URL
    return data.publicURL;
  } catch (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }
}
```

---

## Step 6: Use in ReportItem Component

```javascript
import { uploadImageToS3 } from '../utils/s3Upload';

const handleImageChange = async (e) => {
  const file = e.target.files[0];
  if (file && file.type.startsWith('image/')) {
    try {
      setLoading(true);
      
      // Upload to S3 and get URL
      const imageURL = await uploadImageToS3(file);
      
      setImageURL(imageURL);
      setImagePreview(imageURL);
      
      console.log('Image uploaded to S3:', imageURL);
    } catch (error) {
      alert('Failed to upload image: ' + error.message);
    } finally {
      setLoading(false);
    }
  }
};

const handleSubmit = async (e) => {
  e.preventDefault();
  
  const itemData = {
    title,
    type,
    category,
    location,
    date,
    imageURL, // S3 URL instead of base64
    // ... other fields
  };
  
  await createItem(itemData);
};
```

---

## Step 7: Update Item Model (Backend)

```javascript
imageURL: {
  type: String, // Now stores S3 URL instead of base64
},
```

---

## Flow Diagram

```
User selects image
      ↓
Frontend compresses image
      ↓
Frontend requests presigned URL from backend
      ↓
Backend generates presigned URL (S3)
      ↓
Frontend uploads directly to S3 using presigned URL
      ↓
Frontend receives S3 public URL
      ↓
Frontend sends S3 URL to backend (not the image)
      ↓
Backend saves S3 URL in MongoDB
```

---

## Benefits

| Method | Payload Size | Server Load | Speed |
|--------|--------------|-------------|-------|
| Base64 | ~1.5MB | High | Slow |
| Presigned URL | ~10KB | Low | Fast |

---

## AWS S3 Setup

1. Create S3 bucket
2. Enable public access (or use CloudFront)
3. Set CORS policy:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "POST", "GET"],
    "AllowedOrigins": ["http://localhost:5173"],
    "ExposeHeaders": []
  }
]
```

4. Create IAM user with S3 permissions
5. Get access keys

---

## Cost Comparison

**Base64 (Current):**
- Server bandwidth: High
- MongoDB storage: Expensive (16MB limit)
- Scalability: Limited

**S3 Presigned URL:**
- Server bandwidth: Minimal
- S3 storage: $0.023/GB/month
- Scalability: Unlimited

---

## Implementation Complete! 🚀

Choose your approach:
1. **Quick Fix**: Use compression (already implemented)
2. **Production**: Use presigned URLs (follow this guide)
