# GitHub Copilot Instructions for Presencify Backend

## Core Principles & Strict Rules

- **Act as a senior backend engineer.** Prioritize correctness, security, and clean, maintainable code.
- **DO NOT MODIFY configuration files.** The following files are correctly configured and must not be altered: `package.json` (especially the `scripts`), `.babelrc`, and `jest.config.js`. Any changes to these files will break the development and testing environment.
- **Adhere strictly to the defined architecture and coding standards.**

---

## Technology Stack

- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL with Sequelize ORM
- **Testing:** Jest, Supertest, node-mocks-http

---

## Project Architecture

- **`src/app.js`**: Initialize Express, register middleware, and define routes.
- **`src/server.js`**: Start the HTTP server and initialize WebSocket connections.
- **`src/modules/`**: Follows a feature-based modular architecture. Each feature (e.g., `admin`, `attendance`, `student`) has its own directory containing:
  - `[feature].routes.js`: API endpoint mappings.
  - `[feature].controller.js`: Business logic and request handling.
  - `[feature].validation.js`: Joi validation schemas for the feature.
  - `tests/`: Integration tests for the specific feature.
- **`src/middlewares/`**:
  - `auth.middleware.js`: Verify JWTs and perform role-based authorization.
  - `error.js`: Handle centralized error conversion and response formatting.
  - `validate.js`: Connect Joi validation schemas to routes.
- **`src/config/`**: Manage all configurations, including environment variables, database connections, logging, and user roles.
- **`src/db/`**:
  - `migrations/`: Store all Sequelize migration files.
  - `seeders/`: Store all Sequelize seeder files.
  - `models/`: Define all Sequelize models and their associations.
- **`src/socket/`**: Implement real-time features using Socket.IO.
- **`src/utils/`**: Contain helper modules for common tasks (`ApiError`, `ApiResponse`, `asyncHandler`, etc.).

---

## Coding Standards

- **Module System**: Use ES Modules (`import`/`export`). Use CommonJS (`require`) **only** for Sequelize migration and seeder files (`.cjs`).
- **Asynchronous Code**: Use `async/await` for all asynchronous operations. Avoid `.then()` chains.
- **Validation**: Implement 100% input validation for all API routes using Joi schemas in the `src/validators/` directory.

---

## Security

- **Authentication**: Secure all protected endpoints using JWT Bearer tokens.
- **Authorization**: Implement role-based access control via the `verifyJWT` middleware.

---

## Database Policy

- **Transactions**: Use Sequelize transactions for all database operations that involve multiple write queries.
- **Schema & Data**: Manage database schema with migrations and populate data with seeders.

---

## Error Handling and Responses

- **Custom Errors**: Throw `new ApiError(statusCode, message)` for all operational errors.
- **Standard Responses**: Use `new ApiResponse(statusCode, message, data)` to structure all successful JSON responses.
- **Centralized Handling**: Rely on the `errorConverter` and `errorHandler` middleware to process and format all errors.

---

## Testing Guidelines

- **Scope**:
  - Write **integration tests** for API endpoints inside the corresponding module's `tests` directory (`src/modules/[feature]/tests/`).
- **Structure**:
  - Inside each module's `tests/` directory, create a separate test file for each controller function (e.g., `addAdmin.test.js`). 
  - If you need to create a instances for testing purpose in beforeEach() of any of these models:
  [Admin, Teacher, Student, University, Branch, Scheme, Semester, Division, Batch, Course, Room, Timetable, Class, Attendance, AttendanceStudent, StudentSemester, StudentDivision, StudentBatch]
  then copy paste them directly from `src/modules/attendance/tests/addStudentsAttendance.test.js`. This will save time to read whole files of models. If the model creation is not done in this file then you have to search it in models 
  - Always wrap the beforeEach() part code in try catch blog to know the errors
- **Data Management**:
  - Use the `setupTestDb.js` utility, which cleans the test database before each test run.
  - Seed only the data necessary for each specific test case within the test file itself.
- **Assertions**:
  - **Unit Tests**: Assert that `next()` is called correctly and that `req`/`res` objects are mutated as expected.
  - **Integration Tests**: Assert the HTTP status code, response body structure, and any resulting database state changes.
- **Authentication and Authorization Tests**:
  - For protected endpoints, always test for `401 Unauthorized`, `403 Forbidden`, `400 Bad Request`, `404 Not Found`, and successful `2xx` responses.
- **Mocking**:
  - **Unit Tests**: Mock external modules (`jsonwebtoken`, database models) using `jest.mock()`.
  - **Integration Tests**: **Do not mock the database.** Only mock truly external services like email (Nodemailer) or push notifications (FCM).
