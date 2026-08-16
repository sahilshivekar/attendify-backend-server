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

describe('Division Controller - getDivisions', () => {
    let adminToken;
    let university;
    let branch;
    let scheme;
    let semester1;
    let semester2;
    let divisionA;
    let divisionB;

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
        semester1 = await Semester.create({
            semesterNumber: 1,
            branchId: branch.id,
            academicStartYear: 2025,
            academicEndYear: 2026,
            startDate: '2025-08-01',
            endDate: '2025-12-31',
            schemeId: scheme.id
        });
        semester2 = await Semester.create({
            semesterNumber: 2,
            branchId: branch.id,
            academicStartYear: 2025,
            academicEndYear: 2026,
            startDate: '2026-01-01',
            endDate: '2026-06-01',
            schemeId: scheme.id
        });
        divisionA = await Division.create({
            divisionCode: 'A',
            semesterId: semester1.id
        });
        divisionB = await Division.create({
            divisionCode: 'B',
            semesterId: semester2.id
        });
    });

    const url = '/api/v1/divisions';

    test('should require authentication', async () => {
        const res = await request(app).get(url);
        expect(res.status).toBe(httpStatus.UNAUTHORIZED);
        expect(res.body.success).toBe(false);
    });

    test('should return all divisions with default pagination', async () => {
        const res = await request(app).
        get(url).
        set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(httpStatus.OK);
        expect(res.body.success).toBe(true);
        expect(res.body.data.divisions.length).toBeGreaterThanOrEqual(2);
        expect(res.body.data.totalCount).toBeGreaterThanOrEqual(2);
    });

    test('should filter by searchQuery', async () => {
        const res = await request(app).
        get(url).
        set('Authorization', `Bearer ${adminToken}`).
        query({
            searchQuery: 'A'
        });
        expect(res.status).toBe(httpStatus.OK);
        expect(res.body.data.divisions.length).toBe(1);
        expect(res.body.data.divisions[0].divisionCode).toBe('A');
    });

    test('should filter by semesterNumber', async () => {
        const res = await request(app).
        get(url).
        set('Authorization', `Bearer ${adminToken}`).
        query({
            semesterNumber: 2
        });
        expect(res.status).toBe(httpStatus.OK);
        expect(res.body.data.divisions.length).toBe(1);
        expect(res.body.data.divisions[0].divisionCode).toBe('B');
    });

    test('should filter by branchId', async () => {
        const res = await request(app).
        get(url).
        set('Authorization', `Bearer ${adminToken}`).
        query({
            branchId: branch.id
        });
        expect(res.status).toBe(httpStatus.OK);
        expect(res.body.data.divisions.length).toBeGreaterThanOrEqual(2);
    });

    test('should filter by semesterId', async () => {
        const res = await request(app).
        get(url).
        set('Authorization', `Bearer ${adminToken}`).
        query({
            semesterId: semester1.id
        });
        expect(res.status).toBe(httpStatus.OK);
        expect(res.body.data.divisions.length).toBe(1);
        expect(res.body.data.divisions[0].divisionCode).toBe('A');
    });

    test('should support pagination', async () => {
        const res = await request(app).
        get(url).
        set('Authorization', `Bearer ${adminToken}`).
        query({
            page: 1,
            limit: 1
        });
        expect(res.status).toBe(httpStatus.OK);
        expect(res.body.data.divisions.length).toBe(1);
        expect(res.body.data.totalCount).toBeGreaterThanOrEqual(2);
    });

    test('should return all divisions when getAll=true', async () => {
        const res = await request(app).
        get(url).
        set('Authorization', `Bearer ${adminToken}`).
        query({
            getAll: true,
            limit: 1
        });
        expect(res.status).toBe(httpStatus.OK);
        expect(res.body.data.divisions.length).toBeGreaterThanOrEqual(2);
    });

    test('should return 400 for invalid branchId', async () => {
        const res = await request(app).
        get(url).
        set('Authorization', `Bearer ${adminToken}`).
        query({
            branchId: 'not-a-uuid'
        });
        expect(res.status).toBe(httpStatus.BAD_REQUEST);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('valid UUID');
    });

    test('should return 400 for invalid semesterId', async () => {
        const res = await request(app).
        get(url).
        set('Authorization', `Bearer ${adminToken}`).
        query({
            semesterId: 'not-a-uuid'
        });
        expect(res.status).toBe(httpStatus.BAD_REQUEST);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('valid UUID');
    });
});
