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

setupTestDb();

describe('Batch API - removeBatch', () => {
    let adminToken;
    let branch;
    let university;
    let scheme;
    let semester;
    let division;
    let batch;

    beforeEach(async () => {

        await Admin.create({
            email: 'admin5@example.com',
            username: 'adminuser5',
            password: 'Admin@12345'
        });
        const loginRes = await request(app).
        post('/api/v1/auth/admins/login').
        send({
            emailOrUsername: 'admin5@example.com',
            password: 'Admin@12345'
        });
        adminToken = loginRes.body.data.accessToken;

        branch = await Branch.create({
            name: 'CE',
            abbreviation: 'CE'
        });
        university = await University.create({
            name: 'Test University',
            abbreviation: 'TU'
        });
        scheme = await Scheme.create({
            name: 'CE 2026 Scheme',
            universityId: university.id
        });
        semester = await Semester.create({
            branchId: branch.id,
            semesterNumber: 5,
            academicStartYear: 2026,
            academicEndYear: 2026,
            startDate: '2026-08-01',
            endDate: '2026-12-15',
            schemeId: scheme.id
        });
        division = await Division.create({
            divisionCode: 'F',
            semesterId: semester.id
        });
        batch = await Batch.create({
            batchCode: '2026-F',
            divisionId: division.id
        });
    });

    describe('DELETE /api/v1/batches/:id', () => {
        test('should delete batch when exists', async () => {
            const res = await request(app).
            delete(`/api/v1/batches/${batch.id}`).
            set('Authorization', `Bearer ${adminToken}`).
            expect(httpStatus.OK);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Batch deleted successfully');

            const dbBatch = await Batch.findByPk(batch.id);
            expect(dbBatch).toBeNull();
        });

        test('should return 404 when batch not found', async () => {
            const fakeId = faker.string.uuid();
            const res = await request(app).
            delete(`/api/v1/batches/${fakeId}`).
            set('Authorization', `Bearer ${adminToken}`).
            expect(httpStatus.NOT_FOUND);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Batch not found');
        });

        test('should return 400 for invalid id', async () => {
            const res = await request(app).
            delete('/api/v1/batches/invalid-uuid').
            set('Authorization', `Bearer ${adminToken}`).
            expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Batch ID must be a valid UUID');
        });

        test('should return 401 when no token', async () => {
            const res = await request(app).
            delete(`/api/v1/batches/${batch.id}`).
            expect(httpStatus.UNAUTHORIZED);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Unauthorized');
        });

        test('should return 401 when token invalid', async () => {
            const res = await request(app).
            delete(`/api/v1/batches/${batch.id}`).
            set('Authorization', 'Bearer invalidtoken').
            expect(httpStatus.UNAUTHORIZED);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Unauthorized');
        });
    });
});
