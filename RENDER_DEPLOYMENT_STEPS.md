# VoiceVerse Backend Deployment to Render

## Quick Deployment Guide

Since you're using Supabase PostgreSQL, your database is already set up. Follow these steps to deploy your backend to Render:

### Step 1: Prepare for Deployment

Your server is now optimized for production. The key changes made:
- ✅ Production-ready CORS configuration
- ✅ Environment-specific server startup
- ✅ Health check endpoints
- ✅ Graceful shutdown handling

### Step 2: Deploy to Render

1. **Go to [render.com](https://render.com)** and sign in
2. **Click "New +" → "Web Service"**
3. **Connect your GitHub repository**
4. **Configure the service:**

   ```
   Name: voiceverse-backend
   Environment: Node
   Region: Choose closest to your users (e.g., Oregon for US West)
   Branch: main
   Root Directory: server
   Build Command: npm install && npx prisma generate
   Start Command: npm start
   ```

### Step 3: Environment Variables

Add these environment variables in Render (Environment tab). **Replace placeholder values with your actual API keys from your local .env file:**

```bash
# Server Configuration
NODE_ENV=production
PORT=10000

# Database (Your existing Supabase connection)
DATABASE_URL=postgresql://postgres.svyicqtzrzcwbwdvakij:Eugomath7$@aws-0-us-west-1.pooler.supabase.com:5432/postgres

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-key-here-make-it-long-and-random
JWT_EXPIRES_IN=7d

# Email Configuration
EMAIL_FROM=eugenemathenge4@gmail.com
EMAIL_PASS=yklq kdkv ssfk fxes

# Stripe Payment Processing
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here

# Calendly Integration
CALENDY_ACCESS_TOKEN=your_calendly_access_token_here

# AI API Keys
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
LINGO_API_KEY=your_lingo_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Translation API
LIBRETRANSLATE_API_URL=https://translate.monocles.de/translate
LIBRETRANSLATE_API_KEY=

# Frontend URL (for CORS)
FRONTEND_URL=https://voice-verse-two.vercel.app

# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyDnPv8154IsGR5OVToS6wzACLnkgqE5gJU
VITE_FIREBASE_AUTH_DOMAIN=seo-demo-b2da8.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seo-demo-b2da8
VITE_FIREBASE_STORAGE_BUCKET=seo-demo-b2da8.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=860768473241
VITE_FIREBASE_APP_ID=1:860768473241:web:01a1670be78eea1d066808
VITE_FIREBASE_MEASUREMENT_ID=G-15LF51FJTP
```

### Step 4: Deploy

1. **Click "Create Web Service"**
2. **Wait for the build to complete** (usually 3-5 minutes)
3. **Check the logs** for any errors
4. **Test your deployment** by visiting the provided URL

### Step 5: Test Your Deployment

Once deployed, your API will be available at:
```
https://voiceverse-backend.onrender.com
```

Test these endpoints:
- `GET /` - Should return API status
- `GET /health` - Should return health check
- `GET /api/health` - Should return detailed health info

### Step 6: Update Frontend Configuration

Update your frontend environment variables to point to your new backend:

```bash
# In your frontend .env file
VITE_API_URL=https://voiceverse-backend.onrender.com/api
```

### Step 7: File Storage Consideration

⚠️ **Important**: Render uses ephemeral storage, meaning uploaded files will be lost when your service restarts. For production, you should migrate to cloud storage:

**Recommended Solutions:**
1. **Cloudinary** (easiest for audio/images)
2. **AWS S3** (most flexible)
3. **Supabase Storage** (since you're already using Supabase)

### Step 8: Enable Auto-Deploy

1. **In your Render service settings**
2. **Enable "Auto-Deploy"**
3. **Select your main branch**
4. **Every push will trigger automatic deployment**

## Troubleshooting

### Common Issues:

1. **Build Fails**: Check that all dependencies are in package.json
2. **Database Connection**: Verify your DATABASE_URL is correct
3. **CORS Errors**: Ensure FRONTEND_URL matches your frontend domain
4. **File Upload Issues**: Files are stored locally and will be lost on restart

### Monitoring:

- **Logs**: Available in Render dashboard
- **Health Check**: Visit `/health` endpoint
- **Performance**: Monitor in Render metrics

## Next Steps

1. ✅ Deploy backend to Render
2. 🔄 Update frontend API URL
3. 🗄️ Consider migrating to cloud storage
4. 🔒 Generate new JWT secret for production
5. 💳 Switch to live Stripe keys for production
6. 📊 Set up monitoring and alerts

Your VoiceVerse backend will be live and ready to serve your frontend! 🚀