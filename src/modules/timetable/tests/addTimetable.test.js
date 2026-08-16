import request from 'supertest';
import httpStatus from 'http-status';
import app from '../../../app.js';
import setupTestDb from '../../../test/util/setupTestDb.js';

import Admin from '../../../db/models/admin.model.js';
import Teacher from '../../../db/models/teacher.model.js';
import University from '../../../db/models/university.model.js';
import Branch from '../../../db/models/branch.model.js';
import Scheme from '../../../db/models/scheme.model.js';
import Semester from '../../../db/models/semester.model.js';
import Division from '../../../db/models/division.model.js';
import Timetable from '../../../db/models/timetable.model.js';

setupTestDb();

describe('Timetable API - POST /api/v1/timetables', () => {
    let adminToken;
    let teacherToken;
    let university;
    let branch;
    let scheme;
    let semester;
    let division;

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
            semester = await Semester.create({
                semesterNumber: 1,
                branchId: branch.id,
                academicStartYear: 2025,
                academicEndYear: 2026,
                startDate: '2025-08-01',
                endDate: '2025-12-31',
                schemeId: scheme.id
            });
            division = await Division.create({
                divisionCode: 'A',
                semesterId: semester.id
            });
        } catch (err) {

            console.error('beforeEach setup error:', err);
            throw err;
        }
    });

    const payload = (divisionId, timetableVersion) => ({
        divisionId,
        timetableVersion
    });

    test('should return 401 when no token is provided', async () => {
        const res = await request(app).post('/api/v1/timetables').send(payload(division.id, 1));
        expect(res.status).toBe(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 when invalid token is provided', async () => {
        const res = await request(app).post('/api/v1/timetables').set('Authorization', 'Bearer invalidtoken').send(payload(division.id, 1));
        expect(res.status).toBe(httpStatus.UNAUTHORIZED);
    });

    test('should return 403 for Teacher role', async () => {
        const res = await request(app).post('/api/v1/timetables').set('Authorization', `Bearer ${teacherToken}`).send(payload(division.id, 1));
        expect(res.status).toBe(httpStatus.FORBIDDEN);
    });

    describe('Validation errors', () => {
        test('should return 400 when divisionId is missing', async () => {
            const {
                divisionId,
                ...rest
            } = payload(division.id, 1);
            const res = await request(app).post('/api/v1/timetables').set('Authorization', `Bearer ${adminToken}`).send(rest);
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Division ID is required');
        });

        test('should return 400 when divisionId is not a UUID', async () => {
            const res = await request(app).post('/api/v1/timetables').set('Authorization', `Bearer ${adminToken}`).send(payload('not-a-uuid', 1));
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Division ID must be a valid UUID');
        });

        test('should return 400 when timetableVersion is less than 1', async () => {
            const res = await request(app).post('/api/v1/timetables').set('Authorization', `Bearer ${adminToken}`).send(payload(division.id, 0));
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Timetable version must be at least 1');
        });
    });

    test('should return 404 when division not found', async () => {
        const res = await request(app).
        post('/api/v1/timetables').
        set('Authorization', `Bearer ${adminToken}`).
        send(payload('8e9efb3e-0a92-4e4f-9a9b-6f0f7b0b1234', 1));
        expect(res.status).toBe(httpStatus.NOT_FOUND);
        expect(res.body.message).toBe('Division not found');
    });

    test('should create timetable successfully', async () => {
        const res = await request(app).
        post('/api/v1/timetables').
        set('Authorization', `Bearer ${adminToken}`).
        send(payload(division.id, 2));
        expect(res.status).toBe(httpStatus.CREATED);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe('Timetable added successfully');

        const created = await Timetable.findOne({
            where: {
                divisionId: division.id,
                timetableVersion: 2
            }
        });
        expect(created).toBeTruthy();
    });
});
