import request from 'supertest';
import httpStatus from 'http-status';
import {
    faker
} from '@faker-js/faker';
import app from '../../../app.js';
import setupTestDb from '../../../test/util/setupTestDb.js';
import Admin from '../../../db/models/admin.model.js';
import Teacher from '../../../db/models/teacher.model.js';
import Student from '../../../db/models/student.model.js';
import University from '../../../db/models/university.model.js';
import Branch from '../../../db/models/branch.model.js';
import Scheme from '../../../db/models/scheme.model.js';

setupTestDb();

describe('Scheme API - DELETE /api/v1/schemes/:id', () => {
    let adminToken;
    let teacherToken;
    let studentToken;
    let university;
    let branch;
    let scheme;

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
                name: 'Old Scheme Name',
                universityId: university.id
            });

            await Student.create({
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

    describe('Authentication/Authorization', () => {
        test('should return 401 when no token is provided', async () => {
            const res = await request(app).delete(`/api/v1/schemes/${scheme.id}`);
            expect(res.status).toBe(httpStatus.UNAUTHORIZED);
            expect(res.body.success).toBe(false);
        });

        test('should return 401 when invalid token is provided', async () => {
            const res = await request(app).delete(`/api/v1/schemes/${scheme.id}`).set('Authorization', 'Bearer invalidtoken');
            expect(res.status).toBe(httpStatus.UNAUTHORIZED);
            expect(res.body.success).toBe(false);
        });

        test('should return 403 for Teacher token', async () => {
            const res = await request(app).delete(`/api/v1/schemes/${scheme.id}`).set('Authorization', `Bearer ${teacherToken}`);
            expect(res.status).toBe(httpStatus.FORBIDDEN);
            expect(res.body.success).toBe(false);
        });

        test('should return 403 for Student token', async () => {
            const res = await request(app).delete(`/api/v1/schemes/${scheme.id}`).set('Authorization', `Bearer ${studentToken}`);
            expect(res.status).toBe(httpStatus.FORBIDDEN);
            expect(res.body.success).toBe(false);
        });
    });

    describe('Validation', () => {
        test('should return 400 when id is not a UUID', async () => {
            const res = await request(app).delete('/api/v1/schemes/not-a-uuid').set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Scheme ID must be a valid UUID');
        });
    });

    describe('Business logic', () => {
        test('should return 404 when scheme not found', async () => {
            const res = await request(app).delete(`/api/v1/schemes/${faker.string.uuid()}`).set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(httpStatus.NOT_FOUND);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Scheme not found');
        });

        test('should delete scheme successfully with admin token', async () => {
            const res = await request(app).delete(`/api/v1/schemes/${scheme.id}`).set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(httpStatus.OK);

            const deleted = await Scheme.findByPk(scheme.id);
            expect(deleted).toBeNull();
        });
    });
});
