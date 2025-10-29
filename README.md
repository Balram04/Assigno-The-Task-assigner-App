# Joineazy - Student Group Management System

A full-stack role-based web application for managing student groups, assignments, and submissions.

## 🚀 Features

### Student Features
- ✅ User registration and authentication
- ✅ Create and manage groups
- ✅ Add/remove group members by email or student ID
- ✅ View all assignments posted by professors
- ✅ Access OneDrive submission links
- ✅ Two-step submission confirmation process
- ✅ Visual progress tracking with completion percentages
- ✅ Group-wise assignment status

### Admin (Professor) Features
- ✅ Create, edit, and delete assignments
- ✅ Set due dates and OneDrive submission links
- ✅ Assign work to all students or specific groups
- ✅ Track group-wise submission confirmations
- ✅ Analytics dashboard with completion rates
- ✅ Monitor overall progress and performance

## 🛠️ Technology Stack

### Backend
- **Node.js** + **Express.js** - REST API
- **PostgreSQL** - Relational database
- **JWT** - Authentication & authorization
- **bcryptjs** - Password hashing
- **express-validator** - Input validation

### Frontend
- **React.js** - UI library
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Axios** - HTTP client
- **Lucide React** - Icons

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration

## 📁 Project Structure

```
Assigno-app/
├── backend/
│   ├── config/
│   │   ├── database.js           # PostgreSQL connection
│   │   └── initDb.js             # Database initialization
│   ├── controllers/
│   │   ├── authController.js     # Authentication logic
│   │   ├── groupController.js    # Group management
│   │   ├── assignmentController.js
│   │   └── submissionController.js
│   ├── middleware/
│   │   ├── auth.js               # JWT authentication
│   │   └── validation.js         # Request validation
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── groupRoutes.js
│   │   ├── assignmentRoutes.js
│   │   └── submissionRoutes.js
│   ├── utils/
│   │   └── jwt.js                # JWT utilities
│   ├── .env.example
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/
│   │   │   │   ├── AssignmentManagement.jsx
│   │   │   │   └── Analytics.jsx
│   │   │   ├── student/
│   │   │   │   ├── GroupManagement.jsx
│   │   │   │   ├── AssignmentList.jsx
│   │   │   │   └── ProgressTracker.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── StudentDashboard.jsx
│   │   │   └── AdminDashboard.jsx
│   │   ├── utils/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env.example
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── database/
│   └── schema.sql
│
├── docker-compose.yml
└── README.md
```

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL 15+
- Docker & Docker Compose (for containerized setup)

### Option 1: Local Development Setup

#### 1. Clone the repository
```bash
git clone <repository-url>
cd Assigno-app
```

#### 2. Set up the database
```bash
# Install PostgreSQL and create database
createdb joineazy_db

# Run the schema
psql -d joineazy_db -f database/schema.sql
```

#### 3. Set up the backend
```bash
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your database credentials
# DB_PASSWORD=your_postgres_password
# JWT_SECRET=your_secret_key

# Initialize database with default admin
npm run db:init

# Start the server
npm run dev
```

The backend will run on `http://localhost:5000`

Default admin credentials:
- Email: `admin@Assigno.com`
- Password: `admin123`

#### 4. Set up the frontend
```bash
cd frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start the development server
npm run dev
```

The frontend will run on `http://localhost:5173`

### Option 2: Docker Setup

#### 1. Build and run with Docker Compose
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### 2. Initialize the database
```bash
# Run database initialization
docker-compose exec backend node config/initDb.js
```

Access the application:
- Frontend: `http://localhost`
- Backend API: `http://localhost:5000`
- Database: `localhost:5432`

## 📚 API Documentation

### Authentication Endpoints

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "password123",
  "fullName": "John Doe",
  "role": "student",
  "studentId": "ST12345"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "password123"
}
```

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

### Group Endpoints (Student)

#### Create Group
```http
POST /api/groups
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Group Alpha",
  "description": "Our study group"
}
```

#### Get User Groups
```http
GET /api/groups
Authorization: Bearer <token>
```

#### Add Member
```http
POST /api/groups/:groupId/members
Authorization: Bearer <token>
Content-Type: application/json

{
  "emailOrStudentId": "student2@example.com"
}
```

### Assignment Endpoints

#### Create Assignment (Admin)
```http
POST /api/assignments
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "title": "Project 1",
  "description": "Complete the assignment",
  "dueDate": "2025-12-31T23:59:00",
  "onedriveLink": "https://onedrive.live.com/...",
  "isForAll": true
}
```

#### Get Assignments (Student)
```http
GET /api/assignments
Authorization: Bearer <token>
```

### Submission Endpoints (Student)

#### Submit Assignment (Step 1)
```http
POST /api/submissions/submit
Authorization: Bearer <token>
Content-Type: application/json

{
  "assignmentId": "uuid",
  "groupId": "uuid",
  "submissionNotes": "Completed all tasks"
}
```

#### Confirm Submission (Step 2)
```http
POST /api/submissions/confirm
Authorization: Bearer <token>
Content-Type: application/json

{
  "assignmentId": "uuid",
  "groupId": "uuid"
}
```

#### Get Group Progress
```http
GET /api/submissions/progress/:groupId
Authorization: Bearer <token>
```

## 🔐 Security Features

- JWT-based authentication with secure token storage
- Password hashing using bcryptjs
- Role-based access control (Student/Admin)
- Input validation and sanitization
- SQL injection prevention with parameterized queries
- CORS configuration
- Helmet.js for security headers

## 📊 Database Schema

### Tables
- **users** - User accounts (students and admins)
- **groups** - Student groups
- **group_members** - Group membership (junction table)
- **assignments** - Assignments created by professors
- **assignment_groups** - Specific group assignments
- **submissions** - Assignment submission tracking

### Key Relationships
- One-to-Many: User → Groups (creator)
- Many-to-Many: Users ↔ Groups (via group_members)
- One-to-Many: Admin → Assignments
- Many-to-Many: Assignments ↔ Groups (via assignment_groups)
- One-to-One: Group + Assignment → Submission

## 🎨 UI Features

- Responsive design for mobile and desktop
- Modern gradient backgrounds
- Interactive progress bars
- Real-time status badges
- Modal dialogs for forms
- Tab-based navigation
- Loading states and animations

## 🔄 Two-Step Submission Process

1. **Step 1 - Initial Submission**: Student confirms they have uploaded files to OneDrive
2. **Step 2 - Final Confirmation**: Student provides final confirmation of submission

This ensures students are certain about their submission before it's marked as complete.

## 🧪 Testing

### Testing User Accounts

After initialization, use these credentials:

**Admin Account:**
- Email: `admin@Assigno.com`
- Password: `admin123`

**Create student accounts through the registration page**

### Test Flow

1. Register a student account
2. Create a group
3. Add members to the group
4. Login as admin
5. Create an assignment
6. Login as student
7. View the assignment
8. Submit in two steps
9. Check progress tracker
10. View analytics as admin

## 🚀 Deployment

### Environment Variables for Production

**Backend (.env)**
```env
NODE_ENV=production
PORT=5000
DB_HOST=your_db_host
DB_PORT=5432
DB_NAME=joineazy_db
DB_USER=your_db_user
DB_PASSWORD=your_secure_password
JWT_SECRET=your_very_secure_jwt_secret_key
JWT_EXPIRE=7d
CORS_ORIGIN=https://your-frontend-domain.com
```

**Frontend (.env)**
```env
VITE_API_URL=https://your-backend-domain.com/api
```

### Deployment Checklist
- [ ] Update JWT_SECRET to a strong random value
- [ ] Update database credentials
- [ ] Configure CORS_ORIGIN to your frontend domain
- [ ] Set up SSL certificates
- [ ] Configure firewall rules
- [ ] Set up database backups
- [ ] Enable logging and monitoring
- [ ] Update default admin password

## 📝 License

This project is created for educational purposes.

## 👥 Support

For issues or questions, please create an issue in the repository.

---

**Built with ❤️ using React, Node.js, PostgreSQL, and Docker**
