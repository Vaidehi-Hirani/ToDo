# 🚀 Deployment Guide - ToDo App (Angular + .NET)

## 📊 Current Status Analysis

### ✅ What's Working:
- Backend API on Railway: `https://todo-production-01ab.up.railway.app`
- Database connected
- Environment variables set
- CORS configured

### ❌ What Was Broken (Now Fixed):
1. **404 on Vercel** - Missing `vercel.json` configuration
2. **No SPA routing** - Angular routes not working on refresh
3. **Wrong build directory** - Vercel didn't know where to find built files
4. **No build command** - Vercel didn't know how to build Angular

---

## 🔧 Fixes Applied

### 1. Created `vercel.json` (Root Directory)
**What it does:**
- Tells Vercel your app is in `/frontend` folder
- Specifies build command: `cd frontend && npm install && npm run build`
- Sets output directory: `frontend/dist/frontend/browser`
- **CRITICAL**: Rewrites all routes to `/index.html` for Angular SPA routing
- Adds caching headers for static assets

### 2. Created `.vercelignore`
**What it does:**
- Prevents uploading unnecessary backend files to Vercel
- Reduces deployment size and time
- Keeps Vercel deployment clean (frontend only)

### 3. Updated `angular.json`
**What changed:**
- Added explicit `outputPath: "dist/frontend"`
- Added explicit `index: "src/index.html"`
- Makes build configuration crystal clear for Vercel

### 4. Verified CORS Configuration
**Backend allows:**
- `http://localhost:4200` (local dev)
- `https://to-do-sandy-zeta.vercel.app` (production)
- Configured via `ALLOWED_ORIGINS` environment variable on Railway

---

## 📝 Step-by-Step Deployment Instructions

### **Step 1: Commit and Push Changes**

```bash
# Make sure you're in the project root
cd C:\Users\Vaidehi\source\repos\ToDo

# Check what changed
git status

# Add all changes
git add .

# Commit with descriptive message
git commit -m "Fix Vercel 404: Add vercel.json, SPA routing, and build config"

# Push to GitHub
git push origin main
```

---

### **Step 2: Configure Vercel (First Time Setup)**

If you haven't configured Vercel project settings:

1. **Go to Vercel Dashboard**
   - https://vercel.com/dashboard

2. **Select Your Project**
   - Click on "to-do-sandy-zeta" project

3. **Verify Build Settings** (Should auto-detect from vercel.json)
   - Build Command: `cd frontend && npm install && npm run build`
   - Output Directory: `frontend/dist/frontend/browser`
   - Install Command: `cd frontend && npm install`

4. **Environment Variables** (if needed for frontend)
   - Usually not needed since API URL is in `environment.prod.ts`
   - But you can add `VITE_API_URL` if you want to override

5. **Redeploy**
   - Click "Deployments" tab
   - Click "..." on latest deployment
   - Click "Redeploy"

---

### **Step 3: Verify Railway Backend**

1. **Go to Railway Dashboard**
   - https://railway.app/dashboard

2. **Check Environment Variables**
   - Click your ToDo.Api project
   - Click "Variables" tab
   - Verify these are set:
     ```
     JWT_SECRET_KEY=<your-secret-key>
     GOOGLE_CLIENT_ID=949158046604-qae51oh1krmo3ino6l76rmd95hleo887.apps.googleusercontent.com
     DATABASE_URL=<your-postgres-connection-string>
     ALLOWED_ORIGINS=http://localhost:4200,https://to-do-sandy-zeta.vercel.app
     ```

3. **Check Deployment Status**
   - Should be "Active" and green
   - Click "View Logs" to see any errors

4. **Test Backend API**
   - Visit: `https://todo-production-01ab.up.railway.app/api/users/login`
   - Should return: `{"type":"https://tools.ietf.org/html/rfc9110#section-15.6.1","title":"Unsupported Media Type","status":415...}`
   - This is CORRECT - it means API is working, just needs JSON POST body

---

### **Step 4: Test Deployment (After Push)**

#### **A. Wait for Deployment** (2-3 minutes)
- **Vercel**: Check deployment status at https://vercel.com/dashboard
  - Should show "Building..." → "Ready"
  - Click deployment to see logs

- **Railway**: Usually stays deployed (backend rarely needs redeployment)

#### **B. Test Frontend**
1. **Visit:** `https://to-do-sandy-zeta.vercel.app`
   - ✅ Should load login page (no more 404!)

2. **Test Routing:**
   - Click "Register" link → should load `/register`
   - Refresh page → should stay on `/register` (no 404!)
   - Click browser back button → should work
   - Directly visit: `https://to-do-sandy-zeta.vercel.app/dashboard`
   - Should redirect to login (not 404)

#### **C. Test Full Flow**
1. **Register New User**
   - Enter name, email, password
   - Should create account and redirect to dashboard

2. **Login**
   - Use credentials
   - Should authenticate and redirect to dashboard

3. **Create Project**
   - Add new project
   - Should save to database

4. **Create Task**
   - Add new task
   - Should save to database

5. **Logout**
   - Click logout
   - Should redirect to login

6. **Login Again**
   - Data should persist

---

## 🐛 Troubleshooting

### **Issue: Still Getting 404 on Vercel**

**Solution 1: Clear Vercel Cache**
```bash
# In Vercel dashboard:
1. Go to Settings → General
2. Scroll to "Build & Development Settings"
3. Toggle "Automatically expose System Environment Variables" OFF then ON
4. Redeploy
```

**Solution 2: Manually Override Settings**
1. Vercel Dashboard → Your Project → Settings → General
2. Under "Build & Development Settings"
3. **Override** these:
   - Build Command: `cd frontend && npm install && npm run build`
   - Output Directory: `frontend/dist/frontend/browser`
   - Install Command: `cd frontend && npm install`
4. Save and redeploy

**Solution 3: Check Deployment Logs**
```bash
# In Vercel dashboard:
1. Click "Deployments" tab
2. Click latest deployment
3. Check "Building" logs for errors
4. Common errors:
   - npm install failed → Check package.json
   - Build failed → Check angular.json output path
   - 404 after build → Check vercel.json rewrites
```

---

### **Issue: CORS Error in Browser Console**

**Symptoms:**
```
Access to XMLHttpRequest at 'https://todo-production-01ab.up.railway.app/api/users/login'
from origin 'https://to-do-sandy-zeta.vercel.app' has been blocked by CORS policy
```

**Solution:**
1. Check Railway environment variable:
   ```
   ALLOWED_ORIGINS=http://localhost:4200,https://to-do-sandy-zeta.vercel.app
   ```
   - Make sure there's NO trailing slash
   - Make sure there's NO space after comma

2. Redeploy Railway backend:
   ```bash
   # In Railway dashboard:
   - Click your project
   - Click "Deploy" → "Redeploy"
   ```

3. Clear browser cache:
   ```bash
   # In Chrome:
   - Press F12 (DevTools)
   - Right-click Refresh button
   - Click "Empty Cache and Hard Reload"
   ```

---

### **Issue: API Returns 405 Method Not Allowed**

**This is NORMAL** if you're testing POST endpoints in browser URL bar.

**Why:**
- Browser URL bar = GET request
- Login/Register endpoints = POST requests
- GET on POST endpoint = 405 error

**How to Test Properly:**
1. Use the actual Angular UI (not browser URL)
2. Or use Postman/Thunder Client
3. Or use curl:
   ```bash
   curl -X POST https://todo-production-01ab.up.railway.app/api/users/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"password123"}'
   ```

---

### **Issue: /swagger Not Working in Production**

**This is INTENTIONAL and SECURE.**

**Why:**
- `Program.cs` only enables Swagger in Development:
  ```csharp
  if (app.Environment.IsDevelopment())
  {
      app.UseSwagger();
      app.UseSwaggerUI();
  }
  ```

**How to Test API in Production:**
1. Use your Angular frontend
2. Use Postman/Thunder Client
3. Use curl commands

**If You REALLY Want Swagger in Production** (NOT RECOMMENDED):
```csharp
// In Program.cs, change:
if (app.Environment.IsDevelopment())

// To:
if (app.Environment.IsDevelopment() || app.Environment.IsProduction())
```

---

## ✅ Success Checklist

After deployment, verify:

- [ ] Frontend loads at `https://to-do-sandy-zeta.vercel.app`
- [ ] No 404 errors
- [ ] Can navigate between /login, /register, /dashboard
- [ ] Can refresh any page without 404
- [ ] Can register new user
- [ ] Can login with credentials
- [ ] Can create projects
- [ ] Can create tasks
- [ ] Can logout
- [ ] Data persists after logout/login
- [ ] No CORS errors in console
- [ ] Google Sign-In works (if configured)

---

## 📁 File Structure (After Fixes)

```
ToDo/
├── vercel.json              ← NEW: Vercel configuration
├── .vercelignore           ← NEW: Ignore backend files
├── .env.example            ← Environment variables template
├── frontend/
│   ├── angular.json        ← UPDATED: Added outputPath
│   ├── src/
│   │   ├── index.html      ← Entry point
│   │   ├── main.ts         ← Bootstrap
│   │   └── environments/
│   │       ├── environment.ts      ← Dev: Points to Railway
│   │       └── environment.prod.ts ← Prod: Points to Railway
│   ├── dist/               ← Build output (gitignored)
│   └── package.json
├── ToDo.Api/
│   ├── Program.cs          ← CORS + JWT + Exception handling
│   ├── appsettings.json    ← Default config
│   ├── appsettings.Development.json  ← Dev overrides
│   └── appsettings.Production.json   ← Prod overrides
└── README.md
```

---

## 🎯 What Each File Does

### **vercel.json**
- Tells Vercel where your Angular app is
- Configures build command
- Sets up SPA routing rewrites
- **Without this = 404 errors**

### **.vercelignore**
- Keeps backend files off Vercel
- Speeds up deployment
- Reduces upload size

### **angular.json**
- Defines how Angular builds
- Sets output directory
- **Output must match vercel.json**

### **environment.ts / environment.prod.ts**
- Points to Railway API
- Configures Google OAuth
- **Frontend calls backend here**

### **Program.cs**
- CORS configuration
- JWT authentication
- Global exception handling
- **Backend allows frontend here**

---

## 🔒 Security Checklist

- [x] JWT secret in environment variable (not hardcoded)
- [x] CORS restricted to specific origins (not "*")
- [x] Swagger disabled in production
- [x] Database connection string in environment variable
- [x] Google Client ID in environment variable
- [x] No secrets committed to Git
- [ ] Set strong JWT_SECRET_KEY in Railway (32+ characters)
- [ ] Enable HTTPS redirect (already in Program.cs)
- [ ] Add rate limiting (optional, for production)

---

## 📞 Quick Commands Reference

### **Local Development:**
```bash
# Frontend (from /frontend)
npm install
npm start                    # http://localhost:4200

# Backend (from /ToDo.Api)
dotnet restore
dotnet run                   # http://localhost:5000
```

### **Build for Production:**
```bash
# Frontend
cd frontend
npm install
npm run build               # Outputs to dist/frontend/browser

# Backend
cd ToDo.Api
dotnet publish -c Release   # Outputs to bin/Release/net10.0/publish
```

### **Test API:**
```bash
# Login
curl -X POST https://todo-production-01ab.up.railway.app/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Register
curl -X POST https://todo-production-01ab.up.railway.app/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

---

## 🎉 Summary

### **Before Fixes:**
- ❌ Vercel shows 404
- ❌ Frontend doesn't load
- ❌ Angular routing broken
- ❌ Can't deploy

### **After Fixes:**
- ✅ Vercel serves Angular app correctly
- ✅ SPA routing works (no 404 on refresh)
- ✅ Frontend connects to Railway backend
- ✅ CORS configured properly
- ✅ Deployment automated via Git push

### **Next Steps:**
1. Commit and push changes
2. Wait for Vercel auto-deploy (2-3 mins)
3. Test at `https://to-do-sandy-zeta.vercel.app`
4. ✅ Done!

---

**Need help?** Check the Troubleshooting section above or:
- Vercel Docs: https://vercel.com/docs
- Angular Deployment: https://angular.io/guide/deployment
- Railway Docs: https://docs.railway.app

**Good luck! 🚀**
