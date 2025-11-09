# 🖼️ Image Upload API Documentation

## Base URL
```
http://localhost:3001/api/images
```

---

## Endpoints

### 1. Upload Single Image

**Endpoint:** `POST /api/images/upload`

**Content-Type:** `multipart/form-data`

**Request Body:**
```
image: [File] (required) - Image file to upload
userId: [String] (required) - User ID who is uploading
ticketId: [String] (optional) - Associated ticket ID
```

**Example using cURL:**
```bash
curl -X POST http://localhost:3001/api/images/upload \
  -F "image=@/path/to/image.jpg" \
  -F "userId=123456789" \
  -F "ticketId=TKT-ABC12345"
```

**Example using JavaScript (fetch):**
```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);
formData.append('userId', '123456789');
formData.append('ticketId', 'TKT-ABC12345'); // optional

const response = await fetch('http://localhost:3001/api/images/upload', {
  method: 'POST',
  body: formData
});

const result = await response.json();
```

**Response (Success 200):**
```json
{
  "success": true,
  "image": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "fileName": "photo.jpg",
    "url": "https://xxxxx.supabase.co/storage/v1/object/public/ticket-images/123456789/abc-def.jpg",
    "ticketId": "TKT-ABC12345",
    "userId": "123456789",
    "fileSize": 245678,
    "mimeType": "image/jpeg",
    "createdAt": "2025-11-05T10:30:00.000Z"
  }
}
```

**Response (Error 400):**
```json
{
  "success": false,
  "error": "userId is required"
}
```

---

### 2. Upload Multiple Images

**Endpoint:** `POST /api/images/upload-multiple`

**Content-Type:** `multipart/form-data`

**Request Body:**
```
images: [File[]] (required) - Multiple image files (max 10)
userId: [String] (required) - User ID who is uploading
ticketId: [String] (optional) - Associated ticket ID
```

**Example using cURL:**
```bash
curl -X POST http://localhost:3001/api/images/upload-multiple \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.jpg" \
  -F "userId=123456789" \
  -F "ticketId=TKT-ABC12345"
```

**Example using JavaScript:**
```javascript
const formData = new FormData();
for (let file of fileInput.files) {
  formData.append('images', file);
}
formData.append('userId', '123456789');
formData.append('ticketId', 'TKT-ABC12345');

const response = await fetch('http://localhost:3001/api/images/upload-multiple', {
  method: 'POST',
  body: formData
});

const result = await response.json();
```

**Response (Success 200):**
```json
{
  "success": true,
  "images": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "fileName": "photo1.jpg",
      "url": "https://xxxxx.supabase.co/storage/v1/object/public/ticket-images/123456789/abc-def1.jpg",
      "ticketId": "TKT-ABC12345",
      "userId": "123456789",
      "fileSize": 245678,
      "mimeType": "image/jpeg",
      "createdAt": "2025-11-05T10:30:00.000Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "fileName": "photo2.jpg",
      "url": "https://xxxxx.supabase.co/storage/v1/object/public/ticket-images/123456789/abc-def2.jpg",
      "ticketId": "TKT-ABC12345",
      "userId": "123456789",
      "fileSize": 189234,
      "mimeType": "image/jpeg",
      "createdAt": "2025-11-05T10:30:01.000Z"
    }
  ],
  "count": 2
}
```

---

### 3. Get Ticket Images

**Endpoint:** `GET /api/images/ticket/:ticketId`

**Parameters:**
- `ticketId` (path parameter) - The ticket ID

**Example:**
```bash
curl http://localhost:3001/api/images/ticket/TKT-ABC12345
```

**Response (Success 200):**
```json
{
  "success": true,
  "images": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "fileName": "photo.jpg",
      "url": "https://xxxxx.supabase.co/storage/v1/object/public/ticket-images/123456789/abc-def.jpg",
      "ticketId": "TKT-ABC12345",
      "userId": "123456789",
      "fileSize": 245678,
      "mimeType": "image/jpeg",
      "createdAt": "2025-11-05T10:30:00.000Z"
    }
  ]
}
```

---

### 4. Get User Images

**Endpoint:** `GET /api/images/user/:userId`

**Parameters:**
- `userId` (path parameter) - The user ID

**Example:**
```bash
curl http://localhost:3001/api/images/user/123456789
```

**Response (Success 200):**
```json
{
  "success": true,
  "images": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "fileName": "photo.jpg",
      "url": "https://xxxxx.supabase.co/storage/v1/object/public/ticket-images/123456789/abc-def.jpg",
      "ticketId": "TKT-ABC12345",
      "userId": "123456789",
      "fileSize": 245678,
      "mimeType": "image/jpeg",
      "createdAt": "2025-11-05T10:30:00.000Z"
    }
  ]
}
```

---

### 5. Delete Image

**Endpoint:** `DELETE /api/images/:imageId`

**Parameters:**
- `imageId` (path parameter) - The image ID to delete

**Request Body:**
```json
{
  "userId": "123456789"
}
```

**Example using cURL:**
```bash
curl -X DELETE http://localhost:3001/api/images/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{"userId": "123456789"}'
```

**Example using JavaScript:**
```javascript
const response = await fetch('http://localhost:3001/api/images/550e8400-e29b-41d4-a716-446655440000', {
  method: 'DELETE',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    userId: '123456789'
  })
});

const result = await response.json();
```

**Response (Success 200):**
```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

**Response (Error 400):**
```json
{
  "success": false,
  "error": "Image not found or unauthorized"
}
```

---

## File Upload Constraints

- **Max File Size:** 10 MB per file
- **Max Files:** 10 files per multi-upload request
- **Allowed Types:** image/* (JPEG, PNG, GIF, WebP, etc.)
- **Storage:** Supabase Storage bucket `ticket-images`

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "userId is required"
}
```

### 400 File Size Limit
```json
{
  "success": false,
  "error": "File size too large. Maximum size is 10MB"
}
```

### 400 Invalid File Type
```json
{
  "success": false,
  "error": "Only image files are allowed"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Error uploading image"
}
```

---

## Testing with Postman

### Upload Single Image

1. **Method:** POST
2. **URL:** `http://localhost:3001/api/images/upload`
3. **Body:** 
   - Select `form-data`
   - Add key `image` → Type: `File` → Select image file
   - Add key `userId` → Type: `Text` → Value: `123456789`
   - Add key `ticketId` → Type: `Text` → Value: `TKT-ABC12345` (optional)
4. **Send** request

### Upload Multiple Images

1. **Method:** POST
2. **URL:** `http://localhost:3001/api/images/upload-multiple`
3. **Body:**
   - Select `form-data`
   - Add key `images` → Type: `File` → Select multiple files
   - Add key `userId` → Type: `Text` → Value: `123456789`
   - Add key `ticketId` → Type: `Text` → Value: `TKT-ABC12345` (optional)
4. **Send** request

---

## Integration Examples

### React/Next.js Component

```jsx
import { useState } from 'react';

function ImageUploader({ userId, ticketId }) {
  const [uploading, setUploading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);

    const formData = new FormData();
    formData.append('image', file);
    formData.append('userId', userId);
    if (ticketId) formData.append('ticketId', ticketId);

    try {
      const response = await fetch('http://localhost:3001/api/images/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (result.success) {
        setUploadedImage(result.image);
        alert('Image uploaded successfully!');
      } else {
        alert('Upload failed: ' + result.error);
      }
    } catch (error) {
      alert('Upload error: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input 
        type="file" 
        accept="image/*" 
        onChange={handleUpload}
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}
      {uploadedImage && (
        <div>
          <p>Uploaded: {uploadedImage.fileName}</p>
          <img src={uploadedImage.url} alt={uploadedImage.fileName} width="200" />
        </div>
      )}
    </div>
  );
}
```

### Python Requests

```python
import requests

# Upload single image
with open('photo.jpg', 'rb') as f:
    files = {'image': f}
    data = {
        'userId': '123456789',
        'ticketId': 'TKT-ABC12345'
    }
    response = requests.post(
        'http://localhost:3001/api/images/upload',
        files=files,
        data=data
    )
    print(response.json())

# Get ticket images
response = requests.get('http://localhost:3001/api/images/ticket/TKT-ABC12345')
print(response.json())
```

---

## Notes

- All uploaded images are stored in Supabase Storage
- Images are publicly accessible via their URL
- User authentication is basic (userId matching only)
- For production, implement proper JWT authentication
- Consider adding rate limiting for uploads
- Monitor storage usage in Supabase dashboard

---

**Happy uploading! 🖼️**
