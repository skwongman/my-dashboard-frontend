# Image Whiteboard Feature

A comprehensive image upload and whiteboard component that allows users to:
- Paste screenshots directly using Ctrl+V
- Drag and drop images from desktop
- Upload multiple files at once
- Share public URLs of uploaded images

## Features

### Frontend (Vue 3 + Ant Design Vue)
- **Canvas Area**: Large clickable area accepting paste/drag-drop
- **File Selection**: Traditional file picker fallback
- **Upload Progress**: Real-time progress indicators
- **Image Gallery**: Grid display with metadata
- **URL Management**: One-click copy-to-clipboard
- **Bulk Operations**: Delete individual or all images
- **Mobile Responsive**: Works on all device sizes

### Backend (Express.js + Sequelize + Cloudflare R2)
- **User Isolation**: Images belong to authenticated users only
- **File Validation**: MIME type and size checking (10MB limit)
- **Cloudflare R2 Integration**: S3-compatible storage with CDN
- **JWT Authentication**: Uses existing auth middleware
- **Error Handling**: Comprehensive error management

## File Structure

```
my-dashboard-frontend/
├── src/components/ImageWhiteboard.vue    # Main component
└── src/views/Dashboard.vue               # Menu integration

my-dashboard-api/
├── models/image.model.js                 # Database model
├── controllers/image.controller.js       # Business logic
├── routes/images.js                      # API endpoints
└── app.js                                # Route mounting & multer config
```

## API Endpoints

### Upload Image
```
POST /api/images/upload
Headers: x-access-token: <jwt_token>
Body: FormData with 'image' field
Response: { id, url, filename, originalName, fileSize, createdAt }
```

### Get User Images
```
GET /api/images
Headers: x-access-token: <jwt_token>
Response: [{ id, filename, originalName, publicUrl, fileSize, created_at }]
```

### Delete Image
```
DELETE /api/images/:id
Headers: x-access-token: <jwt_token>
Response: { message: "Image deleted successfully" }
```

## Environment Configuration

### Backend (.env)
```env
# Cloudflare R2 Configuration
R2_ACCESS_KEY_ID=your_account_access_key_id
R2_SECRET_ACCESS_KEY=your_account_secret_access_key
R2_BUCKET_NAME=your_bucket_name
R2_ACCOUNT_ID=your_account_id
R2_PUBLIC_DOMAIN=https://your-domain.r2.dev

# Security Settings
MAX_FILE_SIZE=10485760  # 10MB in bytes
ALLOWED_MIME_TYPES=image/jpeg,image/png,image/gif,image/webp
```

## Dependencies Added

### Backend
- `aws-sdk` - S3-compatible SDK for Cloudflare R2
- `multer` - File upload middleware
- `uuid` - Generate unique filenames

### Frontend
- No additional dependencies (uses existing axios)

## Security Features

- **Authentication**: All endpoints require valid JWT tokens
- **User Isolation**: Images linked to userId via foreign key
- **File Validation**: MIME type and size limits enforced
- **Secure Storage**: Credentials stored in .env (not committed to git)
- **CORS**: Configured for secure cross-origin requests

## Usage Instructions

### For Users
1. Navigate to "Whiteboard" in dashboard menu
2. Click canvas or paste screenshot (Ctrl+V)
3. Drag images from desktop into canvas
4. Select files using "Select Files" button
5. Copy public URLs from gallery using copy button
6. Delete unwanted images using delete button

### For Development
1. Set up Cloudflare R2 account and bucket
2. Configure environment variables in both frontend and backend
3. Run migrations to create image table
4. Test upload flow with valid JWT token
5. Verify user isolation and URL sharing

## Testing Scenarios

### Functional Tests
- [ ] Paste screenshot works
- [ ] Drag and drop works
- [ ] File selection works
- [ ] Multiple file upload works
- [ ] Upload progress shows correctly
- [ ] Images appear in gallery with metadata
- [ ] URL copying works
- [ ] Individual deletion works
- [ ] Bulk deletion works
- [ ] Error handling works

### Security Tests
- [ ] Unauthenticated access rejected
- [ ] User can only access own images
- [ ] Invalid file types rejected
- [ ] Oversized files rejected
- [ ] Credentials not exposed in responses

### Performance Tests
- [ ] Large file uploads handled gracefully
- [ ] Multiple concurrent uploads work
- [ ] Gallery loads efficiently
- [ ] Mobile responsive design works

## Troubleshooting

### Common Issues

**Upload fails with network error:**
- Check Cloudflare R2 credentials
- Verify bucket permissions
- Ensure CORS is configured

**Images don't appear after upload:**
- Check JWT token validity
- Verify user authentication
- Check browser console for errors

**Copy to clipboard fails:**
- Check browser clipboard permissions
- Verify HTTPS connection

### Debug Steps
1. Check browser developer tools Network tab
2. Verify JWT token in localStorage
3. Check server logs for errors
4. Test with Postman/curl first

## Future Enhancements

- [ ] Image compression before upload
- [ ] Thumbnail generation
- [ ] Search and filter functionality
- [ ] Image editing capabilities
- [ ] Folder/category organization
- [ ] Export functionality
- [ ] Rate limiting for uploads
- [ ] Analytics tracking

## Support

For issues or questions about this feature:
1. Check the troubleshooting section above
2. Review browser console for errors
3. Check server logs
4. Verify environment configuration