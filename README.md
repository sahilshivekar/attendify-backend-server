# Presencify Backend Server
<p>
  A high-performance, scalable RESTful backend system designed to automate and manage attendance tracking for the WIET Institute. Built with a strong emphasis on security, modular architecture, and reliability, the platform powers the Presencify mobile apps by providing robust APIs for Administrators, Teachers, and Students to efficiently manage academic schedules and real-time attendance logging.
</p>

## 🚀 Tech Stack & Architecture

Presencify Backend utilizes a modern **Feature-Based Module Architecture** ensuring code maintainability and separation of concerns.

| Category        | Technology |
|-----------------|------------|
| **Runtime**         | Node.js (ES Modules) |
| **Framework**       | Express.js |
| **Database**        | PostgreSQL with Sequelize ORM |
| **Authentication** | JWT with Role-Based Access Control (RBAC) |
| **Validation**      | Joi (100% request input validation) |
| **Logging**         | Winston & Morgan |
| **Media Storage**  | Cloudinary |
| **Notifications**  | Firebase Cloud Messaging (FCM) |
| **Testing**         | Jest, Supertest, node-mocks-http |

## 📁 Project Structure

The project follows a **feature-based modular architecture**. Each feature encapsulates its own API routes, business logic controllers, Joi validation schemas, and integration tests, ensuring high cohesion.

```text
src/
 ├── config/           # Environment variables, database configuration, logging setup
 ├── db/               # Sequelize models, migrations, and seeders
 ├── middlewares/      # Global middlewares (auth, error handling, validation)
 ├── modules/          # Feature-based business logic (admin, attendance, class, etc.)
 │    ├── [feature]/
 │    │    ├── [feature].controller.js
 │    │    ├── [feature].routes.js
 │    │    ├── [feature].validation.js
 │    │    └── tests/  # Integration tests for the specific feature
 ├── utils/            # Helper classes (ApiError, ApiResponse, asyncHandler)
 ├── app.js            # Express application initialization
 └── server.js         # HTTP server entry point
```

## 🛡️ Core APIs & Features

The backend acts as the central data and business logic hub for the Presencify ecosystem, serving APIs across multiple domains:

### 🔐 Security & Authentication
- **Role-Based Access Control (RBAC)**: Secure routing mechanisms distributing distinct permissions across `Administrator`, `Teacher`, and `Student` roles.
- **JWT Authentication**: Stateless token generation and validation for maintaining session security across the mobile and web clients.
- **Data Validation**: 100% incoming request validation using Joi schemas to maintain database integrity and prevent injection attacks.

### 🛡️ Administrator APIs
- **Academic Hierarchy Management**: Complete CRUD operations to manage Universities, Branches, Schemes, Semesters, Courses, Classrooms, Divisions, and Batches.
- **User Provisioning & Management**: Endpoints to create, update, and remove student and teacher accounts, including assignments to courses and divisions.
- **Analytics & Defaulters**: Aggregation endpoints that calculate campus-wide attendance graphs and fetch official defaulter lists per semester.

### 👨‍🏫 Teacher APIs
- **Attendance Logging**: APIs to create new attendance sessions for assigned classes and record present/absent statuses.
- **Schedule Management**: Endpoints to view assigned timetables, daily class schedules, and schedule extra lectures.
- **Reporting**: Dedicated endpoints to retrieve course-wise attendance summaries and defaulter lists.

### 🎓 Student APIs
- **Attendance Verification**: Secure endpoints to submit attendance marking requests utilizing validation checks for schedule and class enrollment.
- **Analytics & History**: Endpoints to fetch personalized overall attendance percentages, course-by-course breakdowns, and granular per-lecture history.
- **Schedule & Notifications**: Endpoints providing read-only access to daily schedules, course details, and Firebase Cloud Messaging (FCM) device token management for extra lecture alerts.

## 🧪 Testing

The backend is fully tested using **Jest** and **Supertest** with a dedicated test database setup, boasting **1200+ integration tests** and **77% test coverage**.

- **Unit Tests**: Coverage for Express middlewares and utilities.
- **Integration Tests**: 1200+ comprehensive endpoint tests inside each module (`src/modules/[feature]/tests/`) covering positive cases, validation errors, and authorization checks.