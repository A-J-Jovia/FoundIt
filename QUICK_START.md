# Quick Start Guide 🚀

## Prerequisites
- Node.js installed
- MongoDB Atlas account with IP whitelisted
- Both terminals open

---

## Step 1: Start Backend

```bash
cd backend
npm run dev
```

**Expected Output:**
```
Server running on port 5000
MongoDB Connected: cluster0.ffzej06.mongodb.net
```

✅ Backend is ready!

---

## Step 2: Start Frontend (New Terminal)

```bash
cd frontend
npm run dev
```

**Expected Output:**
```
VITE ready in XXX ms
Local: http://localhost:5173/
```

✅ Frontend is ready!

---

## Step 3: Test the Application

### Register Users

**Regular User:**
1. Go to http://localhost:5173/register
2. Name: Test User
3. Email: test@college.edu
4. Password: password123
5. Click "Create Account"

**Admin User:**
1. Logout
2. Go to /register
3. Name: Admin User
4. Email: admin@college.edu (must contain "admin")
5. Password: admin123
6. Click "Create Account"

---

## Step 4: Report an Item

1. Login as regular user
2. Click "Report" in navbar
3. Fill the form:
   - **Item Type**: Found Item
   - **Title**: Black Wallet
   - **Category**: Accessories
   - **Location**: Central Library
   - **Pin Location**: Click "Use My Current Location" (optional)
   - **Date**: Today
   - **Upload Photo**: Select an image file (optional)
   - **Primary Color**: Black
   - **Brand/Model**: Fastrack
4. Click "Submit Report"

✅ Item saved to MongoDB!

---

## Step 5: Verify in MongoDB

1. Go to MongoDB Atlas
2. Browse Collections → digital-lost-found → items
3. You should see your item with:
   - All form data
   - reporter ObjectId
   - status: "AWAITING_CLAIM"
   - imageURL (base64 if uploaded)
   - geoLocation (if location picked)
   - history array

---

## Step 6: Test Claim Flow

1. Logout
2. Register another user: user2@college.edu
3. Go to /found
4. Click "Claim Item" on the wallet
5. Alert: "Claim submitted"
6. Status changes to "Claim Submitted"

---

## Step 7: Test Admin Approval

1. Logout
2. Login as admin@college.edu
3. Go to /admin
4. See the wallet in "Claims Waiting Review"
5. Click "Start Verification"
6. Item moves to "Under Verification"
7. Select: "ID Match"
8. Add notes: "Verified with student ID"
9. Click "Approve"
10. Alert: "Claim approved!"

✅ Status updated to "RETURNED"

---

## Step 8: Verify Everything Works

### Check User Dashboard
1. Login as test@college.edu
2. Go to /dashboard
3. See wallet in "Items You Reported"
4. Status: "Returned"

### Check MongoDB
1. Open items collection
2. Find the wallet document
3. Verify:
   - status: "RETURNED"
   - claimant: ObjectId (user2)
   - verificationMethod: "ID Match"
   - adminNotes: "Verified with student ID"
   - history: 4 entries

---

## All Features Working ✅

- ✅ User Registration & Login
- ✅ Admin Registration & Login
- ✅ Report Items (Lost/Found)
- ✅ Image Upload (Base64)
- ✅ Geolocation Picker
- ✅ Browse Items
- ✅ Claim Submission
- ✅ Admin Dashboard
- ✅ Start Verification
- ✅ Approve/Reject Claims
- ✅ Status Updates
- ✅ MongoDB Persistence
- ✅ History Tracking
- ✅ Dark/Light Mode

---

## Troubleshooting

### Backend won't start
```bash
# Check MongoDB connection
# Verify .env file has correct MONGO_URI
# Whitelist IP in MongoDB Atlas
```

### Frontend can't connect
```bash
# Ensure backend is running on port 5000
# Check frontend/.env has VITE_API_URL=http://localhost:5000/api
```

### Items not saving
```bash
# Check browser console for errors
# Verify JWT token in localStorage
# Check MongoDB Atlas connection
```

---

## Success! 🎉

Your Digital Lost & Found system is fully operational with:
- Real-time MongoDB persistence
- Complete claim workflow
- Admin approval system
- Geolocation tracking
- Image uploads
- History tracking

**Ready for production!** 🚀
