import request from 'supertest';
import app from '../../../app.js';
import setupTestDb from '../../util/setupTestDb.js';
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
import {
    ROLES
} from '../../../config/roles.js';

setupTestDb();

describe('Batch API - addBatch', () => {
    let adminToken;
    let branch;
    let university;
    let scheme;
    let semester;
    let division;

    beforeEach(async () => {

        await Admin.create({
            email: 'admin@example.com',
            username: 'adminuser',
            password: 'Admin@12345'
        });
        const loginRes = await request(app).
        post('/api/v1/auth/admins/login').
        send({
            emailOrUsername: 'admin@example.com',
            password: 'Admin@12345'
        });
        adminToken = loginRes.body.data.accessToken;

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
            branchId: branch.id,
            semesterNumber: 1,
            academicStartYear: 2026,
            academicEndYear: 2026,
            startDate: '2026-08-01',
            endDate: '2026-12-15',
            schemeId: scheme.id
        });
        division = await Division.create({
            divisionCode: 'A',
            semesterId: semester.id
        });
    });

    describe('POST /api/v1/batches', () => {
        test('should create a new batch when request is valid', async () => {
            const batchData = {
                batchCode: '2026-A',
                divisionId: division.id
            };

            const res = await request(app).
            post('/api/v1/batches').
            set('Authorization', `Bearer ${adminToken}`).
            send(batchData).
            expect(httpStatus.CREATED);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Batch added successfully');
            expect(res.body.data).toHaveProperty('batch');
            expect(res.body.data.batch).toMatchObject({
                batchCode: batchData.batchCode
            });

            const dbBatch = await Batch.findOne({
                where: {
                    batchCode: batchData.batchCode
                }
            });
            expect(dbBatch).toBeTruthy();
            expect(dbBatch.batchCode).toBe(batchData.batchCode);
        });

        test('should return 404 when division not found', async () => {
            const res = await request(app).
            post('/api/v1/batches').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                batchCode: '2026-B',
                divisionId: faker.string.uuid()
            }).
            expect(httpStatus.NOT_FOUND);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Division not found');
        });

        test('should return 400 when batchCode is missing', async () => {
            const res = await request(app).
            post('/api/v1/batches').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                divisionId: division.id
            }).
            expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Batch code is required');
        });

        test('should return 400 when divisionId is invalid', async () => {
            const res = await request(app).
            post('/api/v1/batches').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                batchCode: '2026-C',
                divisionId: 'invalid-uuid'
            }).
            expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Division ID must be a valid UUID');
        });

        test('should return 401 when no authorization token is provided', async () => {
            const res = await request(app).
            post('/api/v1/batches').
            send({
                batchCode: '2026-D',
                divisionId: division.id
            }).
            expect(httpStatus.UNAUTHORIZED);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Unauthorized');
        });
    });
});
