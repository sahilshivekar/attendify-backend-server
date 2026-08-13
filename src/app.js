import express from "express";
import cors from "cors";
import httpStatus from 'http-status';
import cookieParser from "cookie-parser";
import {
    config
} from './config/config.js';
import {
    logger
} from './config/logger.js';
const app = express();
import xss from 'xss-clean';
import morgan from './config/morgan.js';
import helmet from 'helmet';
import compression from 'compression';
import {
    authLimiter
} from './middlewares/rateLimiter.js';
import {
    errorConverter,
    errorHandler
} from './middlewares/error.js';
import {
    ApiError
} from "./utils/ApiError.js";

app.use(cors({
    origin: config.corsOrigin,
    credentials: true
}));
logger.info(`CORS configured for origin: ${config.corsOrigin}`);

if (config.env !== 'test') {
    app.use(morgan.successHandler);
    app.use(morgan.errorHandler);
    logger.info('Morgan HTTP logging enabled');
}

app.use(helmet());
logger.info('Helmet security headers enabled');

app.use(xss());
logger.info('XSS protection enabled');

app.use(compression());
logger.info('Response compression enabled');

app.use(express.json({
    limit: "16kb"
}));
logger.info('JSON body parser enabled (limit: 16kb)');
app.use(express.urlencoded({
    extended: true,
    limit: "16kb"
}));
logger.info('URL-encoded body parser enabled (limit: 16kb)');
app.use(express.static("public"));
logger.info('Serving static files from /public');
app.use(cookieParser());
logger.info('Cookie parser enabled');

if (config.env === 'development') {
    app.use((_, __, next) => {
        setTimeout(() => {
            next();
        }, 700);
    });
    logger.info('Request delay middleware enabled (700ms delay)');
}

if (config.env === 'production') {
    app.use('/api/v1/auth', authLimiter);
    logger.info('Rate limiter enabled for /api/v1/auth endpoints');
}

import adminAuthRouter from "./routes/adminAuth.routes.js";
import studentAuthRouter from "./routes/studentAuth.routes.js";
import teacherAuthRouter from "./routes/teacherAuth.routes.js";

import adminRouter from "./routes/admin.routes.js";
import universityRouter from "./routes/university.routes.js";
import schemeRouter from "./routes/scheme.routes.js";
import courseRouter from "./routes/course.routes.js";
import branchRouter from "./routes/branch.routes.js";
import semesterRouter from "./routes/semester.routes.js";
import teacherRouter from "./routes/teacher.routes.js";
import studentRouter from "./routes/student.routes.js";
import divisionRouter from "./routes/division.routes.js";
import batchRouter from "./routes/batch.routes.js";
import timetableRouter from "./routes/timetable.routes.js";
import roomRouter from "./routes/room.routes.js";
import classRouter from "./routes/class.routes.js";
import attendanceRouter from "./routes/attendance.routes.js";
import dropoutRouter from "./routes/dropout.routes.js";
import studentFCMTokenRouter from "./routes/studentFCMToken.routes.js";

app.use("/api/v1/auth/admins", adminAuthRouter);
app.use("/api/v1/auth/students", studentAuthRouter);
app.use("/api/v1/auth/teachers", teacherAuthRouter);

app.use("/api/v1/admins", adminRouter);
app.use("/api/v1/universities", universityRouter);
app.use("/api/v1/schemes", schemeRouter);
app.use("/api/v1/courses", courseRouter);
app.use("/api/v1/branches", branchRouter);
app.use("/api/v1/semesters", semesterRouter);
app.use("/api/v1/teachers", teacherRouter);
app.use("/api/v1/students", studentRouter);
app.use("/api/v1/divisions", divisionRouter);
app.use("/api/v1/batches", batchRouter);
app.use("/api/v1/timetables", timetableRouter);
app.use("/api/v1/rooms", roomRouter);
app.use("/api/v1/classes", classRouter);
app.use("/api/v1/attendances", attendanceRouter);
app.use("/api/v1/dropouts", dropoutRouter);
app.use("/api/v1/student-fcm-tokens", studentFCMTokenRouter);
logger.info('All API routes registered');

app.use((req, res, next) => {
    next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
    logger.warn(`404 Not Found: ${req.method} ${req.originalUrl}`);
});

app.use(errorConverter);
logger.info('Error converter middleware registered');

app.use(errorHandler);
logger.info('Error handler middleware registered');

export default app;
