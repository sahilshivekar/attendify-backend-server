import request from 'supertest';
import httpStatus from 'http-status';
import app from '../../../app.js';
import setupTestDb from '../../util/setupTestDb.js';

import Admin from '../../../db/models/admin.model.js';
import Teacher from '../../../db/models/teacher.model.js';
import Student from '../../../db/models/student.model.js';
import University from '../../../db/models/university.model.js';
import Branch from '../../../db/models/branch.model.js';
import Scheme from '../../../db/models/scheme.model.js';
import StudentFCMToken from '../../../db/models/studentFCMToken.model.js';

setupTestDb();

describe('Student FCM Token API - POST /api/v1/student-fcm-tokens', () => {
    let adminToken;
    let teacherToken;
    let studentToken;
    let university;
    let branch;
    let scheme;
    let student;

    beforeEach(async () => {
        try {

            await Admin.create({
                email: 'admin@example.com',
                username: 'adminuser',
                password: 'Admin@12345'
            });
            const adminLoginRes = await request(app).post('/api/v1/auth/admins/login').send({
                emailOrUsername: 'admin@example.com',
                password: 'Admin@12345'
            });
            adminToken = adminLoginRes.body.data.accessToken;

            await Teacher.create({
                firstName: 'John',
                lastName: 'Doe',
                email: 'teacher@example.com',
                phoneNumber: '+911234567890',
                password: 'Teacher@123',
                gender: 'Male',
                role: 'Teacher'
            });
            const teacherLoginRes = await request(app).post('/api/v1/auth/teachers/login').send({
                email: 'teacher@example.com',
                password: 'Teacher@123'
            });
            teacherToken = teacherLoginRes.body.data.accessToken;

            university = await University.create({
                name: 'Test University',
                abbreviation: 'TU'
            });
            branch = await Branch.create({
                name: 'Computer Science',
                abbreviation: 'CS'
            });
            scheme = await Scheme.create({
                name: 'CS 2026',
                universityId: university.id
            });

            student = await Student.create({
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'student1@example.com',
                phoneNumber: '+919876543210',
                prn: 'STU001',
                password: 'Student@123',
                schemeId: scheme.id,
                branchId: branch.id,
                admissionYear: 2025,
                admissionType: 'FE',
                gender: 'Male'
            });
            const studentLoginRes = await request(app).post('/api/v1/auth/students/login').send({
                emailOrPRN: 'student1@example.com',
                password: 'Student@123'
            });
            studentToken = studentLoginRes.body.data.accessToken;
        } catch (err) {

            console.error('beforeEach setup error:', err);
            throw err;
        }
    });

    const validPayload = () => ({
        studentId: student.id,
        fcmToken: 'fcm_token_12345'
    });

    test('should return 401 when no token is provided', async () => {
        const res = await request(app).post('/api/v1/student-fcm-tokens').send(validPayload());
        expect(res.status).toBe(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 when invalid token is provided', async () => {
        const res = await request(app).post('/api/v1/student-fcm-tokens').set('Authorization', 'Bearer invalidtoken').send(validPayload());
        expect(res.status).toBe(httpStatus.UNAUTHORIZED);
    });

    test('should return 403 for Teacher role', async () => {
        const res = await request(app).
        post('/api/v1/student-fcm-tokens').
        set('Authorization', `Bearer ${teacherToken}`).
        send(validPayload());
        expect(res.status).toBe(httpStatus.FORBIDDEN);
    });

    test('should allow Admin to add token', async () => {
        const res = await request(app).
        post('/api/v1/student-fcm-tokens').
        set('Authorization', `Bearer ${adminToken}`).
        send(validPayload());
        expect(res.status).toBe(httpStatus.CREATED);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe('FCM token added successfully');

        const entry = await StudentFCMToken.findOne({
            where: {
                studentId: student.id,
                fcmToken: 'fcm_token_12345'
            }
        });
        expect(entry).toBeTruthy();
    });

    test('should allow Student to add his token (student provides studentId)', async () => {
        const res = await request(app).
        post('/api/v1/student-fcm-tokens').
        set('Authorization', `Bearer ${studentToken}`).
        send({
            studentId: student.id,
            fcmToken: 'fcm_token_67890'
        });
        expect(res.status).toBe(httpStatus.CREATED);
        expect(res.body.success).toBe(true);

        const entry = await StudentFCMToken.findOne({
            where: {
                studentId: student.id,
                fcmToken: 'fcm_token_67890'
            }
        });
        expect(entry).toBeTruthy();
    });

    describe('Validation errors', () => {
        test('should return 400 when studentId is missing for Admin request', async () => {
            const {
                studentId,
                ...rest
            } = validPayload();
            const res = await request(app).
            post('/api/v1/student-fcm-tokens').
            set('Authorization', `Bearer ${adminToken}`).
            send(rest);
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Student ID is required');
        });

        test('should return 400 when studentId is not a UUID', async () => {
            const res = await request(app).
            post('/api/v1/student-fcm-tokens').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                studentId: 'not-a-uuid',
                fcmToken: 'fcm_token_12345'
            });
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Student ID must be a valid UUID');
        });

        test('should return 400 when fcmToken is missing', async () => {
            const {
                fcmToken,
                ...rest
            } = validPayload();
            const res = await request(app).
            post('/api/v1/student-fcm-tokens').
            set('Authorization', `Bearer ${adminToken}`).
            send(rest);
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('FCM token is required');
        });

        test('should return 400 when fcmToken is too short', async () => {
            const res = await request(app).
            post('/api/v1/student-fcm-tokens').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                studentId: student.id,
                fcmToken: 'short'
            });
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('FCM token must be at least 10 characters');
        });
    });

    test('should return 404 when student not found', async () => {
        const res = await request(app).
        post('/api/v1/student-fcm-tokens').
        set('Authorization', `Bearer ${adminToken}`).
        send({
            studentId: '8e9efb3e-0a92-4e4f-9a9b-6f0f7b0b1234',
            fcmToken: 'fcm_token_12345'
        });
        expect(res.status).toBe(httpStatus.NOT_FOUND);
        expect(res.body.message).toBe('Student not found');
    });

    test('should return 409 when token already exists for student', async () => {
        await StudentFCMToken.create({
            studentId: student.id,
            fcmToken: 'dup_token_12345'
        });

        const res = await request(app).
        post('/api/v1/student-fcm-tokens').
        set('Authorization', `Bearer ${adminToken}`).
        send({
            studentId: student.id,
            fcmToken: 'dup_token_12345'
        });

        expect(res.status).toBe(httpStatus.CONFLICT);
        expect(res.body.message).toBe('FCM token is already added for this student');
    });
});
