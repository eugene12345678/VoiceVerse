# VoiceVerse Backend Deployment Guide for Render

This guide will walk you through deploying your VoiceVerse backend to Render, a modern cloud platform that makes deployment simple and scalable.

## 📋 Prerequisites

Before deploying, ensure you have:
- A Render account (sign up at [render.com](https://render.com))
- Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)
- All required API keys and environment variables
- A MySQL database (we'll set this up on Render)

## 🗄️ Step 1: Set Up MySQL Database on Render

### 1.1 Create a PostgreSQL Database (Recommended Alternative)
Since Render doesn't offer managed MySQL, we'll use PostgreSQL which is fully supported:

1. **Log into Render Dashboard**
2. **Click "New +" → "PostgreSQL"**
3. **Configure Database:**
   - **Name:** `voiceverse-db`
   - **Database:** `voiceverse`
   - **User:** `voiceverse_user`
   - **Region:** Choose closest to your users
   - **Plan:** Start with Free tier for testing

4. **Save the connection details** (you'll need these for environment variables)

### 1.2 Update Prisma Schema for PostgreSQL
You'll need to update your `schema.prisma` file:

```prisma
// Change this line:
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// To this:
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 1.3 Alternative: Use PlanetScale (MySQL)
If you prefer to keep MySQL:
1. Sign up at [PlanetScale](https://planetscale.com)
2. Create a new database
3. Get the connection string
4. Keep your current Prisma schema

## 🚀 Step 2: Prepare Your Backend for Deployment

### 2.1 Create Build Script
Add a build script to your `server/package.json`:

```json
{
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "build": "npx prisma generate && npx prisma migrate deploy",
    "postinstall": "npx prisma generate",
    "kill-server": "./killserver.sh",
    "restart": "npm run kill-server && npm run dev",
    "test": "echo \"Error: no test specified\" && exit 1"
  }
}
```

### 2.2 Create Render Configuration File
Create `render.yaml` in your project root:

```yaml
services:
  - type: web
    name: voiceverse-backend
    env: node
    buildCommand: cd server && npm install && npx prisma generate && npx prisma migrate deploy
    startCommand: cd server && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: voiceverse-db
          property: connectionString
      - key: JWT_SECRET
        generateValue: true
      - key: JWT_EXPIRES_IN
        value: 7d
      - key: PORT
        value: 10000
    autoDeploy: false

databases:
  - name: voiceverse-db
    databaseName: voiceverse
    user: voiceverse_user
```

### 2.3 Update Server Configuration
Modify your `server/src/index.js` to handle production environment:

```javascript
// Add at the top after require statements
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Update CORS configuration
app.use(cors({
  origin: isProduction 
    ? ['https://your-frontend-domain.com', 'https://voiceverse.netlify.app'] 
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

// Update static file serving for production
if (isProduction) {
  // Serve static files from a cloud storage service in production
  // For now, we'll keep the local serving but you should migrate to AWS S3 or similar
  app.use('/api/audio', express.static(path.join(process.cwd(), 'uploads', 'audio')));
  // ... other static routes
}

// Update port handling
const PORT = process.env.PORT || 10000; // Render uses port 10000 by default
```

## 🔧 Step 3: Deploy to Render

### 3.1 Create Web Service
1. **Go to Render Dashboard**
2. **Click "New +" → "Web Service"**
3. **Connect your Git repository**
4. **Configure the service:**
   - **Name:** `voiceverse-backend`
   - **Environment:** `Node`
   - **Region:** Choose closest to your users
   - **Branch:** `main` (or your deployment branch)
   - **Root Directory:** `server` (if your server code is in a subdirectory)
   - **Build Command:** `npm install && npx prisma generate && npx prisma migrate deploy`
   - **Start Command:** `npm start`

### 3.2 Configure Environment Variables
Add these environment variables in Render:

```bash
# Database
DATABASE_URL=postgresql://username:password@host:port/database
# (This will be auto-filled if you connected the database)

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_EXPIRES_IN=7d

# Server
NODE_ENV=production
PORT=10000

# Email Configuration
EMAIL_FROM=your-email@gmail.com
EMAIL_PASS=your-app-password

# Stripe
STRIPE_SECRET_KEY=sk_live_your_live_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Calendly
CALENDY_ACCESS_TOKEN=your_calendly_token

# API Keys
ELEVENLABS_API_KEY=sk_your_elevenlabs_api_key
LINGO_API_KEY=api_your_lingo_api_key

# Frontend URL (for CORS)
FRONTEND_URL=https://your-frontend-domain.com
```

### 3.3 Connect Database
1. **In your web service settings**
2. **Go to "Environment" tab**
3. **Add DATABASE_URL** and select your PostgreSQL database
4. **Render will automatically populate the connection string**

## 📁 Step 4: Handle File Uploads in Production

### 4.1 Current File Storage Issue
Your current setup stores files locally, which won't work on Render (files are ephemeral). You need cloud storage.

### 4.2 Recommended Solution: AWS S3
Create `server/src/config/storage.js`:

```javascript
const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET,
    acl: 'public-read',
    key: function (req, file, cb) {
      const folder = file.fieldname === 'audio' ? 'audio' : 'images';
      cb(null, `${folder}/${Date.now()}-${file.originalname}`);
    }
  })
});

module.exports = upload;
```

Add to your environment variables:
```bash
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=voiceverse-uploads
```

### 4.3 Alternative: Cloudinary
For easier setup, use Cloudinary:

```bash
npm install cloudinary multer-storage-cloudinary
```

Create `server/src/config/cloudinary.js`:

```javascript
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'voiceverse',
    allowed_formats: ['jpg', 'png', 'mp3', 'wav', 'ogg'],
    resource_type: 'auto'
  }
});

const upload = multer({ storage: storage });

module.exports = { upload, cloudinary };
```

## 🔄 Step 5: Database Migration

### 5.1 Run Initial Migration
After deployment, you may need to run migrations manually:

1. **Go to your Render service**
2. **Open the "Shell" tab**
3. **Run migration commands:**
```bash
cd server
npx prisma migrate deploy
npx prisma db seed # if you have seed data
```

### 5.2 Automatic Migrations
Your build command already includes migration deployment, so future deployments will automatically run migrations.

## 🌐 Step 6: Update Frontend Configuration

Update your frontend API URL to point to your Render backend:

```javascript
// In your frontend .env file
VITE_API_URL=https://voiceverse-backend.onrender.com/api
```

## 📊 Step 7: Monitoring and Logs

### 7.1 View Logs
- **Go to your Render service dashboard**
- **Click on "Logs" tab**
- **Monitor real-time logs for debugging**

### 7.2 Health Checks
Render automatically monitors your service health. Ensure your root route (`/`) returns a proper response:

```javascript
app.get('/', (req, res) => {
  res.json({ 
    message: 'VoiceVerse API is running!',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Add health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});
```

## 🔒 Step 8: Security Considerations

### 8.1 Environment Variables
- **Never commit `.env` files**
- **Use strong, unique secrets**
- **Rotate API keys regularly**

### 8.2 CORS Configuration
Update CORS for production:

```javascript
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL, 'https://voice-verse-two.vercel.app']
    : ['http://localhost:3000', 'https://voice-verse-two.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

## 🚨 Common Issues and Solutions

### Issue 1: Database Connection Errors
**Solution:** Ensure DATABASE_URL is correctly formatted for PostgreSQL:
```
postgresql://username:password@host:port/database?sslmode=require
```

### Issue 2: File Upload Failures
**Solution:** Implement cloud storage (S3/Cloudinary) as local storage doesn't persist on Render.

### Issue 3: Build Failures
**Solution:** Check that all dependencies are in `package.json` and build commands are correct.

### Issue 4: Environment Variable Issues
**Solution:** Double-check all environment variables are set in Render dashboard.

### Issue 5: CORS Errors
**Solution:** Update CORS configuration to include your frontend domain.

## 📈 Step 9: Performance Optimization

### 9.1 Enable Compression
```javascript
const compression = require('compression');
app.use(compression());
```

### 9.2 Add Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### 9.3 Database Connection Pooling
Prisma handles this automatically, but ensure your DATABASE_URL includes connection pooling parameters.

## 🔄 Step 10: Continuous Deployment

### 10.1 Auto-Deploy Setup
1. **In Render service settings**
2. **Enable "Auto-Deploy"**
3. **Choose your deployment branch**
4. **Every push to this branch will trigger a deployment**

### 10.2 Manual Deployment
- **Go to your service dashboard**
- **Click "Manual Deploy"**
- **Select branch and deploy**

## 📋 Deployment Checklist

- [ ] Database created and connected
- [ ] All environment variables configured
- [ ] Prisma schema updated for PostgreSQL (if using)
- [ ] Build and start commands configured
- [ ] CORS updated for production domain
- [ ] File storage migrated to cloud service
- [ ] Frontend API URL updated
- [ ] Health check endpoints added
- [ ] Security measures implemented
- [ ] Monitoring and logging set up

## 🎉 Your VoiceVerse Backend is Now Live!

After following this guide, your VoiceVerse backend should be successfully deployed on Render. Your API will be available at:

```
https://your-service-name.onrender.com
```

## 📞 Support and Troubleshooting

If you encounter issues:
1. **Check Render logs** for error messages
2. **Verify environment variables** are correctly set
3. **Test database connection** using Render shell
4. **Check CORS configuration** if frontend can't connect
5. **Monitor resource usage** and upgrade plan if needed

## 🚀 Next Steps

1. **Deploy your frontend** (Netlify, Vercel, or Render)
2. **Set up custom domain** for professional URLs
3. **Configure CDN** for better performance
4. **Set up monitoring** and alerts
5. **Implement backup strategy** for your database

Your VoiceVerse platform is now ready to serve users worldwide! 🌍✨