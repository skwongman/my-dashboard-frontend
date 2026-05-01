# Image Whiteboard Setup Guide

Complete step-by-step instructions to configure and deploy the Image Upload/Whiteboard feature.

## 📋 **PREREQUISITES**

Before starting, ensure you have:
- ✅ Cloudflare account (free tier available)
- ✅ Node.js installed (v14+ recommended)
- ✅ Access to both frontend and backend directories
- ✅ Existing dashboard application running locally

---

## ☁️ **CLOUDFLARE R2 SETUP**

### Step 1: Create Cloudflare Account & R2 Bucket
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Sign in or create a free account
3. Navigate to **R2 Storage** section
4. Click **Create a bucket**
5. Enter your desired bucket name (e.g., `your-app-images`)
6. Click **Create bucket**

### Step 2: Get Your Credentials
1. In Cloudflare Dashboard, go to **Account Home** → **API Tokens**
2. Click **Create Token** → **Use template** → **Object Read & Write**
3. Configure token with these permissions:
   - **Account Resources**: R2 Storage (your account)
   - **Bucket Resources**: Select your bucket
4. Copy the generated **API Token** (this is your access key)
5. Note down your **Account ID** from the top of the dashboard

### Step 3: Configure Bucket Permissions
1. Go back to your R2 bucket
2. Under **Settings**, enable **Public access** for objects you want to share
3. Set up CORS policy (for development):
   ```json
   [
     {
       "AllowedOrigin": "*",
       "AllowedMethod": ["GET", "PUT", "DELETE"],
       "AllowedHeader": ["*"],
       "ExposeHeader": ["ETag"]
     }
   ]
   ```

---

## 🔧 **BACKEND CONFIGURATION**

### Step 1: Install Dependencies
```bash
cd ~/Downloads/my-dashboard-api
npm install aws-sdk multer uuid
```

### Step 2: Configure Environment Variables
Edit `~/Downloads/my-dashboard-api/.env` and replace the placeholder values:

```env
# Cloudflare R2 Configuration (REPLACE WITH YOUR ACTUAL CREDENTIALS)
R2_ACCESS_KEY_ID=your_actual_access_key_id
R2_SECRET_ACCESS_KEY=your_actual_secret_access_key  
R2_BUCKET_NAME=your_actual_bucket_name  
R2_ACCOUNT_ID=your_actual_account_id
R2_PUBLIC_DOMAIN=https://your-domain.r2.dev

# Security Settings
MAX_FILE_SIZE=10485760  # 10MB in bytes
ALLOWED_MIME_TYPES=image/jpeg,image/png,image/gif,image/webp
```

**How to find each value:**
- **R2_ACCESS_KEY_ID**: The API Token you copied (without "Bearer " prefix)
- **R2_SECRET_ACCESS_KEY**: Same as above (the full token string)
- **R2_BUCKET_NAME**: Name of your R2 bucket (e.g., `your-app-images`)
- **R2_ACCOUNT_ID**: Your Cloudflare Account ID
- **R2_PUBLIC_DOMAIN**: Either `https://<account-id>.r2.dev` or your custom domain

### Step 3: Test Database Connection
```bash
node -e "
require('dotenv').config();
const db = require('./models');
db.sequelize.authenticate()
  .then(() => console.log('✅ Database connected successfully'))
  .catch(err => console.error('❌ Database connection failed:', err));
"
```

### Step 4: Sync Database Models
```bash
node -e "require('./models').sequelize.sync()"
```
You should see: `Sequelize [undefined] synchronize`

---

## 🎨 **FRONTEND CONFIGURATION**

### Step 1: Verify Frontend Environment
Your `~/Downloads/my-dashboard-frontend/.env` should already contain:
```env
VITE_API_URL_LOCAL=http://localhost:3001
VITE_API_URL_LIVE=https://your-production-api.com
```

**No changes needed** - the frontend uses existing configuration.

### Step 2: Start Development Servers

**Backend Server:**
```bash
cd ~/Downloads/my-dashboard-api
npm run dev
```
Expected output: `Server running on port 3001`

**Frontend Server:**
```bash
cd ~/Downloads/my-dashboard-frontend
npm run dev
```
Expected output: `Local: http://localhost:5173`

---

## 🧪 **TESTING THE FEATURE**

### Step 1: Login to Dashboard
1. Open browser to `http://localhost:5173`
2. Login with your existing credentials
3. You should see the new "Whiteboard" menu item in the sidebar

### Step 2: Test Image Upload
1. Click on **Whiteboard** menu item
2. **Test Method A - Paste Screenshot:**
   - Take a screenshot (Ctrl+Shift+S on Windows/Linux, Cmd+Shift+4 on Mac)
   - Paste it into the canvas area (Ctrl+V)
   - Watch upload progress indicator

3. **Test Method B - Drag & Drop:**
   - Find an image file on your desktop
   - Drag it directly into the canvas area
   - Observe upload progress

4. **Test Method C - File Selection:**
   - Click the "Select Files" button
   - Choose one or more image files
   - Confirm upload completion

### Step 3: Test Gallery & Sharing
1. After successful upload, images should appear in the gallery grid
2. **Copy URL Test:**
   - Hover over any uploaded image
   - Click the copy button (📋 icon)
   - Paste the URL into a new browser tab to verify public accessibility

3. **Delete Test:**
   - Click the delete button (🗑️ icon) on any image
   - Confirm deletion works and image disappears from gallery

### Step 4: Test User Isolation
1. Login as different user (or use incognito mode)
2. Verify they can only see their own uploaded images
3. Confirm images from other users are not accessible

---

## 🐛 **TROUBLESHOOTING**

### Common Issues & Solutions

#### Issue 1: Upload fails with network error
**Error Message:** `NetworkError: Failed to fetch`
**Solution:**
1. Check backend server is running: `ps aux | grep node`
2. Verify R2 credentials in `.env` are correct
3. Test R2 connectivity:
   ```bash
   curl -H "Authorization: Bearer $R2_ACCESS_KEY_ID" \
        https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com
   ```

#### Issue 2: Images don't appear after upload
**Error Message:** Gallery remains empty
**Solution:**
1. Check browser console for errors (F12 → Console)
2. Verify JWT token exists: `localStorage.getItem('token')`
3. Test API endpoint directly with Postman/curl

#### Issue 3: Copy to clipboard doesn't work
**Error Message:** URL not copied to clipboard
**Solution:**
1. Ensure you're on HTTPS (required for clipboard API)
2. Check browser permissions for clipboard access
3. Try manual copy: right-click → "Copy link address"

#### Issue 4: File too large error
**Error Message:** `File too large. Maximum size is 10MB.`
**Solution:**
1. Compress images before uploading
2. The limit is hardcoded at 10MB - check your file size

#### Issue 5: Authentication fails
**Error Message:** `jwt expired` or `Unauthorized`
**Solution:**
1. Login again to get fresh JWT token
2. Clear browser cache and cookies
3. Check if backend authentication middleware is working

---

## 🔍 **DEBUGGING STEPS**

### Browser Developer Tools
1. Open DevTools (F12)
2. Go to **Console** tab - look for JavaScript errors
3. Go to **Network** tab - filter by `/api/images` requests
4. Check request headers for `x-access-token`
5. Examine response status codes and messages

### Backend Logging
Check server logs for:
```bash
cd ~/Downloads/my-dashboard-api
npm run dev  # Logs will appear here
```

Look for:
- Authentication errors
- Upload processing errors
- Database query failures
- Network timeouts

### Database Verification
Check if image records were created:
```sql
-- Connect to your database and run:
SELECT * FROM images ORDER BY created_at DESC LIMIT 5;
```

---

## 📊 **MONITORING & MAINTENANCE**

### Cloudflare R2 Usage Monitoring
1. Go to Cloudflare Dashboard → R2 Storage
2. Monitor **Usage** tab for storage and bandwidth
3. Stay within free tier limits (10GB storage + 100GB bandwidth)

### Error Tracking
Add logging to identify issues:
```javascript
// In controllers/image.controller.js, wrap operations:
console.log('Upload started:', file.originalname);
try {
  // ... upload logic
  console.log('Upload completed:', filename);
} catch (err) {
  console.error('Upload failed:', err);
}
```

### Performance Optimization
For better performance with many images:
1. Implement pagination in gallery
2. Add lazy loading for images
3. Consider implementing image compression

---

## 🚀 **PRODUCTION DEPLOYMENT**

### Backend Production Checklist
- ✅ Use production environment variables
- ✅ Set proper CORS origins (not "*")
- ✅ Enable HTTPS
- ✅ Add rate limiting for uploads
- ✅ Monitor R2 usage costs
- ✅ Set up error monitoring

### Frontend Production Checklist
- ✅ Build optimized assets: `npm run build`
- ✅ Deploy to your hosting provider
- ✅ Update `VITE_API_URL_LIVE` to production API URL
- ✅ Test on production environment

---

## 💡 **ADVANCED CONFIGURATION**

### Customizing File Limits
To change maximum file size:
1. Edit `app.js` multer configuration:
```javascript
limits: {
  fileSize: parseInt(process.env.MAX_FILE_SIZE) || 20971520, // 20MB
}
```
2. Update `.env`: `MAX_FILE_SIZE=20971520`

### Adding More File Types
To support additional image formats:
1. Edit `.env`: `ALLOWED_MIME_TYPES=image/jpeg,image/png,image/gif,image/webp,image/svg+xml`

### Custom Domain for R2
Set up your own domain:
1. Point DNS to R2 endpoint
2. Update `R2_PUBLIC_DOMAIN` in `.env`
3. Configure SSL certificate

---

## 📚 **REFERENCE LINKS**

- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [Multer Middleware](https://github.com/expressjs/multer)
- [Vue 3 Composition API](https://vuejs.org/api/composition-api.html)

---

## 🎉 **CONGRATULATIONS!**

You now have a fully functional Image Upload/Whiteboard feature integrated into your dashboard!

If you encounter any issues during setup or testing, feel free to ask for help. Happy coding! 🚀