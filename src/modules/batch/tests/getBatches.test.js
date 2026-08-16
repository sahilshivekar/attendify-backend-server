import request from 'supertest';
import app from '../../../app.js';
import setupTestDb from '../../../test/util/setupTestDb.js';
import Admin from '../../../db/models/admin.model.js';
import Branch from '../../../db/models/branch.model.js';
import University from '../../../db/models/university.model.js';
import Scheme from '../../../db/models/scheme.model.js';
import Semester from '../../../db/models/semester.model.js';
import Division from '../../../db/models/division.model.js';
import Batch from '../../../db/models/batch.model.js';
import {
    faker
} from '@faker-js/faker';
import httpStatus from 'http-status';

setupTestDb();

describe('Batch API - getBatches', () => {
    let adminToken;
    let branch;
    let university;
    let scheme;
    let semester;
    let divisionA;
    let divisionB;

    beforeEach(async () => {

        await Admin.create({
            email: 'admin3@example.com',
            username: 'adminuser3',
            password: 'Admin@12345'
        });
        const loginRes = await request(app).
        post('/api/v1/auth/admins/login').
        send({
            emailOrUsername: 'admin3@example.com',
            password: 'Admin@12345'
        });
        adminToken = loginRes.body.data.accessToken;

        branch = await Branch.create({
            name: 'ECE',
            abbreviation: 'ECE'
        });
        university = await University.create({
            name: 'Test University',
            abbreviation: 'TU'
        });
        scheme = await Scheme.create({
            name: 'ECE 2026 Scheme',
            universityId: university.id
        });
        semester = await Semester.create({
            branchId: branch.id,
            semesterNumber: 3,
            academicStartYear: 2026,
            academicEndYear: 2026,
            startDate: '2026-08-01',
            endDate: '2026-12-15',
            schemeId: scheme.id
        });
        divisionA = await Division.create({
            divisionCode: 'C',
            semesterId: semester.id
        });
        divisionB = await Division.create({
            divisionCode: 'D',
            semesterId: semester.id
        });

        await Batch.create({
            batchCode: '2026-C',
            divisionId: divisionA.id
        });
        await Batch.create({
            batchCode: '2026-D',
            divisionId: divisionB.id
        });
    });

    describe('GET /api/v1/batches', () => {
        test('should return all batches without filters', async () => {
            const res = await request(app).
            get('/api/v1/batches').
            set('Authorization', `Bearer ${adminToken}`).
            expect(httpStatus.OK);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Batches fetched successfully');
            expect(res.body.data.batches).toHaveLength(2);
            expect(res.body.data.totalCount).toBe(2);
        });

        test('should filter by searchQuery', async () => {
            const res = await request(app).
            get('/api/v1/batches').
            set('Authorization', `Bearer ${adminToken}`).
            query({
                searchQuery: 'C'
            }).
            expect(httpStatus.OK);

            expect(res.body.data.batches.every((b) => b.batchCode.includes('C'))).toBe(true);
        });

        test('should filter by divisionId', async () => {
            const res = await request(app).
            get('/api/v1/batches').
            set('Authorization', `Bearer ${adminToken}`).
            query({
                divisionId: divisionA.id
            }).
            expect(httpStatus.OK);

            expect(res.body.data.batches).toHaveLength(1);
            expect(res.body.data.batches[0].divisionId).toBe(divisionA.id);
        });

        test('should paginate results', async () => {
            const res = await request(app).
            get('/api/v1/batches').
            set('Authorization', `Bearer ${adminToken}`).
            query({
                page: 2,
                limit: 1
            }).
            expect(httpStatus.OK);

            expect(res.body.data.batches).toHaveLength(1);
            expect(res.body.data.totalCount).toBe(2);
        });

        test('should return 400 for invalid query param', async () => {
            const res = await request(app).
            get('/api/v1/batches').
            set('Authorization', `Bearer ${adminToken}`).
            query({
                page: 'invalid'
            }).
            expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Page must be a number');
        });

        test('should return 401 when no token', async () => {
            const res = await request(app).
            get('/api/v1/batches').
            expect(httpStatus.UNAUTHORIZED);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Unauthorized');
        });
    });
});
