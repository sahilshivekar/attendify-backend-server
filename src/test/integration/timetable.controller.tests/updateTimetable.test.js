import request from 'supertest';
import httpStatus from 'http-status';
import app from '../../../app.js';
import setupTestDb from '../../util/setupTestDb.js';

import Admin from '../../../db/models/admin.model.js';
import Teacher from '../../../db/models/teacher.model.js';
import University from '../../../db/models/university.model.js';
import Branch from '../../../db/models/branch.model.js';
import Scheme from '../../../db/models/scheme.model.js';
import Semester from '../../../db/models/semester.model.js';
import Division from '../../../db/models/division.model.js';
import Timetable from '../../../db/models/timetable.model.js';

setupTestDb();

describe('Timetable API - PUT /api/v1/timetables/:id', () => {
    let adminToken;
    let teacherToken;
    let timetable;

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

            const university = await University.create({
                name: 'Test University',
                abbreviation: 'TU'
            });
            const branch = await Branch.create({
                name: 'Computer Science',
                abbreviation: 'CS'
            });
            const scheme = await Scheme.create({
                name: 'CS 2026',
                universityId: university.id
            });
            const semester = await Semester.create({
                semesterNumber: 1,
                branchId: branch.id,
                academicStartYear: 2025,
                academicEndYear: 2026,
                startDate: '2025-08-01',
                endDate: '2025-12-31',
                schemeId: scheme.id
            });
            const division = await Division.create({
                divisionCode: 'A',
                semesterId: semester.id
            });
            timetable = await Timetable.create({
                divisionId: division.id,
                timetableVersion: 1
            });
        } catch (err) {

            console.error('beforeEach setup error:', err);
            throw err;
        }
    });

    const url = (id) => `/api/v1/timetables/${id}`;

    test('should return 401 when no token is provided', async () => {
        const res = await request(app).put(url(timetable.id)).send({
            timetableVersion: 2
        });
        expect(res.status).toBe(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 when invalid token is provided', async () => {
        const res = await request(app).put(url(timetable.id)).set('Authorization', 'Bearer invalidtoken').send({
            timetableVersion: 2
        });
        expect(res.status).toBe(httpStatus.UNAUTHORIZED);
    });

    test('should return 403 for Teacher role', async () => {
        const res = await request(app).put(url(timetable.id)).set('Authorization', `Bearer ${teacherToken}`).send({
            timetableVersion: 2
        });
        expect(res.status).toBe(httpStatus.FORBIDDEN);
    });

    describe('Validation errors', () => {
        test('should return 400 for invalid UUID id', async () => {
            const res = await request(app).put('/api/v1/timetables/not-a-uuid').set('Authorization', `Bearer ${adminToken}`).send({
                timetableVersion: 2
            });
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Timetable ID must be a valid UUID');
        });

        test('should return 400 when timetableVersion is missing', async () => {
            const res = await request(app).put(url(timetable.id)).set('Authorization', `Bearer ${adminToken}`).send({});
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Timetable version is required');
        });

        test('should return 400 when timetableVersion is not a number', async () => {
            const res = await request(app).put(url(timetable.id)).set('Authorization', `Bearer ${adminToken}`).send({
                timetableVersion: 'two'
            });
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Timetable version must be a number');
        });
    });

    test('should return 404 when timetable not found', async () => {
        const res = await request(app).
        put('/api/v1/timetables/8e9efb3e-0a92-4e4f-9a9b-6f0f7b0b1234').
        set('Authorization', `Bearer ${adminToken}`).
        send({
            timetableVersion: 2
        });
        expect(res.status).toBe(httpStatus.NOT_FOUND);
        expect(res.body.message).toBe('Timetable not found');
    });

    test('should return 400 when new version is not greater than current', async () => {
        const res = await request(app).
        put(url(timetable.id)).
        set('Authorization', `Bearer ${adminToken}`).
        send({
            timetableVersion: 1
        });
        expect(res.status).toBe(httpStatus.BAD_REQUEST);
        expect(res.body.message).toBe('Timetable version must be greater than current version');
    });

    test('should update timetable successfully', async () => {
        const res = await request(app).
        put(url(timetable.id)).
        set('Authorization', `Bearer ${adminToken}`).
        send({
            timetableVersion: 3
        });
        expect(res.status).toBe(httpStatus.OK);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe('Timetable updated successfully');

        const updated = await Timetable.findByPk(timetable.id);
        expect(updated.timetableVersion).toBe(3);
    });
});
