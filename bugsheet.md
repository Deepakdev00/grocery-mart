# 📋 Grocery Mart — Comprehensive Bug Sheet & Audit Report

**Generated Date:** October 2026  
**Project:** Grocery Mart (Full-Stack E-Commerce Application)  
**Stack:** React 19, Context API, Node.js, Express.js, Prisma ORM, PostgreSQL (Supabase)  
**Total Identified Issues:** 24 Bugs (Categorized by Severity)

---

## 📊 Summary of Findings

| Severity | Count | Primary Impact Areas |
| :--- | :---: | :--- |
| 🔴 **CRITICAL** | 6 | Authentication Bypass, Public Admin Creation, Plaintext Passwords, Infinite Loops |
| 🟠 **HIGH** | 7 | Missing Endpoints, Broken Foreign Keys, Non-Transactional Checkout, Hardcoded URLs |
| 🟡 **MEDIUM** | 6 | N+1 Query Bottlenecks, Inconsistent Session Management, Price Tampering Risks |
| 🔵 **LOW / POLISH** | 5 | Native Alert Overrides, Unused State, UI Inconsistencies, Styling Glitches |

---

## 🔴 1. Critical Severity Bugs (P0)

---

### BUG-001: Unprotected Public Admin Registration Endpoint
- **Severity:** 🔴 Critical
- **Category:** Security / Authorization
- **Affected File:** [`backend/routes/admin.js:28-56`](backend/routes/admin.js#L28-L56)
- **Description:**  
  The endpoint `POST /api/admin/signup` allows any unauthenticated user on the internet to register a new admin account with full administrative privileges. There is no master admin secret key check, authorization header verification, or invitation token validation.
- **Vulnerability / Impact:**  
  An attacker can send a `POST` request with arbitrary credentials to `/api/admin/signup` and immediately obtain administrative control over user accounts, order logs, and database metrics.
- **Reproduction Steps:**
  ```bash
  curl -X POST http://localhost:5000/api/admin/signup \
    -H "Content-Type: application/json" \
    -d '{"username":"attacker_admin","email":"hacker@domain.com","password":"Password123!"}'
  ```
- **Recommended Fix:**
  Require an `ADMIN_CREATION_SECRET` environment variable or require existing Super-Admin authentication to invoke the signup endpoint:
  ```javascript
  const { adminSecretKey } = req.body;
  if (adminSecretKey !== process.env.ADMIN_CREATION_SECRET) {
    return res.status(403).json({ message: 'Forbidden: Invalid Admin Registration Key' });
  }
  ```

---

### BUG-002: Insecure Mock Fallback Storing Plaintext Passwords in LocalStorage
- **Severity:** 🔴 Critical
- **Category:** Security / Data Protection
- **Affected File:** [`frontend/src/services/api.js:14-41`](frontend/src/services/api.js#L14-L41)
- **Description:**  
  When the backend is unreachable or returns a network error, `authAPI.login` and `authAPI.signup` in the frontend service layer fall back to a mock user database saved in `localStorage` under `mock_users`. This stores passwords in plain readable text and generates fake tokens (`mock_token_<timestamp>`).
- **Vulnerability / Impact:**  
  1. Plaintext user credentials stored in browser storage are susceptible to XSS extraction.
  2. Users get a false sense of being authenticated, but subsequent API calls fail with 401 Unauthorized because the fake token is not a valid signed JWT.
- **Reproduction Steps:**
  1. Turn off the backend server (`npm run server`).
  2. Attempt to sign in or sign up from the frontend UI.
  3. Inspect `localStorage.getItem('mock_users')` in Chrome DevTools.
- **Recommended Fix:**
  Remove mock authentication fallback from the production service layer and let network/API errors bubble up to display error toasts in the UI.

---

### BUG-003: Hardcoded Admin Authentication in AdminContext Breaking Backend APIs
- **Severity:** 🔴 Critical
- **Category:** Functional / Security
- **Affected File:** [`frontend/src/context/AdminContext.jsx:32-48`](frontend/src/context/AdminContext.jsx#L32-L48)
- **Description:**  
  `AdminContext.jsx` implements client-side authentication by hardcoding credentials (`admin` / `admin123`) and storing a fake token:
  ```javascript
  localStorage.setItem('adminToken', 'admin_token_' + Date.now());
  ```
  Meanwhile, the backend dashboard and user management endpoints require a real signed JWT containing `{ adminId: '...' }`.
- **Vulnerability / Impact:**  
  Logging in via `AdminContext` produces an invalid token, causing all admin dashboard queries (`/api/admin/dashboard/*` and `/api/admin/users`) to fail with `401 Invalid or expired token`.
- **Reproduction Steps:**
  1. Login as admin using the `AdminContext` login handler.
  2. Navigate to Admin Panel.
  3. Observe that all dashboard metrics and user lists fail to load due to 401 errors.
- **Recommended Fix:**
  Call the real backend endpoint `POST /api/admin/login` inside `AdminContext.jsx` and persist the genuine JWT returned by the server.

---

### BUG-004: Infinite Re-render / Network Request Loop in Cart Synchronization
- **Severity:** 🔴 Critical
- **Category:** Performance / Frontend Stability
- **Affected File:** [`frontend/src/App.jsx:69-94`](frontend/src/App.jsx#L69-L94)
- **Description:**  
  The `useEffect` responsible for loading the cart includes `cart` in its dependency array while calling `setCart(...)` inside the effect:
  ```javascript
  useEffect(() => {
    const loadCart = async () => {
      if (isAuthenticated) {
        if (cart.length > 0) await syncCartToServer(cart);
        const data = await cartAPI.getCart();
        if (data.cart?.items) {
          setCart(data.cart.items.map(...)); // Updates cart -> re-triggers useEffect
        }
      }
    };
    loadCart();
  }, [isAuthenticated, cart, syncCartToServer]);
  ```
- **Vulnerability / Impact:**  
  Once authenticated, the frontend enters an infinite loop of fetching the cart and re-rendering `AppContent`, overwhelming the client's CPU and spamming the backend with requests.
- **Reproduction Steps:**
  1. Log into a customer account with items in the cart.
  2. Open the browser Network tab and observe continuous requests to `/api/cart`.
- **Recommended Fix:**
  Remove `cart` from the dependency array and only fetch the cart once upon `isAuthenticated` transition.

---

### BUG-005: Weak Hardcoded JWT Secret Fallback Across Multiple Routes
- **Severity:** 🔴 Critical
- **Category:** Security / Token Integrity
- **Affected Files:**
  - [`backend/server.js:33`](backend/server.js#L33)
  - [`backend/routes/auth.js:10`](backend/routes/auth.js#L10)
  - [`backend/routes/admin.js:10`](backend/routes/admin.js#L10)
  - [`backend/routes/profile.js:9`](backend/routes/profile.js#L9)
  - [`backend/routes/payment.js:10`](backend/routes/payment.js#L10)
  - [`backend/routes/dashboard.js:8`](backend/routes/dashboard.js#L8)
  - [`backend/routes/userManagement.js:9`](backend/routes/userManagement.js#L9)
- **Description:**  
  Every backend route defines its own fallback: `process.env.JWT_SECRET || 'grocery_mart_secret_key_2024'`. If the `.env` variable is missing or empty, all route handlers use a known, publicly exposed string.
- **Vulnerability / Impact:**  
  Any attacker knowing the static string can forge valid JWT tokens with arbitrary `userId` or `adminId` values to bypass all authentication.
- **Recommended Fix:**
  Export a centralized configuration module that throws an immediate fatal error on startup if `process.env.JWT_SECRET` is not set in production.

---

### BUG-006: Missing Checkout Transaction Atomicity Leading to Inconsistent State
- **Severity:** 🔴 Critical
- **Category:** Database Integrity / Financial
- **Affected File:** [`backend/routes/payment.js:43-125`](backend/routes/payment.js#L43-L125)
- **Description:**  
  Checkout operations execute multiple independent database calls (`prisma.payment.create`, creating payment items, and `prisma.cartItem.deleteMany`) without a wrapping `prisma.$transaction(...)`.
- **Vulnerability / Impact:**  
  If the cart clearing step or payment item creation fails midway (due to network timeout or DB constraint), the payment record is created but cart items remain uncleared (or vice versa), causing duplicate charges or lost orders.
- **Recommended Fix:**
  Wrap the entire checkout flow in an interactive Prisma transaction:
  ```javascript
  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({ ... });
    await tx.cartItem.deleteMany({ where: { cart: { userId: req.userId } } });
    return payment;
  });
  ```

---

## 🟠 2. High Severity Bugs (P1)

---

### BUG-007: Non-Existent Cart Endpoints Called by Frontend API Service
- **Severity:** 🟠 High
- **Category:** Functional / API Mismatch
- **Affected Files:**
  - [`frontend/src/services/api.js:84, 92`](frontend/src/services/api.js#L84)
  - [`backend/routes/cart.js`](backend/routes/cart.js)
- **Description:**  
  `frontend/src/services/api.js` declares:
  ```javascript
  removeFromCart: (productId) => apiRequest(`/cart/remove/${productId}`, { method: 'DELETE' }),
  syncCart: (items) => apiRequest('/cart/sync', { method: 'POST', body: { items } }),
  ```
  However, `backend/routes/cart.js` does NOT implement `DELETE /cart/remove/:productId` or `POST /cart/sync`.
- **Impact:**  
  Any attempt to invoke `removeFromCart` or `syncCart` fails with an HTTP `404 Not Found`.
- **Recommended Fix:**
  Add the missing routes in `backend/routes/cart.js` or adjust frontend calls to use `PUT /api/cart/update` with `qty: 0`.

---

### BUG-008: Support Reply Foreign Key Schema Violation
- **Severity:** 🟠 High
- **Category:** Database / Relational Inconsistency
- **Affected Files:**
  - [`backend/routes/support.js:132-143`](backend/routes/support.js#L132-L143)
  - [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma)
- **Description:**  
  When an admin replies to a support ticket, the route code stores `userId: req.adminId` on the `SupportReply` record. However, `SupportReply.userId` is a foreign key referencing the `User` table (not `Admin`).
- **Impact:**  
  Prisma throws a foreign key constraint violation error whenever an admin attempts to post a reply to a user's support ticket.
- **Recommended Fix:**
  Add an optional `adminId` field and relation to the `SupportReply` model in `schema.prisma`:
  ```prisma
  model SupportReply {
    id        String   @id @default(uuid())
    ticketId  String
    userId    String?
    adminId   String?
    message   String
    ticket    SupportTicket @relation(fields: [ticketId], references: [id], onDelete: Cascade)
    user      User?         @relation(fields: [userId], references: [id], onDelete: Cascade)
    admin     Admin?        @relation(fields: [adminId], references: [id], onDelete: Cascade)
  }
  ```

---

### BUG-009: Hardcoded Localhost API URLs in Multiple Components
- **Severity:** 🟠 High
- **Category:** Architecture / Deployment
- **Affected Files:**
  - [`frontend/src/features/admin/AdminLogin.jsx:19`](frontend/src/features/admin/AdminLogin.jsx#L19)
  - [`frontend/src/pages/SupportCenter.jsx:23`](frontend/src/pages/SupportCenter.jsx#L23)
- **Description:**  
  `AdminLogin.jsx` directly calls `fetch('http://localhost:5000/api/admin/login')` and `SupportCenter.jsx` sets `const API_BASE = 'http://localhost:5000/api'`.
- **Impact:**  
  When deployed to staging, production, or mobile web browsers, requests point to the client's local machine instead of the remote backend server, breaking admin login and support tickets completely.
- **Recommended Fix:**
  Use the centralized `apiRequest` service from `frontend/src/services/api.js` or read `process.env.REACT_APP_API_URL`.

---

### BUG-010: Client-Side Price and Total Amount Tampering at Checkout
- **Severity:** 🟠 High
- **Category:** Security / Financial
- **Affected Files:**
  - [`backend/routes/payment.js:45-80`](backend/routes/payment.js#L45-L80)
  - [`frontend/src/features/cart/PaymentModal.jsx`](frontend/src/features/cart/PaymentModal.jsx)
- **Description:**  
  The checkout endpoint accepts items and calculates totals based on the client-supplied request payload without cross-verifying product prices against the backend database catalog.
- **Impact:**  
  A malicious user can intercept the checkout HTTP request and change product prices to `₹1`, placing orders for expensive groceries at virtually zero cost.
- **Recommended Fix:**
  Re-calculate the subtotal, delivery fee, and grand total entirely on the server using verified prices from the backend database/constants before creating the payment record.

---

### BUG-011: ActiveSession Heartbeat Lacks Validation on Route Level
- **Severity:** 🟠 High
- **Category:** Security / Session Hijacking
- **Affected Files:**
  - [`backend/routes/auth.js:200-240`](backend/routes/auth.js#L200-L240)
  - [`backend/middleware/auth.js`](backend/middleware/auth.js)
- **Description:**  
  While the backend includes an `ActiveSession` table and a heartbeat endpoint, regular authentication middleware (`authMiddleware`) only checks JWT signature and expiration. It does NOT check whether `activeSession.isActive === true`.
- **Impact:**  
  When an admin terminates a user's session via `/api/admin/users/:userId/sessions`, the user can continue making authenticated requests until their JWT naturally expires hours later.
- **Recommended Fix:**
  In `authMiddleware`, check if the session token ID or user has an active session record in PostgreSQL.

---

### BUG-012: Insecure Password Reset Flow via Predictable OTPs
- **Severity:** 🟠 High
- **Category:** Security / Authentication
- **Affected File:** [`backend/routes/auth.js:350-410`](backend/routes/auth.js#L350-L410)
- **Description:**  
  The password reset OTP is stored in-memory or in the database without strict rate limiting on verification attempts. There is no progressive delay or lock-out after consecutive failed OTP attempts.
- **Impact:**  
  An attacker can brute-force a 4-digit or 6-digit numeric OTP within the validity window to reset another user's password.
- **Recommended Fix:**
  Limit OTP verification attempts to a maximum of 3 tries per generated token, apply exponential backoff, and invalidate the OTP upon failure.

---

### BUG-013: Missing Database Indices on Frequent Foreign Keys & Filter Columns
- **Severity:** 🟠 High
- **Category:** Database / Performance
- **Affected File:** [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma)
- **Description:**  
  Frequent query lookup fields such as `Payment.userId`, `SupportTicket.userId`, `ActiveSession.userId`, `LoginLog.userId`, and `CartItem.cartId` lack explicit indexes.
- **Impact:**  
  As user and order volume grows, queries perform full table scans, resulting in severe database latency and connection pool exhaustion.
- **Recommended Fix:**
  Add `@@index([userId])`, `@@index([status])`, and `@@index([createdAt])` to relevant Prisma models.

---

## 🟡 3. Medium Severity Bugs (P2)

---

### BUG-014: N+1 Query Aggregation in Admin Dashboard User List
- **Severity:** 🟡 Medium
- **Category:** Backend Performance
- **Affected File:** [`backend/routes/dashboard.js:141-157`](backend/routes/dashboard.js#L141-L157)
- **Description:**  
  When fetching the user list (`GET /api/admin/dashboard/users`), the handler executes an individual `prisma.payment.aggregate` query for each user in a loop:
  ```javascript
  const usersWithStats = await Promise.all(
    users.map(async (user) => {
      const totalSpent = await prisma.payment.aggregate({
        _sum: { grandTotal: true },
        where: { userId: user.id }
      });
      ...
    })
  );
  ```
- **Impact:**  
  For 100 users, this executes 101 separate SQL queries instead of a single `GROUP BY` query, degrading admin dashboard performance.
- **Recommended Fix:**
  Use `prisma.payment.groupBy` or raw SQL with `SUM(grand_total) GROUP BY user_id`.

---

### BUG-015: Duplicate Key / Product Overwrite Issue in Wishlist State
- **Severity:** 🟡 Medium
- **Category:** Frontend State
- **Affected File:** [`frontend/src/App.jsx:54-67`](frontend/src/App.jsx#L54-L67)
- **Description:**  
  Wishlist toggle compares items strictly by `item.id`. However, some static mock items share the same ID across different categories or missing product ID strings.
- **Impact:**  
  Toggling a product in one category inadvertently removes/toggles another product with matching ID in another category.
- **Recommended Fix:**
  Ensure unique UUIDs or composite keys (`${category}-${id}`) for all catalog items.

---

### BUG-016: Synchronous Alert Dialogs in Payment Checkout Modal
- **Severity:** 🟡 Medium
- **Category:** UI / UX
- **Affected File:** [`frontend/src/features/cart/PaymentModal.jsx:65`](frontend/src/features/cart/PaymentModal.jsx#L65)
- **Description:**  
  The checkout flow invokes `alert(\`Payment Successful via \${method.toUpperCase()}!\`)`, freezing the browser's UI thread and breaking modern SPA aesthetic standards.
- **Impact:**  
  Poor user experience and potential UI thread blocking on mobile viewports.
- **Recommended Fix:**
  Use `addToast({ message: '...', type: 'success' })` from `ToastContext`.

---

### BUG-017: Theme State Desynchronization Between LocalStorage, Context, and Server
- **Severity:** 🟡 Medium
- **Category:** State Management
- **Affected Files:**
  - [`frontend/src/context/ThemeContext.jsx`](frontend/src/context/ThemeContext.jsx)
  - [`backend/routes/profile.js:145-179`](backend/routes/profile.js#L145-L179)
- **Description:**  
  `ThemeContext` manages theme exclusively in `localStorage`, while `UserProfile` provides a backend API `/api/profile/theme` to persist theme in `UserProfile` model. The two never synchronize upon login.
- **Impact:**  
  A user switching themes on one device does not see their preference reflected when logging in from another device.
- **Recommended Fix:**
  Fetch the user's saved theme from their profile upon authentication and update `ThemeContext`.

---

### BUG-018: Missing Authorization Checks on User Account Deletion Confirmation
- **Severity:** 🟡 Medium
- **Category:** Security / Business Logic
- **Affected File:** [`backend/routes/profile.js:182-214`](backend/routes/profile.js#L182-L214)
- **Description:**  
  Account deletion (`DELETE /api/profile/account`) deletes the user immediately with cascade. However, it does not check if the user has pending unpaid orders or active customer service disputes.
- **Impact:**  
  Orphaned financial records or deletion of orders required for tax and fulfillment records.
- **Recommended Fix:**
  Soft-delete accounts by setting `status = 'deleted'` rather than executing a hard database cascade delete.

---

### BUG-019: Missing CORS Origin Restriction in Server Configuration
- **Severity:** 🟡 Medium
- **Category:** Security / CORS
- **Affected File:** [`backend/server.js:40`](backend/server.js#L40)
- **Description:**  
  CORS is configured with default permissive settings or wildcard origins in development mode without strict origin whitelist validation for production environments.
- **Impact:**  
  Third-party malicious websites could trigger authenticated requests if credentialed CORS settings are misconfigured.
- **Recommended Fix:**
  Set specific allowed origins based on `process.env.CLIENT_ORIGIN`.

---

## 🔵 4. Low Severity & Polish Issues (P3)

---

### BUG-020: Console Log Pollution in Production Builds
- **Severity:** 🔵 Low
- **Category:** Code Quality
- **Affected Files:** Multiple backend routes and frontend components (`console.log`, `console.error`)
- **Description:**  
  Raw error stacks and token data are output to console in production mode.
- **Recommended Fix:**
  Use a production logging library (like Winston or Pino) on the backend and remove debug logs on the frontend.

---

### BUG-021: Missing Alt Attributes and Fallback Images for Catalog Products
- **Severity:** 🔵 Low
- **Category:** Accessibility / UX
- **Affected File:** [`frontend/src/features/products/ProductCard.jsx`](frontend/src/features/products/ProductCard.jsx)
- **Description:**  
  Product images from remote CDNs (Wikimedia, Logo.wine) fail silently without placeholder fallbacks if the remote CDN blocks hotlinking or is offline.
- **Recommended Fix:**
  Add `onError={(e) => { e.target.src = '/fallback-product.png'; }}` to all image tags.

---

### BUG-022: Unhandled Rejection on Cart Badge Count During Quick Multi-Clicks
- **Severity:** 🔵 Low
- **Category:** UI Consistency
- **Affected File:** [`frontend/src/features/products/ProductCard.jsx`](frontend/src/features/products/ProductCard.jsx)
- **Description:**  
  Rapidly clicking "Add to Cart" invokes asynchronous API calls concurrently without debouncing, resulting in out-of-order responses.
- **Recommended Fix:**
  Debounce cart quantity update calls or disable the button temporarily while the mutation is in flight.

---

### BUG-023: Incomplete Order Status State Machine on Backend
- **Severity:** 🟡 Low
- **Category:** Business Logic
- **Affected File:** [`backend/routes/payment.js`](backend/routes/payment.js)
- **Description:**  
  Orders can be directly changed to any status without validating allowable status transitions (e.g., transition from `delivered` back to `pending`).
- **Recommended Fix:**
  Enforce a state machine: `pending` → `processing` → `out_for_delivery` → `delivered` / `cancelled`.

---

### BUG-024: Missing Input Sanitization on Support Ticket HTML/Markdown Content
- **Severity:** 🔵 Low
- **Category:** Security / XSS
- **Affected File:** [`backend/routes/support.js:40-70`](backend/routes/support.js#L40-L70)
- **Description:**  
  Support ticket descriptions and replies are accepted as raw text and rendered without explicit sanitization.
- **Recommended Fix:**
  Sanitize support ticket strings using `DOMPurify` on frontend or `xss`/`sanitize-html` on backend.

---

## 🛠️ Step-by-Step Remediation Roadmap

1. **Immediate Security Patching (Phase 1):**
   - [ ] Lock down `/api/admin/signup` with an admin key or disable it in production.
   - [ ] Replace `localStorage` mock authentication in `api.js` and `AdminContext.jsx` with real backend JWT authentication.
   - [ ] Configure strict `JWT_SECRET` verification in backend config.

2. **Core Stability & Data Fixes (Phase 2):**
   - [ ] Fix the infinite `useEffect` dependency in `frontend/src/App.jsx`.
   - [ ] Implement missing `DELETE /api/cart/remove/:productId` and `POST /api/cart/sync` routes.
   - [ ] Wrap checkout in `prisma.$transaction` and verify product prices server-side.
   - [ ] Add `adminId` relation to `SupportReply` in `schema.prisma`.

3. **Performance & UX Optimization (Phase 3):**
   - [ ] Refactor dashboard queries to eliminate N+1 aggregate loops.
   - [ ] Add missing database indexes on `userId`, `status`, and `createdAt`.
   - [ ] Replace `alert()` calls with `ToastContext`.
   - [ ] Use environment variables for API base URLs across all components.

---
*Report generated and formatted for Grocery Mart engineering repository.*
