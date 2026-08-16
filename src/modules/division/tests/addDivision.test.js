import {
    jest
} from '@jest/globals';
import request from 'supertest';
import httpStatus from 'http-status';
import app from '../../../app.js';
import setupTestDb from '../../../test/util/setupTestDb.js';
import Admin from '../../../db/models/admin.model.js';
import University from '../../../db/models/university.model.js';
import Branch from '../../../db/models/branch.model.js';
import Scheme from '../../../db/models/scheme.model.js';
import Semester from '../../../db/models/semester.model.js';
import Division from '../../../db/models/division.model.js';

setupTestDb();

describe('Division Controller - addDivision', () => {
    test('should not allow duplicate divisionCode in the same semester', async () => {

        await Division.create({
            divisionCode: 'A',
            semesterId: semester.id
        });

        const res = await request(app).
        post(url).
        set('Authorization', `Bearer ${adminToken}`).
        send({
            divisionCode: 'A',
            semesterId: semester.id
        });
        expect(res.status).toBe(httpStatus.CONFLICT);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Duplicate divisionCode in the same semester is not allowed');
    });
    let adminToken;
    let university;
    let branch;
    let scheme;
    let semester;

    beforeEach(async () => {
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

        university = await University.create({
            name: 'Test University',
            abbreviation: 'TU'
        });
        branch = await Branch.create({
            name: 'Computer Science',
            abbreviation: 'CS'
        });
        scheme = await Scheme.create({
            name: 'CS 2026 Scheme',
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
    });

    const url = '/api/v1/divisions';

    test('should require authentication', async () => {
        const res = await request(app).
        post(url).
        send({
            divisionCode: 'A',
            semesterId: semester.id
        });
        expect(res.status).toBe(httpStatus.UNAUTHORIZED);
        expect(res.body.success).toBe(false);
    });

    test('should return 400 for missing divisionCode', async () => {
        const res = await request(app).
        post(url).
        set('Authorization', `Bearer ${adminToken}`).
        send({
            semesterId: semester.id
        });
        expect(res.status).toBe(httpStatus.BAD_REQUEST);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Division code is required');
    });

    test('should return 400 for missing semesterId', async () => {
        const res = await request(app).
        post(url).
        set('Authorization', `Bearer ${adminToken}`).
        send({
            divisionCode: 'A'
        });
        expect(res.status).toBe(httpStatus.BAD_REQUEST);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Semester ID is required');
    });

    test('should return 400 for invalid semesterId UUID', async () => {
        const res = await request(app).
        post(url).
        set('Authorization', `Bearer ${adminToken}`).
        send({
            divisionCode: 'A',
            semesterId: 'not-a-uuid'
        });
        expect(res.status).toBe(httpStatus.BAD_REQUEST);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Semester ID must be a valid UUID');
    });

    test('should add division successfully', async () => {
        const res = await request(app).
        post(url).
        set('Authorization', `Bearer ${adminToken}`).
        send({
            divisionCode: 'A',
            semesterId: semester.id
        });
        expect(res.status).toBe(httpStatus.CREATED);
        expect(res.body.success).toBe(true);
        expect(res.body.data.division.divisionCode).toBe('A');
        expect(res.body.data.division.semesterId).toBe(semester.id);
    });

    test('should allow duplicate divisionCode for different semesters', async () => {

        await Division.create({
            divisionCode: 'A',
            semesterId: semester.id
        });

        const semester2 = await Semester.create({
            semesterNumber: 2,
            branchId: branch.id,
            academicStartYear: 2025,
            academicEndYear: 2026,
            startDate: '2026-01-01',
            endDate: '2026-06-01',
            schemeId: scheme.id
        });

        const res = await request(app).
        post(url).
        set('Authorization', `Bearer ${adminToken}`).
        send({
            divisionCode: 'A',
            semesterId: semester2.id
        });
        expect(res.status).toBe(httpStatus.CREATED);
        expect(res.body.success).toBe(true);
        expect(res.body.data.division.divisionCode).toBe('A');
        expect(res.body.data.division.semesterId).toBe(semester2.id);
    });
});
