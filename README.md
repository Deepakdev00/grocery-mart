# Grocery Mart

A full-stack grocery shopping web application.

## Features
- Browse products
- User authentication (signup/login)
- Add/update/remove cart items
- Checkout and payment flow
- Order history

## Tech Stack
- React (frontend)
- Node.js + Express (backend)
- MongoDB Atlas (database)

## Project Structure
- `src/` - React frontend
- `backend/` - Express API + MongoDB models/routes

## Setup
1. Install dependencies:

```bash
npm install
cd backend
npm install
cd ..
```

2. Configure frontend environment in root `.env`:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

3. Configure backend environment in `backend/.env`:

```env
MONGODB_URI=mongodb+srv://deepak_project:112233440%40@cluster0.ftkm3bj.mongodb.net/grocery-mart?appName=Cluster0
JWT_SECRET=grocery_mart_dev_secret_change_in_production
PORT=5000
NODE_ENV=development
```

Note: `@` in password is URL-encoded as `%40`.

## Run The App
1. Start backend:

```bash
cd backend
npm run dev
```

2. Start frontend in another terminal:

```bash
npm start
```

Frontend: `http://localhost:3000`  
Backend: `http://localhost:5000`
