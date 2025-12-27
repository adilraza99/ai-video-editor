# 🚀 Render Deployment Guide

## Why Render?
- ✅ Deploy EVERYTHING in one place (frontend + backend + database)
- ✅ Free tier available (no credit card needed)
- ✅ Auto-detects Node.js and React
- ✅ Simple GitHub integration

---

## 📦 What We'll Deploy

```
Frontend (React) → Render Static Site
Backend (Node.js) → Render Web Service  
Database (MongoDB) → Render MongoDB
```

All in ONE platform!

---

## 🎯 Step-by-Step Deployment

### Step 1: Create Render Account (2 minutes)

1. Go to https://render.com
2. Click "Get Started" or "Sign Up"
3. Choose "Sign up with GitHub"
4. Authorize Render to access your repositories
5. You'll see the Render dashboard

---

### Step 2: Deploy Backend (5 minutes)

#### 2.1 Create Web Service
1. Click "New +" button (top right)
2. Select "Web Service"
3. Click "Build and deploy from a Git repository"
4. Click "Next"

#### 2.2 Connect Repository
1. Find and select `ai-video-editor` repository
2. Click "Connect"

#### 2.3 Configure Service
Fill in these settings:

**Name**: `ai-video-editor-backend` (or any name you prefer)

**Region**: Choose closest to you

**Branch**: `main`

**Root Directory**: `backend`

**Runtime**: `Node`

**Build Command**: `npm install`

**Start Command**: `node server.js`

**Instance Type**: `Free`

#### 2.4 Add Environment Variables
Click "Advanced" → Add these environment variables:

```
PORT = 5001
NODE_ENV = production
JWT_SECRET = your-super-secret-jwt-key-change-this
JWT_EXPIRE = 7d
UPLOAD_DIR = uploads
MAX_FILE_SIZE = 512000000
```

Leave `MONGODB_URI` empty for now - we'll add it after creating MongoDB.

Leave `FRONTEND_URL` empty - we'll add it after deploying frontend.

#### 2.5 Deploy
1. Click "Create Web Service"
2. Render will start building and deploying
3. Wait for "Live" status (takes 2-3 minutes)
4. Copy your backend URL (like `https://ai-video-editor-backend.onrender.com`)

---

### Step 3: Deploy MongoDB (3 minutes)

#### 3.1 Create Database
1. Click "New +" button
2. Select "PostgreSQL" → Wait, we need MongoDB!
3. Actually, Render doesn't offer MongoDB directly

**MongoDB Options:**
- **Option A**: Use MongoDB Atlas (free tier)
- **Option B**: Add MongoDB as a separate service

**I recommend Option A - MongoDB Atlas:**

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up (free)
3. Create free cluster
4. Get connection string
5. Whitelist IP: `0.0.0.0/0` (allow from anywhere)
6. Copy connection string

#### 3.2 Add MongoDB URL to Backend
1. Go back to Render dashboard
2. Click on your backend service
3. Go to "Environment" tab
4. Add new variable:
   - **Key**: `MONGODB_URI`
   - **Value**: Your MongoDB Atlas connection string
5. Click "Save Changes"
6. Service will auto-redeploy

---

### Step 4: Deploy Frontend (5 minutes)

#### 4.1 Create Static Site
1. Click "New +" button
2. Select "Static Site"
3. Connect to same repository
4. Click "Connect"

#### 4.2 Configure Static Site
Fill in these settings:

**Name**: `ai-video-editor` (or any name)

**Branch**: `main`

**Root Directory**: `frontend`

**Build Command**: `npm install && npm run build`

**Publish Directory**: `dist`

#### 4.3 Add Environment Variable
Click "Advanced" → Add:

```
VITE_API_URL = https://your-backend-url.onrender.com
```

(Use the backend URL from Step 2.5)

#### 4.4 Deploy
1. Click "Create Static Site"
2. Wait for deployment (2-3 minutes)
3. Get your frontend URL (like `https://ai-video-editor.onrender.com`)

---

### Step 5: Update Backend with Frontend URL

1. Go to backend service in Render
2. Environment tab
3. Add variable:
   - **Key**: `FRONTEND_URL`
   - **Value**: Your frontend URL from Step 4.4
4. Save (auto-redeploys)

---

## ✅ Verification

### Test Your Deployed App

1. **Open frontend URL**: `https://your-app.onrender.com`
2. **Test signup**: Create new account
3. **Test login**: Login with credentials
4. **Upload video**: Try uploading a small video
5. **Generate voiceover**: Test AI features
6. **Export**: Download the video

### Check Backend Health
Visit: `https://your-backend.onrender.com/health`

Should return: `{"status":"OK","message":"Server is running"}`

---

## 🔧 Important Notes

### Free Tier Limitations

**Render Free Tier:**
- Services spin down after 15 min of inactivity
- First request after sleep takes ~30 seconds
- 750 hours/month free
- Limited bandwidth

**MongoDB Atlas Free Tier:**
- 512 MB storage
- Unlimited connections
- Forever free!

### File Upload Issues

⚠️ **Important**: Render free tier doesn't persist files after restart!

For production, you'll need:
- **AWS S3** for file storage
- **Cloudinary** for media hosting
- Or upgrade to Render paid plan with persistent disk

For now (testing), uploads work but **will be lost when service restarts**.

---

## 📊 Expected URLs

After deployment, you'll have:

```
Frontend: https://ai-video-editor.onrender.com
Backend: https://ai-video-editor-backend.onrender.com
Backend Health: https://ai-video-editor-backend.onrender.com/health
MongoDB: mongodb+srv://username:password@cluster.mongodb.net/
```

---

## 🐛 Troubleshooting

### Build Failed

**Check:**
- Root directory is correct (`backend` or `frontend`)
- `package.json` exists in root directory
- Build command is correct

**View logs**: Click on service → "Logs" tab

### Frontend Can't Connect to Backend

**Check:**
1. `VITE_API_URL` is set correctly in frontend
2. Backend is "Live" (not "Failed")
3. CORS is configured in backend for frontend URL

### MongoDB Connection Failed

**Check:**
1. Connection string is correct
2. Database user has read/write permissions
3. IP whitelist includes `0.0.0.0/0`

### Service Keeps Sleeping

**Normal on free tier!** First request after sleep takes ~30 seconds.

**Solution**: Upgrade to paid plan ($7/month) for always-on service.

---

## 💰 Costs

| Service | Free Tier | Paid |
|---------|-----------|------|
| Render Web Service | 750 hrs/month | $7/month (always-on) |
| Render Static Site | 100GB/month | Free! |
| MongoDB Atlas | 512MB forever | $9/month |

**Total Cost**: $0/month for testing! 🎉

---

## 🎉 You're Done!

Your app is now live and accessible from anywhere!

**Share your app:**
- Frontend URL: Share with anyone
- GitHub Repo: Show your code
- Demo the features!

---

## 📝 Quick Reference

### Render Dashboard
https://dashboard.render.com

### MongoDB Atlas Dashboard  
https://cloud.mongodb.com

### Your App URLs
- Frontend: `https://[your-frontend].onrender.com`
- Backend: `https://[your-backend].onrender.com`

---

**Need help?** Check Render docs or ask for assistance!
