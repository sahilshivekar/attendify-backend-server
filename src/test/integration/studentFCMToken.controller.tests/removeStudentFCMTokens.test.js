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

describe('Student FCM Token API - DELETE /api/v1/student-fcm-tokens', () => {
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
            const adminLoginRes = await request(app).
            post('/api/v1/auth/admins/login').
            send({
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
            const teacherLoginRes = await request(app).
            post('/api/v1/auth/teachers/login').
            send({
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
            const studentLoginRes = await request(app).
            post('/api/v1/auth/students/login').
            send({
                emailOrPRN: 'student1@example.com',
                password: 'Student@123'
            });
            studentToken = studentLoginRes.body.data.accessToken;
        } catch (err) {

            console.error('beforeEach setup error:', err);
            throw err;
        }
    });

    test('should return 401 when no token is provided', async () => {
        const res = await request(app).
        delete('/api/v1/student-fcm-tokens').
        query({
            studentId: student.id
        });
        expect(res.status).toBe(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 when invalid token is provided', async () => {
        const res = await request(app).
        delete('/api/v1/student-fcm-tokens').
        set('Authorization', 'Bearer invalidtoken').
        query({
            studentId: student.id
        });
        expect(res.status).toBe(httpStatus.UNAUTHORIZED);
    });

    test('should return 403 for Teacher role', async () => {
        const res = await request(app).
        delete('/api/v1/student-fcm-tokens').
        set('Authorization', `Bearer ${teacherToken}`).
        query({
            studentId: student.id
        });
        expect(res.status).toBe(httpStatus.FORBIDDEN);
    });

    describe('Validation errors', () => {
        test('should return 400 when studentId is missing', async () => {
            const res = await request(app).
            delete('/api/v1/student-fcm-tokens').
            set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Student ID is required');
        });

        test('should return 400 when studentId is not a UUID', async () => {
            const res = await request(app).
            delete('/api/v1/student-fcm-tokens').
            set('Authorization', `Bearer ${adminToken}`).
            query({
                studentId: 'not-a-uuid'
            });
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Student ID must be a valid UUID');
        });
    });

    test('should return 404 when student not found', async () => {
        const res = await request(app).
        delete('/api/v1/student-fcm-tokens').
        set('Authorization', `Bearer ${adminToken}`).
        query({
            studentId: '8e9efb3e-0a92-4e4f-9a9b-6f0f7b0b1234'
        });
        expect(res.status).toBe(httpStatus.NOT_FOUND);
        expect(res.body.message).toBe('Student not found');
    });

    test('should return 404 when token not added for the student', async () => {
        const res = await request(app).
        delete('/api/v1/student-fcm-tokens').
        set('Authorization', `Bearer ${adminToken}`).
        query({
            studentId: student.id
        });
        expect(res.status).toBe(httpStatus.NOT_FOUND);
        expect(res.body.message).toBe('FCM token is not added for this student');
    });

    test('should delete token successfully as Admin', async () => {

        await StudentFCMToken.create({
            studentId: student.id,
            fcmToken: 'fcm_token_12345'
        });

        const res = await request(app).
        delete('/api/v1/student-fcm-tokens').
        set('Authorization', `Bearer ${adminToken}`).
        query({
            studentId: student.id
        });
        expect(res.status).toBe(httpStatus.OK);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe('FCM token deleted successfully');

        const entry = await StudentFCMToken.findOne({
            where: {
                studentId: student.id
            }
        });
        expect(entry).toBeNull();
    });

    test('should delete token successfully as Student (self)', async () => {
        await StudentFCMToken.create({
            studentId: student.id,
            fcmToken: 'fcm_token_67890'
        });

        const res = await request(app).
        delete('/api/v1/student-fcm-tokens').
        set('Authorization', `Bearer ${studentToken}`).
        query({
            studentId: student.id
        });
        expect(res.status).toBe(httpStatus.OK);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe('FCM token deleted successfully');
    });
});
