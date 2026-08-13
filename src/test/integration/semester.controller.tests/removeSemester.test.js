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
import Semester from '../../../db/models/semester.model.js';

setupTestDb();

describe('Semester API - DELETE /api/v1/semesters/:id', () => {
    let adminToken;
    let teacherToken;
    let studentToken;
    let university;
    let branch;
    let scheme;
    let semester;

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
            const studentLoginRes = await request(app).
            post('/api/v1/auth/students/login').
            send({
                emailOrPRN: 'student1@example.com',
                password: 'Student@123'
            });
            studentToken = studentLoginRes.body.data.accessToken;

            semester = await Semester.create({
                branchId: branch.id,
                schemeId: scheme.id,
                semesterNumber: 5,
                academicStartYear: 2026,
                academicEndYear: 2026,
                startDate: '2026-08-01',
                endDate: '2026-01-01'
            });
        } catch (err) {

            console.error('beforeEach setup error:', err);
            throw err;
        }
    });

    test('should return 401 when no token is provided', async () => {
        const res = await request(app).delete(`/api/v1/semesters/${semester.id}`);
        expect(res.status).toBe(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 when invalid token is provided', async () => {
        const res = await request(app).
        delete(`/api/v1/semesters/${semester.id}`).
        set('Authorization', 'Bearer invalidtoken');
        expect(res.status).toBe(httpStatus.UNAUTHORIZED);
    });

    test('should return 403 for Teacher role', async () => {
        const res = await request(app).
        delete(`/api/v1/semesters/${semester.id}`).
        set('Authorization', `Bearer ${teacherToken}`);
        expect(res.status).toBe(httpStatus.FORBIDDEN);
    });

    test('should return 403 for Student role', async () => {
        const res = await request(app).
        delete(`/api/v1/semesters/${semester.id}`).
        set('Authorization', `Bearer ${studentToken}`);
        expect(res.status).toBe(httpStatus.FORBIDDEN);
    });

    test('should return 400 when id is not a UUID', async () => {
        const res = await request(app).
        delete('/api/v1/semesters/not-a-uuid').
        set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(httpStatus.BAD_REQUEST);
        expect(res.body.message).toContain('Semester ID must be a valid UUID');
    });

    test('should return 404 when semester not found', async () => {
        const nonExistId = '8e9efb3e-0a92-4e4f-9a9b-6f0f7b0b1234';
        const res = await request(app).
        delete(`/api/v1/semesters/${nonExistId}`).
        set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(httpStatus.NOT_FOUND);
        expect(res.body.message).toBe('Semester not found');
    });

    test('should delete semester successfully', async () => {
        const res = await request(app).
        delete(`/api/v1/semesters/${semester.id}`).
        set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(httpStatus.OK);

        const deleted = await Semester.findByPk(semester.id);
        expect(deleted).toBeNull();
    });
});
