# Grocery Mart - API Endpoints Documentation

## 🚀 Backend Server Status
- **Status**: ✅ Running on `http://localhost:5000`
- **Storage**: Local JSON Files (No MongoDB needed)
- **API Base URL**: `http://localhost:5000/api`

---

## 📋 API Endpoints

### 🔐 Authentication Endpoints

#### 1. **Sign Up** (Create New Account)
```
POST /api/auth/signup
Content-Type: application/json

{
  "username": "dev",
  "email": "dev@test.com",
  "password": "123456"
}

Response:
{
  "message": "Account created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_1790607163200",
    "username": "dev",
    "email": "dev@test.com",
    "name": "dev"
  }
}
```

#### 2. **Login** (Get Auth Token)
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "dev@test.com",
  "password": "123456"
}

Response:
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_1790607163200",
    "username": "dev",
    "email": "dev@test.com",
    "name": "dev"
  }
}
```

#### 3. **Get Current User**
```
GET /api/auth/me
Authorization: Bearer <TOKEN>

Response:
{
  "user": {
    "id": "user_1790607163200",
    "username": "dev",
    "email": "dev@test.com",
    "name": "dev"
  }
}
```

---

### 🛒 Cart Endpoints

#### 4. **Get Cart**
```
GET /api/cart
Authorization: Bearer <TOKEN>

Response:
{
  "cart": {
    "items": [
      {
        "productId": "v1",
        "name": "American Sweet Corn",
        "weight": "1 piece",
        "price": 24,
        "img": "https://...",
        "qty": 1
      }
    ],
    "totalAmount": 24,
    "totalItems": 1
  }
}
```

#### 5. **Add to Cart**
```
POST /api/cart/add
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "productId": "v1",
  "name": "American Sweet Corn",
  "weight": "1 piece",
  "price": 24,
  "img": "https://png.pngtree.com/png-vector/20231127/ourmid/pngtree-realistic-delicious-yellow-sweet-corn-png-image_10748086.png",
  "qty": 1
}

Response:
{
  "message": "Item added to cart",
  "cart": {
    "items": [...],
    "totalAmount": 24,
    "totalItems": 1
  }
}
```

#### 6. **Update Cart Item Quantity**
```
PUT /api/cart/update
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "productId": "v1",
  "qty": 3
}

Response:
{
  "message": "Cart updated",
  "cart": {
    "items": [...],
    "totalAmount": 72,
    "totalItems": 3
  }
}
```

#### 7. **Clear Cart**
```
DELETE /api/cart/clear
Authorization: Bearer <TOKEN>

Response:
{
  "message": "Cart cleared",
  "cart": {
    "items": [],
    "totalAmount": 0,
    "totalItems": 0
  }
}
```

#### 8. **Sync Cart**
```
POST /api/cart/sync
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "items": [
    {
      "id": "v1",
      "name": "American Sweet Corn",
      "weight": "1 piece",
      "price": 24,
      "img": "https://...",
      "qty": 1
    }
  ]
}

Response:
{
  "message": "Cart synced",
  "cart": {...}
}
```

---

### 💳 Payment Endpoints

#### 9. **Process Payment**
```
POST /api/payment/process
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "paymentMethod": "cod",
  "items": [
    {
      "productId": "v1",
      "name": "American Sweet Corn",
      "weight": "1 piece",
      "price": 24,
      "img": "https://...",
      "qty": 3
    }
  ],
  "deliveryAddress": "123 Main St, City"
}

Payment Methods: "cod" | "upi" | "card"

Response:
{
  "message": "Payment processed successfully",
  "payment": {
    "id": "payment_1790607195655",
    "grandTotal": 99,
    "status": "pending",
    "createdAt": "2026-09-28T14:53:15.655Z"
  }
}
```

#### 10. **Get Payment History**
```
GET /api/payment/history
Authorization: Bearer <TOKEN>

Response:
{
  "orders": [
    {
      "id": "payment_1790607195655",
      "items": [...],
      "itemTotal": 72,
      "deliveryFee": 25,
      "handlingFee": 2,
      "grandTotal": 99,
      "status": "pending",
      "createdAt": "2026-09-28T14:53:15.655Z"
    }
  ]
}
```

#### 11. **Get Payment Details**
```
GET /api/payment/:id
Authorization: Bearer <TOKEN>

Response:
{
  "order": {
    "id": "payment_1790607195655",
    "items": [...],
    "itemTotal": 72,
    "deliveryFee": 25,
    "handlingFee": 2,
    "grandTotal": 99,
    "status": "pending",
    "createdAt": "2026-09-28T14:53:15.655Z"
  }
}
```

---

### 🏥 Health Check

#### 12. **Health Check**
```
GET /api/health

Response:
{
  "status": "OK",
  "message": "🚀 Grocery Mart API is running (Local JSON Storage)"
}
```

---

## 🔑 Authentication

All endpoints except `/api/auth/signup`, `/api/auth/login`, and `/api/health` require authentication.

**Header Format**:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## 📦 Test Users

| Username | Email | Password |
|----------|-------|----------|
| dev | dev@test.com | 123456 |
| admin | admin@test.com | admin123 |

---

## 🧪 Quick Test Commands

### Test with cURL

```bash
# 1. Sign Up
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@test.com","password":"123456"}'

# 2. Login
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}' | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# 3. Get Current User
curl -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/auth/me

# 4. Add to Cart
curl -X POST http://localhost:5000/api/cart/add \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId":"v1","name":"Corn","weight":"1 piece","price":24,"qty":1}'

# 5. Get Cart
curl -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/cart

# 6. Process Payment
curl -X POST http://localhost:5000/api/payment/process \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"paymentMethod":"cod"}'
```

---

## 📊 Data Storage

All data is stored in **local JSON files** in `backend/data/` directory:
- `users.json` - User accounts
- `carts.json` - Shopping carts
- `payments.json` - Orders/Payments

---

## ✅ Tested Endpoints

- ✅ POST /api/auth/signup
- ✅ POST /api/auth/login
- ✅ GET /api/auth/me
- ✅ GET /api/cart
- ✅ POST /api/cart/add
- ✅ PUT /api/cart/update
- ✅ DELETE /api/cart/clear
- ✅ POST /api/payment/process
- ✅ GET /api/payment/history
- ✅ GET /api/health

**All endpoints working perfectly!** 🎉
