# 🛒 Grocery Mart - Enterprise Architecture & Authentication System

## 🏗️ 1. Scalable Monorepo Directory Structure

The project is structured into an enterprise-grade modular monorepo cleanly separating the client (`frontend/`), server (`backend/`), documentation (`docs/`), and reusable feature slices:

```
grocery-mart/
├── frontend/                     # React Single Page Application (SPA)
│   ├── public/                   # Static assets, HTML shell, manifest, robots
│   │   ├── favicon.ico
│   │   ├── index.html
│   │   ├── manifest.json
│   │   └── robots.txt
│   ├── src/
│   │   ├── assets/               # Global static assets & style sheets
│   │   │   ├── icons/            # SVG icons and visual glyphs
│   │   │   ├── images/           # Product and promotional graphics
│   │   │   └── styles/           # Global styles and component CSS
│   │   ├── components/           # Reusable shared UI & Layout components
│   │   │   ├── feedback/         # Toast notifications, SessionWarning modal
│   │   │   ├── layout/           # Global Navbar, Category Sidebar
│   │   │   └── ui/               # Generic UI primitives (Buttons, Inputs, Cards)
│   │   ├── constants/            # Application constants, product catalog, categories
│   │   │   ├── categories.js
│   │   │   ├── index.js
│   │   │   └── products.js
│   │   ├── context/              # Centralized React Context Providers
│   │   │   ├── AdminContext.jsx  # Admin state & metrics management
│   │   │   ├── AuthContext.jsx   # Authentication, RBAC, inactivity timer, sessions
│   │   │   ├── index.js          # Unified context barrel export
│   │   │   ├── ThemeContext.jsx  # Light/Dark mode state management
│   │   │   └── ToastContext.jsx  # Global toast alert notification system
│   │   ├── features/             # Domain-Driven Feature Slices
│   │   │   ├── admin/            # Admin Dashboard, User Management, Analytics
│   │   │   │   ├── AdminLogin.jsx
│   │   │   │   ├── AdminNavbar.jsx
│   │   │   │   ├── AdminPanel.jsx
│   │   │   │   ├── AdminSidebar.jsx
│   │   │   │   ├── AdminUserManagement.jsx
│   │   │   │   └── index.js
│   │   │   ├── auth/             # Login, Sign Up, Forgot Password (OTP), Active Sessions
│   │   │   │   ├── ActiveSessions.jsx
│   │   │   │   ├── ForgotPasswordModal.jsx
│   │   │   │   ├── LoginModal.jsx
│   │   │   │   └── index.js
│   │   │   ├── cart/             # Shopping Cart drawer, Checkout, Payment Modal
│   │   │   │   ├── Cart.jsx
│   │   │   │   ├── PaymentModal.jsx
│   │   │   │   └── index.js
│   │   │   ├── orders/           # Order tracking, Order history, Invoice details
│   │   │   │   ├── MyOrders.jsx
│   │   │   │   └── index.js
│   │   │   └── products/         # Product Card, Product Detail modal, Wishlist
│   │   │       ├── ProductCard.jsx
│   │   │       ├── ProductDetail.jsx
│   │   │       ├── Wishlist.jsx
│   │   │       └── index.js
│   │   ├── pages/                # Top-level application pages & views
│   │   │   ├── AboutUs.jsx
│   │   │   ├── ContactUs.jsx
│   │   │   ├── SupportCenter.jsx # Customer support ticketing system
│   │   │   ├── UserProfile.jsx   # Profile management, theme, password, sessions
│   │   │   └── index.js
│   │   ├── services/             # Centralized Axios/Fetch API service layer
│   │   │   ├── api.js            # Dual-token auto-refresh API client
│   │   │   └── index.js
│   │   ├── App.jsx               # Application root component & view router
│   │   ├── index.css             # CSS variables (Light/Dark themes) & base styles
│   │   ├── index.js              # React DOM mounting entry point
│   │   ├── reportWebVitals.js
│   │   └── setupTests.js
│   └── package.json
├── backend/                      # Node.js + Express + Prisma REST API
│   ├── middleware/
│   │   └── auth.js               # JWT verification, RBAC (requireRole, requirePermission)
│   ├── prisma/
│   │   └── schema.prisma         # Enterprise PostgreSQL/Supabase Database Schema
│   ├── routes/
│   │   ├── admin.js              # Admin metrics, analytics, product catalog APIs
│   │   ├── auth.js               # Registration, Login, Dual Tokens, OTP Reset, Sessions
│   │   ├── cart.js               # Persistent shopping cart management
│   │   ├── orders.js             # Order creation, verification, and history
│   │   ├── profile.js            # User profile, password changes, theme updates
│   │   ├── support.js            # Support ticket creation, reply threads
│   │   └── userManagement.js     # Enterprise User Management & Audit Log APIs
│   ├── seed.js                   # RBAC, Permissions, and Default Admin seed script
│   ├── server.js                 # Express server bootstrap & route mounting
│   └── package.json
├── docs/                         # Enterprise system & architectural specifications
│   └── ARCHITECTURE.md
├── package.json                  # Root Monorepo configuration & runner scripts
└── README.md                     # Project quickstart & development guide
```

---

## 🔐 2. Enterprise Authentication & Access Control Submodules

### Submodule 1: User Registration & Multi-Role Onboarding
* **Self-Service Registration**: Customers register securely with full name, email, phone number, and bcrypt-hashed passwords.
* **Administrative Provisioning**: Administrators can provision accounts directly with predefined roles (`CUSTOMER`, `STAFF`, `SUPPLIER`, `RETAILER`, `ADMIN`).

### Submodule 2: Dual-Token JWT & Active Session Tracking
* **Short-Lived Access Token**: Standard 15-minute expiration payload carrying `userId`, `role`, and assigned `permissions`.
* **Database-Backed Refresh Token**: Long-lived 7-day token stored in `ActiveSession` records.
* **Automatic Silent Refresh**: Frontend API interceptor transparently refreshes expired access tokens before re-attempting failed requests.
* **Active Session Management**: Users and Admins can view device type, browser, IP address, and last active timestamp, with instant single or bulk session revocation.

### Submodule 3: Role-Based Access Control (RBAC)
* **Granular Permissions Schema**: Backed by `Role`, `Permission`, and `RolePermissionMap` tables in Prisma.
* **Express Middleware Guards**:
  * `requireRole(['ADMIN', 'STAFF'])`: Restricts endpoint execution to specific roles.
  * `requirePermission('MANAGE_USERS')`: Enforces granular permission-level access control.
* **Frontend UI Guards**: Conditional component rendering ensuring staff and customers only access permitted screens.

### Submodule 4: 3-Step Forgot & Reset Password Flow
1. **Step 1 - Request OTP**: User enters registered email; system validates account status, generates a secure 6-digit OTP, stores it with a 10-minute expiry, and creates an `OtpLog` record.
2. **Step 2 - Verify OTP**: User inputs OTP with a dynamic 120-second countdown timer and resend capability.
3. **Step 3 - Reset Password**: User sets a new password with real-time password strength indicators (length, numbers, special characters).

### Submodule 5: Inactivity & Session Timeout Management
* **Client-Side Activity Listeners**: Tracks `mousemove`, `keydown`, `click`, and `scroll` events.
* **30-Minute Inactivity Window**: Automatically triggers after 28 minutes of inactivity with a 120-second warning countdown modal (`SessionWarning.jsx`).
* **Session Renewal or Invalidation**: Users can click "Stay Logged In" to extend their session or allow automatic logout upon timer expiration.

### Submodule 6: User Profile & Account Management
* **Profile Management**: Update profile picture URL, contact phone number, and preferences.
* **Security & Password Update**: Verify current password before committing new password changes.
* **Live Session Manager**: Revoke other active sessions or specific remote devices in real-time.
* **Appearance & Theme Sync**: Synchronize Light/Dark mode preferences to the user profile and localStorage.

### Submodule 7: Audit Logging & Activity Trails
* **Login Logs (`LoginLog`)**: Captures timestamp, IP address, user agent, authentication method, and success/failure status with failure reasons.
* **Activity Logs (`ActivityLog`)**: Records every administrative action (e.g., status changes, role modifications, session terminations) for governance compliance.

### Submodule 8: User Status Lifecycle Enforcement
* **Status Flags**: `ACTIVE`, `INACTIVE`, `SUSPENDED`.
* **Middleware Invalidation**: Suspended or inactive accounts are immediately blocked at the JWT verification layer, and active sessions are revoked instantly.

### Submodule 9: OTP & Security Event Audit
* **Dedicated Audit Trail (`OtpLog`)**: Audits OTP generation, verification attempts, and expiration timestamps for fraud prevention.

---

## 🚀 3. Running the Application

### Start Backend API Server:
```bash
cd backend
npm install
npx prisma db push
npm run dev
```

### Start Frontend Application:
```bash
npm start
# Or from frontend directory:
cd frontend && npm start
```
