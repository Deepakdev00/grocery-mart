# 🎉 Admin Dashboard with Real Data from Supabase

## ✅ What's Complete

Your admin dashboard now displays **real data** from Supabase PostgreSQL database instead of mock data!

---

## 🗄️ Database Setup

### Tables Created in Supabase:
- **User** - Regular user accounts
- **Admin** - Admin accounts with roles
- **AdminSession** - Track admin login sessions with IP/device info
- **Cart** - Shopping carts per user
- **CartItem** - Items in carts
- **Payment** - Orders with full details
- **PaymentItem** - Items in each order
- **Address** - User delivery addresses

### Test Data Seeded:
- ✅ **1 Admin Account**: `admin@grocerymart.com` / `admin123`
- ✅ **5 Regular Users**: user1-user5
- ✅ **15 Sample Orders**: Spread across last 30 days with realistic amounts

---

## 🔐 Admin Features

### Admin Login (`/api/admin/login`)
```bash
POST /api/admin/login
{
  "email": "admin@grocerymart.com",
  "password": "admin123"
}

Response:
{
  "message": "Admin login successful",
  "token": "jwt_token_here",
  "admin": {
    "id": "...",
    "username": "admin",
    "email": "admin@grocerymart.com",
    "role": "admin"
  }
}
```

**Features:**
- ✅ JWT token generation (7-day expiration)
- ✅ Session tracking (IP address, user agent, login time)
- ✅ Multiple concurrent sessions supported
- ✅ Toast notification on login

---

## 📊 Admin Dashboard Endpoints

All dashboard endpoints require admin token in Authorization header:
```
Authorization: Bearer <adminToken>
```

### 1. Dashboard Stats (`/api/admin/dashboard/stats`)
```bash
GET /api/admin/dashboard/stats

Response:
{
  "stats": {
    "totalUsers": 5,
    "totalOrders": 15,
    "totalRevenue": 2900,
    "todayOrders": 2,
    "todayRevenue": 624,
    "avgOrderValue": 193.33
  }
}
```

**Shows:**
- Total registered users
- Total orders placed
- Total revenue generated
- Orders placed today
- Revenue from today
- Average order value

### 2. Daily Orders Chart (`/api/admin/dashboard/daily-orders`)
```bash
GET /api/admin/dashboard/daily-orders

Response:
{
  "dailyOrders": [
    {
      "date": "2026-08-29",
      "orders": 1,
      "revenue": 117
    },
    {
      "date": "2026-08-30",
      "orders": 0,
      "revenue": 0
    },
    ...
  ]
}
```

**Features:**
- 30-day historical data
- Order count and revenue per day
- Missing dates filled with 0
- Used for bar chart visualization

### 3. All Orders (`/api/admin/dashboard/orders`)
```bash
GET /api/admin/dashboard/orders

Response:
{
  "orders": [
    {
      "id": "clm...",
      "user": {
        "id": "...",
        "username": "user1",
        "email": "user1@example.com"
      },
      "itemCount": 2,
      "itemTotal": 100,
      "deliveryFee": 25,
      "handlingFee": 2,
      "grandTotal": 127,
      "paymentMethod": "cod",
      "status": "completed",
      "deliveryAddress": "...",
      "createdAt": "2026-08-29T...",
      "items": [...]
    }
  ]
}
```

**Shows:**
- All orders with customer details
- Item breakdown
- Payment method & status
- Delivery address
- Latest 50 orders

### 4. Users List (`/api/admin/dashboard/users`)
```bash
GET /api/admin/dashboard/users

Response:
{
  "users": [
    {
      "id": "...",
      "username": "user1",
      "email": "user1@example.com",
      "orderCount": 3,
      "totalSpent": 486.25,
      "createdAt": "2026-08-28T..."
    }
  ]
}
```

**Shows:**
- All registered users
- Number of orders per user
- Total money spent
- Account creation date

### 5. Admin Sessions (`/api/admin/dashboard/sessions`)
```bash
GET /api/admin/dashboard/sessions

Response:
{
  "sessions": [
    {
      "id": "...",
      "admin": {
        "id": "...",
        "username": "admin",
        "email": "admin@grocerymart.com"
      },
      "ipAddress": "127.0.0.1",
      "userAgent": "Mozilla/5.0...",
      "loginAt": "2026-09-28T15:56:47Z",
      "lastSeenAt": "2026-09-28T15:57:12Z",
      "expiresAt": "2026-10-05T15:56:47Z"
    }
  ]
}
```

**Shows:**
- Active admin sessions
- Which admin is logged in
- Device/IP information
- Login and activity times
- Session expiration date

---

## 🎨 Frontend Admin Panel

### Dashboard Tabs:
1. **📊 Dashboard** - Statistics and 30-day orders chart
2. **📦 Orders** - View all customer orders
3. **👥 Users** - Registered users and spending
4. **🔐 Sessions** - Active admin login sessions

### Features:
- ✅ Real-time data from Supabase
- ✅ Authentication required (token-based)
- ✅ Toast notifications for user actions
- ✅ Responsive design (desktop, tablet, mobile)
- ✅ Professional UI with gradients and animations
- ✅ Tables with sorting and filtering
- ✅ Auto-refresh on tab change

---

## 🚀 How to Use

### 1. Start Backend Server
```bash
cd backend
PORT=5001 npm start
```

**Server runs on:** `http://localhost:5001`

### 2. Login as Admin
- Email: `admin@grocerymart.com`
- Password: `admin123`

### 3. View Dashboard
- Dashboard stats update in real-time
- Click on bars in chart to see day details
- Switch tabs to view orders, users, sessions

### 4. Add More Test Data
To add more orders/users to test:

```bash
# Edit backend/seed.js to increase test data
# Then run:
cd backend
node seed.js
```

---

## 🔧 Backend Routes

### Auth Routes
```
POST   /api/admin/signup       - Create new admin
POST   /api/admin/login        - Login and get token
GET    /api/admin/me           - Get current admin info
GET    /api/admin/logout       - Logout and deactivate session
```

### Dashboard Routes (require admin token)
```
GET    /api/admin/dashboard/stats         - Dashboard statistics
GET    /api/admin/dashboard/orders        - All orders
GET    /api/admin/dashboard/users         - All users
GET    /api/admin/dashboard/daily-orders  - Last 30 days data
GET    /api/admin/dashboard/sessions      - Active sessions
```

---

## 📈 Database Schema

### Admin Table
```sql
CREATE TABLE Admin (
  id          String @id @default(cuid())
  username    String @unique
  email       String @unique
  password    String (bcrypt hashed)
  role        String @default("admin")
  sessions    AdminSession[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
)
```

### AdminSession Table
```sql
CREATE TABLE AdminSession (
  id          String @id @default(cuid())
  adminId     String (foreign key)
  token       String @unique
  ipAddress   String?
  userAgent   String?
  loginAt     DateTime @default(now())
  lastSeenAt  DateTime @default(now())
  expiresAt   DateTime
  isActive    Boolean @default(true)
)
```

---

## 🎯 What Data Shows

### Dashboard Stats Card:
- **Total Orders**: Count of all payments in database
- **Total Revenue**: Sum of all grand totals
- **Avg Order Value**: Total revenue / Total orders
- **Total Users**: Count of all User records
- **Today's Orders**: Orders created between midnight and now

### Orders Tab:
- Real orders with customer names
- Item counts from PaymentItem relations
- Actual payment amounts and methods
- Current order status

### Users Tab:
- All registered user accounts
- How many orders each placed
- Total money spent by each user
- Account creation dates

### Sessions Tab:
- Currently active admin sessions
- IP addresses and devices used
- Last activity timestamp
- Session expiration dates

---

## ✨ Key Features

✅ **Real Database** - All data persists in Supabase  
✅ **Admin Authentication** - Secure login with JWT tokens  
✅ **Session Tracking** - See who's logged in and from where  
✅ **Live Analytics** - Charts and stats from real orders  
✅ **User Management** - View all users and their history  
✅ **Order Management** - See all customer orders with details  
✅ **Toast Notifications** - User feedback for all actions  
✅ **Responsive Design** - Works on all devices  
✅ **Professional UI** - Gradient theme with smooth animations  

---

## 🔄 How It Works

1. **User Places Order** → Payment record created in Supabase
2. **Admin Logs In** → Token generated, session recorded
3. **Dashboard Loads** → Fetches real data from Supabase via API
4. **Stats Calculate** → Aggregates orders and revenue
5. **Charts Render** → Shows 30-day trend with real data
6. **Tables Display** → Lists users, orders, sessions from database

---

## 📝 Test Scenarios

### Scenario 1: View Dashboard
1. Click "Admin Login" in navbar
2. Enter: admin@grocerymart.com / admin123
3. Dashboard shows 5 users, 15 orders, ₹2900 revenue
4. Click on a bar to see orders for that day

### Scenario 2: Check Users
1. Click "Users" tab
2. See all 5 test users with their order history
3. See total money each user spent

### Scenario 3: Monitor Sessions
1. Click "Sessions" tab
2. See your current admin session
3. Shows IP, device, and login time

### Scenario 4: Add New Orders
1. Place an order as a regular user
2. Admin dashboard updates in real-time
3. New order appears in Orders tab

---

## 🐛 Troubleshooting

### Admin login shows "Cannot POST /api/admin/login"
- **Fix**: Make sure backend is running on port 5001
- Check: `PORT=5001 npm start`

### Dashboard shows no data
- **Fix**: Admin token might be expired
- Try: Login again to get a fresh token

### Session data not showing
- **Fix**: Make sure your session is active
- Check: Session expires after 7 days

### No users/orders visible
- **Fix**: Seed the database first
- Run: `node backend/seed.js`

---

## 🎁 Bonus: Create More Test Data

Edit `backend/seed.js` to customize:
- Number of test users (change loop count)
- Number of orders (change outer loop)
- Products and prices
- Order dates and statuses

Then run: `node seed.js`

---

## 📞 Support

For issues with:
- **Supabase Connection**: Check DATABASE_URL in .env
- **Admin Routes**: Verify admin.js and dashboard.js in routes/
- **Frontend**: Check AdminPanel.jsx for correct API_BASE
- **Database**: Use Prisma Studio: `npx prisma studio`

---

**Congratulations! Your admin dashboard is now fully functional with real Supabase data! 🎉**
