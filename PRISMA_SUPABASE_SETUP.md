# Prisma + Supabase Setup Guide

## 🚀 Complete Step-by-Step Installation

### **Step 1: Install Dependencies**

```bash
cd backend
npm install @prisma/client
npm install -D prisma
npm install dotenv bcryptjs
```

### **Step 2: Create Supabase Account**

1. Go to **https://supabase.com**
2. Click **"Start your project"**
3. Sign up with email
4. Create new organization
5. Create new project:
   - **Name**: grocery-mart
   - **Password**: Create strong password (save it!)
   - **Region**: Choose nearest region
6. Wait for project to be created (2-3 mins)

### **Step 3: Get Database Credentials**

1. Go to **Settings → Database**
2. Copy the connection string or build it manually:
   ```
   postgresql://postgres:[PASSWORD]@[PROJECT-ID].supabase.co:5432/postgres
   ```
3. Find your values:
   - **[PASSWORD]**: Your database password
   - **[PROJECT-ID]**: From project URL (xxxxx.supabase.co)

### **Step 4: Create .env File**

Create `backend/.env`:

```env
# Database
DATABASE_URL="postgresql://postgres:[YOUR_PASSWORD]@[YOUR_PROJECT_ID].supabase.co:5432/postgres"

# JWT
JWT_SECRET="grocery_mart_secret_key_2024"

# Server
PORT=5000

# Supabase API Keys (Optional, from Settings → API)
SUPABASE_URL="https://[YOUR_PROJECT_ID].supabase.co"
SUPABASE_ANON_KEY="your_anon_key_here"
```

### **Step 5: Initialize Prisma**

```bash
npx prisma init
```

This creates `prisma/schema.prisma` file.

### **Step 6: Create Prisma Schema**

Edit `prisma/schema.prisma`:

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String     @id @default(cuid())
  username  String     @unique
  email     String     @unique
  password  String
  address   Address?
  carts     Cart[]
  payments  Payment[]
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  @@index([email])
}

model Address {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  street    String?
  city      String?
  state     String?
  pincode   String?
  createdAt DateTime @default(now())
  updatedAt DateTime   @updatedAt
}

model Cart {
  id        String     @id @default(cuid())
  userId    String     @unique
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  items     CartItem[]
  updatedAt DateTime   @updatedAt

  @@index([userId])
}

model CartItem {
  id        String   @id @default(cuid())
  cartId    String
  cart      Cart     @relation(fields: [cartId], references: [id], onDelete: Cascade)
  productId String
  name      String
  weight    String
  price     Float
  img       String?
  qty       Int      @default(1)
  createdAt DateTime @default(now())

  @@unique([cartId, productId])
  @@index([cartId])
}

model Payment {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  items           PaymentItem[]
  itemTotal       Float
  deliveryFee     Float    @default(0)
  handlingFee     Float    @default(2)
  grandTotal      Float
  paymentMethod   String
  status          String   @default("pending")
  deliveryAddress String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([userId])
  @@index([createdAt])
}

model PaymentItem {
  id        String  @id @default(cuid())
  paymentId String
  payment   Payment @relation(fields: [paymentId], references: [id], onDelete: Cascade)
  productId String
  name      String
  weight    String?
  price     Float
  qty       Int

  @@index([paymentId])
}
```

### **Step 7: Run Migration**

```bash
npx prisma migrate dev --name init
```

This will:
- Create tables in Supabase
- Generate Prisma client
- Ask for migration name (type "init")

### **Step 8: Files Already Updated**

✅ `server.js` - Updated with Prisma + Supabase
✅ Ready for auth routes update

### **Step 9: Update Auth Routes**

The auth routes need Prisma client. Here's template for `backend/routes/auth.js`:

```javascript
const express = require('express');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'grocery_mart_secret_key_2024';

const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please provide all fields' });
    }

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { username: username.trim() }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        username: username.trim(),
        email: email.toLowerCase(),
        password: hashedPassword
      }
    });

    const token = generateToken(user.id);

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.username
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user.id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.username
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.username
      }
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

module.exports = router;
```

### **Step 10: Start Backend**

```bash
cd backend
npm start
```

You should see:
```
╔════════════════════════════════════════╗
║   🚀 Grocery Mart Backend API Server   ║
╚════════════════════════════════════════╝

✅ Server running on http://localhost:5000
📊 Database: Supabase PostgreSQL
🔧 ORM: Prisma
```

### **Step 11: Test Database Connection**

```bash
curl http://localhost:5000/api/health
```

Response:
```json
{
  "status": "OK",
  "message": "🚀 Grocery Mart API with Prisma + Supabase",
  "database": "Connected ✅",
  "timestamp": "2026-09-28T15:27:48.449Z"
}
```

---

## 📊 Prisma Studio (Visual Database)

```bash
npx prisma studio
```

Opens at `http://localhost:5555` - visual database browser!

---

## ✅ Troubleshooting

### **Error: Can't find DATABASE_URL**
- ✅ Check `.env` file exists in `backend/`
- ✅ Verify DATABASE_URL format is correct

### **Error: Connection refused**
- ✅ Check Supabase project is running
- ✅ Verify password is correct
- ✅ Check network connection

### **Error: Migration failed**
- ✅ Delete `prisma/migrations` folder
- ✅ Run `npx prisma migrate dev --name init` again

### **Error: User already exists**
- ✅ Go to Prisma Studio → User table
- ✅ Delete existing users
- ✅ Try signup again

---

## 🎯 Next Steps

1. ✅ Update all route files with Prisma
2. ✅ Test endpoints with Postman
3. ✅ Connect frontend to new API
4. ✅ Deploy to production

---

**ఇప్పుడు సిద్ధం! Supabase + Prisma fully setup!** 🚀
