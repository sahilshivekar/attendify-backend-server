import {
    jest
} from '@jest/globals';
import request from 'supertest';
import httpStatus from 'http-status';
import app from '../../../app.js';
import setupTestDb from '../../util/setupTestDb.js';
import Admin from '../../../db/models/admin.model.js';
import University from '../../../db/models/university.model.js';
import Branch from '../../../db/models/branch.model.js';
import Scheme from '../../../db/models/scheme.model.js';
import Semester from '../../../db/models/semester.model.js';
import Division from '../../../db/models/division.model.js';

setupTestDb();

describe('Division Controller - getDivisionById', () => {
    let adminToken;
    let university;
    let branch;
    let scheme;
    let semester;
    let division;

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
        division = await Division.create({
            divisionCode: 'A',
            semesterId: semester.id
        });
    });

    const url = (id) => `/api/v1/divisions/${id}`;

    test('should require authentication', async () => {
        const res = await request(app).
        get(url(division.id));
        expect(res.status).toBe(httpStatus.UNAUTHORIZED);
        expect(res.body.success).toBe(false);
    });

    test('should return 400 for invalid id', async () => {
        const res = await request(app).
        get(url('not-a-uuid')).
        set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(httpStatus.BAD_REQUEST);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Division ID must be a valid UUID');
    });

    test('should return 400 for invalid division id UUID', async () => {
        const res = await request(app).
        get(url('not-a-uuid')).
        set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(httpStatus.BAD_REQUEST);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Division ID must be a valid UUID');
    });

    test('should get division by id successfully', async () => {
        const res = await request(app).
        get(url(division.id)).
        set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(httpStatus.OK);
        expect(res.body.success).toBe(true);

        expect(res.body.data).toHaveProperty('divisionCode', 'A');
        expect(res.body.data).toHaveProperty('Semester');
        expect(res.body.data.Semester).toHaveProperty('id', semester.id);
        expect(res.body.data.Semester.Branch).toHaveProperty('id', branch.id);
        expect(res.body.data.Semester.Scheme).toHaveProperty('id', scheme.id);
    });
});
