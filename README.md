# C4GT HUB - Learning & Performance Management System

## Project Overview

C4GT HUB is a Learning & Performance Management System designed to coordinate learning cohorts, manage task delegations, provide learning resources, and track participant progress across three primary roles: Administrators, Team Leads, and Students.

This repository contains the foundation setup organized into completely decoupled frontend and backend applications.

## Technology Stack

### Frontend
- React (v19)
- Vite (v6)
- JavaScript
- Tailwind CSS (v4 via @tailwindcss/vite)
- React Router DOM (v7)
- shadcn/ui component architecture (with clsx and tailwind-merge)
- Recharts (for future performance visualizations)
- Lucide React (icons)

### Backend
- Node.js
- Express.js
- MongoDB & Mongoose
- CORS
- Dotenv
- Nodemon (development server)

## Folder Structure

```
c4gt-kiet-hub/
├── .gitignore
├── README.md
├── backend/
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   ├── server.js
│   ├── config/
│   │   ├── db.js
│   │   └── env.js
│   ├── controllers/
│   │   └── healthController.js
│   ├── middleware/
│   │   ├── errorHandler.js
│   │   └── notFound.js
│   ├── models/
│   │   ├── Resource.js
│   │   ├── Task.js
│   │   ├── TaskAssignment.js
│   │   ├── Team.js
│   │   └── User.js
│   └── routes/
│       ├── healthRoutes.js
│       └── index.js
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── index.css
        ├── main.jsx
        ├── components/
        │   └── ui/
        │       ├── button.jsx
        │       └── card.jsx
        ├── layouts/
        │   └── RootLayout.jsx
        ├── lib/
        │   └── utils.js
        └── pages/
            ├── AdminDashboard.jsx
            ├── Login.jsx
            ├── NotFound.jsx
            ├── StudentDashboard.jsx
            └── TeamLeadDashboard.jsx
```

## Environment Setup

### Backend Configuration

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Copy `.env.example` to create your local `.env` file:
   ```bash
   cp .env.example .env
   ```
3. Populate the variables in `backend/.env`:
   - `PORT`: Server port number (default: `5000`)
   - `MONGODB_URI`: MongoDB Atlas connection URI (e.g. `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority`)

## Installation Instructions

### 1. Install Backend Dependencies
```bash
cd backend
npm install
```

### 2. Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

## Run Commands

### Running Backend
- Development mode (with live reload via Nodemon):
  ```bash
  cd backend
  npm run dev
  ```
- Production mode:
  ```bash
  cd backend
  npm start
  ```
- Health Check Endpoint:
  ```
  GET http://localhost:5000/api/health
  ```

### Running Frontend
- Development server:
  ```bash
  cd frontend
  npm run dev
  ```
- Production build:
  ```bash
  cd frontend
  npm run build
  ```
- Production preview:
  ```bash
  cd frontend
  npm run preview
  ```
