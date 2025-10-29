# Assign0

A web app for students to manage group assignments and track submissions. Professors can create assignments and monitor progress.

## What it does

**For Students:**
- Create groups and add members
- View assignments from professors
- Submit work through a two-step confirmation
- Track progress on assignments

**For Professors:**
- Post assignments with due dates
- Assign to all students or specific groups
- See who submitted and who hasn't
- Check completion stats

## Tech Stack

**Backend:** Node.js, Express, MongoDB, JWT  
**Frontend:** React, Tailwind CSS  
**Deployment:** Docker


## Setup

### Requirements
- Node.js 18+
- MongoDB


### Quick Start

1. **Clone and setup database**
```bash
git clone <your-repo>
cd Assign0-app
# Make sure MongoDB is running locally or use MongoDB Atlas
```

2. **Backend**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB connection string and JWT secret
npm run db:init
npm run dev
```

Server runs on `http://localhost:5000`

Default admin login:
- Email: `admin@Assigno.com`
- Password: `admin123`

3. **Frontend**
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

App runs on `http://localhost:5173`


Frontend: `http://localhost`  
Backend: `http://localhost:5000`

## How to Use

1. Register as a student
2. Create a group and invite members
3. Check assignments posted by professors
4. Submit through the OneDrive link
5. Confirm submission (two-step process)

Professors log in to create assignments and check who submitted.

## Project Structure

```
joineazy-app/
├── backend/          # Node.js API
├── frontend/         # React app
└── docker-compose.yml
```

---

Questions? Open an issue.
