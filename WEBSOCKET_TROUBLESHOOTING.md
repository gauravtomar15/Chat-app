# 🔧 WebSocket Connection Troubleshooting Guide

## ⚠️ Important: Vercel Limitation

**Vercel does NOT support WebSocket connections!** 

Vercel's serverless functions are stateless and cannot maintain persistent WebSocket connections that Socket.io requires for real-time messaging.

## ✅ Solution: Deploy Backend Separately

You **MUST** deploy your backend server to a platform that supports WebSockets:

### Recommended Platforms:
1. **Railway** (Recommended) - https://railway.app
2. **Render** - https://render.com
3. **Heroku** - https://heroku.com
4. **DigitalOcean App Platform** - https://www.digitalocean.com/products/app-platform

### ❌ Platforms that DON'T support WebSockets:
- Vercel (serverless functions)
- Netlify (serverless functions)
- AWS Lambda (serverless)

## 📋 Deployment Steps

### 1. Deploy Backend to Railway (Example)

1. Go to [Railway.app](https://railway.app)
2. Sign up/Login with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. **Set Root Directory to `server`**
6. Add Environment Variables:
   ```
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```
7. Railway will give you a URL like: `https://your-app.railway.app`

### 2. Update Frontend Environment Variable

In your Vercel project settings:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add/Update:
   ```
   VITE_BACKEND_URL=https://your-app.railway.app
   ```
4. **Redeploy** your frontend

### 3. Update CORS in Backend

Update `server/server.js` with your actual Vercel URL:

```javascript
origin: [
  "http://localhost:5173", 
  "http://localhost:3000",
  "https://your-actual-vercel-url.vercel.app", // Your real Vercel URL
  /\.vercel\.app$/, // Allow all Vercel preview URLs
]
```

Then redeploy your backend.

## 🔍 Common Errors & Solutions

### Error: "Socket connection error: websocket error"

**Cause:** Backend is deployed on Vercel or WebSocket connection is failing.

**Solutions:**
1. ✅ Ensure backend is deployed to Railway/Render (NOT Vercel)
2. ✅ Check `VITE_BACKEND_URL` is set correctly in Vercel environment variables
3. ✅ Verify backend URL is accessible (visit `https://your-backend-url.railway.app/api/status`)
4. ✅ Check CORS configuration includes your Vercel URL
5. ✅ Ensure backend server is running and not sleeping

### Error: Messages not sending to other users

**Cause:** Socket.io connection is not established.

**Solutions:**
1. ✅ Check browser console for connection errors
2. ✅ Verify socket is connected (should see "Socket connected successfully" in console)
3. ✅ Check that both users have valid socket connections
4. ✅ Ensure backend `userSocketMap` is working correctly

### Error: CORS errors

**Cause:** Backend CORS doesn't include your frontend URL.

**Solutions:**
1. ✅ Update CORS origins in `server/server.js`
2. ✅ Include both production and preview URLs
3. ✅ Redeploy backend after CORS changes

## 🧪 Testing Your Setup

1. **Test Backend:**
   - Visit: `https://your-backend-url.railway.app/api/status`
   - Should return: "Server is ready"

2. **Test Frontend:**
   - Open browser console
   - Should see: "Socket connected successfully"
   - Check Network tab for WebSocket connection

3. **Test Real-time:**
   - Open app in two different browsers/tabs
   - Send a message from one
   - Should appear instantly in the other

## 📝 Environment Variables Checklist

### Frontend (Vercel):
- [ ] `VITE_BACKEND_URL` - Your Railway/Render backend URL

### Backend (Railway/Render):
- [ ] `PORT` - Usually 5000
- [ ] `MONGODB_URI` - MongoDB connection string
- [ ] `JWT_SECRET` - Secret key for JWT tokens
- [ ] `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- [ ] `CLOUDINARY_API_KEY` - Cloudinary API key
- [ ] `CLOUDINARY_API_SECRET` - Cloudinary API secret

## 🚀 Quick Fix Checklist

If you're still having issues:

1. [ ] Backend deployed to Railway/Render (NOT Vercel)
2. [ ] `VITE_BACKEND_URL` set in Vercel environment variables
3. [ ] CORS updated with actual Vercel URL
4. [ ] Both frontend and backend redeployed after changes
5. [ ] Backend URL is accessible (test in browser)
6. [ ] Browser console shows "Socket connected successfully"
7. [ ] No CORS errors in browser console

## 💡 Additional Notes

- The code now includes automatic reconnection logic
- Socket will try to reconnect up to 5 times if connection fails
- Polling transport is used as fallback if WebSocket fails
- Connection errors are logged to console for debugging

If you've followed all steps and still have issues, check:
- Backend server logs in Railway/Render dashboard
- Browser console for specific error messages
- Network tab in browser DevTools for failed requests

