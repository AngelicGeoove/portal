# ⚡ Quick Start Guide

## 5-Minute Setup

### 1️⃣ Firebase Setup (3 minutes)

1. **Go to** https://console.firebase.google.com/
2. **Create Project** → Name: "UCC Portal" → Continue
3. **Disable Google Analytics** (optional) → Create Project
4. **Enable Authentication:**
   - Build → Authentication → Get Started
   - Sign-in method → Email/Password → Enable → Save
5. **Enable Firestore:**
   - Build → Firestore Database → Create Database
   - Start in **production mode** → Choose location → Enable
6. **Get Config:**
   - Project Settings (⚙️) → General → Your apps
   - Click Web icon `</>` → Register app
   - Copy the `firebaseConfig` object

### 2️⃣ Update Your Code (1 minute)

1. **Open** `js/firebase-config.js`
2. **Replace** lines 26-33 with your config:
   ```javascript
   const firebaseConfig = {
       apiKey: "YOUR_API_KEY",
       authDomain: "your-project.firebaseapp.com",
       projectId: "your-project-id",
       storageBucket: "your-project.appspot.com",
       messagingSenderId: "123456789",
       appId: "1:123456789:web:abc123"
   };
   ```
3. **Save** the file

### 3️⃣ Add Firebase SDK (30 seconds)

Open these files and **uncomment** the Firebase SDK lines (remove `<!--` and `-->`):
- `index.html` (lines ~90-93)
- `student.html` (lines ~150-153)
- `staff.html` (lines ~280-283)
- `admin.html` (lines ~200-203)

### 4️⃣ Set Security Rules (30 seconds)

1. **Go to** Firestore → Rules tab
2. **Copy** this:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```
3. **Publish**

### 5️⃣ Run Locally (30 seconds)

```powershell
# In your project folder
python -m http.server 8000
```

**Open browser:** http://localhost:8000

## ✅ Test It!

1. **Sign Up** as admin (Ctrl+Alt+A on login page)
   - Email: admin@test.com
   - Password: admin123
   - Index: AD/MIN/00/0001
2. **Manually set role** in Firestore:
   - Firestore → users → (your user) → Edit → role: "admin"
3. **Login again** → Should go to admin portal
4. **Add a Lecture Hall** → "Engineering Block A"
5. **Add a Room** → "Room 101" with features

## 🎉 You're Done!

Now you can:
- ✅ Sign up students and staff
- ✅ Create bookings
- ✅ View schedules
- ✅ Manage rooms

## 🚀 Deploy to GitHub Pages (Optional - 2 minutes)

```powershell
# In your project folder
git add .
git commit -m "UCC Portal ready"

# Create repo on github.com first, then:
git remote add origin https://github.com/YOUR_USERNAME/uccapp.git
git push -u origin main

# Enable Pages: Settings → Pages → Source: main branch → Save
```

Your site: `https://YOUR_USERNAME.github.io/uccapp/`

## 📝 First Admin Setup

After logging in as admin, add:

1. **Lecture Halls:**
   - Engineering Block A
   - Science Complex
   - Arts Building

2. **Rooms for Each Hall:**
   - Room 101, Room 102, Room 103, etc.
   - Lab A, Lab B, Lecture Hall 1, etc.

3. **Room Details:**
   - Capacity: 50, 100, 150, etc.
   - Features: Projector ✓, 8 sockets, PA System ✓

## 🆘 Common Issues

**"Firebase is not defined"**
→ Uncomment SDK scripts in HTML files

**"Permission denied"**
→ Check Firestore security rules are published

**Styles not loading**
→ Use a local server (not file://)

**Admin can't log in**
→ Manually set role to "admin" in Firestore

## 📚 Full Documentation

- **README.md** - Complete user guide
- **DEVELOPMENT_PLAN.md** - Feature specifications
- **SETUP_COMPLETE.md** - Detailed setup steps
- **docs/INDEX_NUMBER_SYSTEM.md** - Index number guide

## 🎯 Next Features to Add

After basic setup works, add:
- Email verification
- Password reset
- Profile pictures
- Room images
- Export schedules to PDF
- Email notifications
- Mobile responsive improvements

---

**Total Setup Time:** ~5 minutes
**Skills Required:** None - just follow the steps!
**Cost:** $0 (Firebase free tier)
