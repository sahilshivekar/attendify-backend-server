import {
    jest
} from '@jest/globals';
import request from 'supertest';
import app from '../../../app.js';
import setupTestDb from '../../../test/util/setupTestDb.js';
import Admin from '../../../db/models/admin.model.js';
import Course from '../../../db/models/course.model.js';
import Scheme from '../../../db/models/scheme.model.js';
import University from '../../../db/models/university.model.js';
import httpStatus from 'http-status';
import fs from 'fs';
import path from 'path';
import {
    fileURLToPath
} from 'url';
import {
    faker
} from '@faker-js/faker';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

setupTestDb();

describe('Course API - POST /api/v1/courses/bulk/csv', () => {
    let adminToken;
    let tempDir;
    let scheme;

    const createTempCSV = (content, filename = 'test_courses.csv') => {
        tempDir = path.join(__dirname, '..', '..', '..', '..', 'public', 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, {
                recursive: true
            });
        }
        const filePath = path.join(tempDir, filename);
        fs.writeFileSync(filePath, content);
        return filePath;
    };

    const cleanupTempFiles = () => {
        if (tempDir && fs.existsSync(tempDir)) {
            const files = fs.readdirSync(tempDir);
            files.forEach((file) => {
                if (file.startsWith('test_') && file.endsWith('.csv')) {
                    try {
                        fs.unlinkSync(path.join(tempDir, file));
                    } catch {}
                }
            });
        }
    };

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

            const uni = await University.create({
                name: 'Test Uni',
                abbreviation: 'TU'
            });
            scheme = await Scheme.create({
                name: 'Scheme 2026',
                universityId: uni.id
            });
        } catch (err) {
            console.error('beforeEach setup error:', err);
            throw err;
        }
    });

    afterEach(() => {
        cleanupTempFiles();
    });

    describe('Authentication', () => {
        test('401 when no token', async () => {
            const csv = `code,name,optionalCourse,schemeId\nCS101,Computer Basics,,${scheme.id}`;
            const filePath = createTempCSV(csv);
            const res = await request(app).post('/api/v1/courses/bulk/csv').attach('csvFile', filePath);
            expect(res.status).toBe(httpStatus.UNAUTHORIZED);
        });

        test('401 when invalid token', async () => {
            const csv = `code,name,optionalCourse,schemeId\nCS101,Computer Basics,,${scheme.id}`;
            const filePath = createTempCSV(csv);
            const res = await request(app).
            post('/api/v1/courses/bulk/csv').
            set('Authorization', 'Bearer invalidtoken').
            attach('csvFile', filePath);
            expect(res.status).toBe(httpStatus.UNAUTHORIZED);
        });
    });

    describe('File Validation', () => {
        test('400 when no file', async () => {
            const res = await request(app).
            post('/api/v1/courses/bulk/csv').
            set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('CSV file is required');
        });

        test('400 when CSV empty', async () => {
            const csv = `code,name,optionalCourse,schemeId`;
            const filePath = createTempCSV(csv, 'test_empty_courses.csv');
            const res = await request(app).
            post('/api/v1/courses/bulk/csv').
            set('Authorization', `Bearer ${adminToken}`).
            attach('csvFile', filePath);
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('CSV file is empty');
        });
    });

    describe('Row Validation', () => {
        test('400 when schemeId invalid UUID', async () => {
            const csv = `code,name,optionalCourse,schemeId\nCS101,Computer Basics,,not-a-uuid`;
            const filePath = createTempCSV(csv, 'test_invalid_schemeid_courses.csv');
            const res = await request(app).
            post('/api/v1/courses/bulk/csv').
            set('Authorization', `Bearer ${adminToken}`).
            attach('csvFile', filePath);
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Validation failed');
        });

        test('400 when code missing', async () => {
            const csv = `code,name,optionalCourse,schemeId\n,Computer Basics,,${scheme.id}`;
            const filePath = createTempCSV(csv, 'test_missing_code_courses.csv');
            const res = await request(app).
            post('/api/v1/courses/bulk/csv').
            set('Authorization', `Bearer ${adminToken}`).
            attach('csvFile', filePath);
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Validation failed');
        });
    });

    describe('Duplicates & Foreign Keys', () => {
        test('400 when duplicate codes in CSV', async () => {
            const csv = `code,name,optionalCourse,schemeId\nCS101,Computer Basics,,${scheme.id}\nCS101,Advanced CS,,${scheme.id}`;
            const filePath = createTempCSV(csv, 'test_dup_codes_courses.csv');
            const res = await request(app).
            post('/api/v1/courses/bulk/csv').
            set('Authorization', `Bearer ${adminToken}`).
            attach('csvFile', filePath);
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Duplicate course codes');
        });

        test('404 when scheme IDs do not exist', async () => {
            const fakeSchemeId = faker.string.uuid();
            const csv = `code,name,optionalCourse,schemeId\nCS101,Computer Basics,,${fakeSchemeId}`;
            const filePath = createTempCSV(csv, 'test_invalid_scheme_courses.csv');
            const res = await request(app).
            post('/api/v1/courses/bulk/csv').
            set('Authorization', `Bearer ${adminToken}`).
            attach('csvFile', filePath);
            expect(res.status).toBe(httpStatus.NOT_FOUND);
            expect(res.body.message).toContain('do not exist');
        });

        test('409 when code exists in DB', async () => {
            await Course.create({
                code: 'CS101',
                name: 'Existing',
                schemeId: scheme.id
            });
            const csv = `code,name,optionalCourse,schemeId\nCS101,Computer Basics,,${scheme.id}`;
            const filePath = createTempCSV(csv, 'test_existing_code_courses.csv');
            const res = await request(app).
            post('/api/v1/courses/bulk/csv').
            set('Authorization', `Bearer ${adminToken}`).
            attach('csvFile', filePath);
            expect(res.status).toBe(httpStatus.CONFLICT);
            expect(res.body.message).toContain('already exist');
        });
    });

    describe('Success & Rollback', () => {
        test('creates single course', async () => {
            const csv = `code,name,optionalCourse,schemeId\nCS101,Computer Basics,,${scheme.id}`;
            const filePath = createTempCSV(csv, 'test_single_courses.csv');
            const res = await request(app).
            post('/api/v1/courses/bulk/csv').
            set('Authorization', `Bearer ${adminToken}`).
            attach('csvFile', filePath);
            expect(res.status).toBe(httpStatus.CREATED);
            const c = await Course.findOne({
                where: {
                    code: 'CS101'
                }
            });
            expect(c).toBeTruthy();
        });

        test('creates multiple courses', async () => {
            const csv = `code,name,optionalCourse,schemeId\nCS101,Computer Basics,,${scheme.id}\nCS102,Advanced CS,,${scheme.id}`;
            const filePath = createTempCSV(csv, 'test_multiple_courses.csv');
            const res = await request(app).
            post('/api/v1/courses/bulk/csv').
            set('Authorization', `Bearer ${adminToken}`).
            attach('csvFile', filePath);
            expect(res.status).toBe(httpStatus.CREATED);
            const all = await Course.findAll();
            expect(all.length).toBe(2);
        });

        test('rollback if second row invalid schemeId', async () => {
            const fakeSchemeId = faker.string.uuid();
            const csv = `code,name,optionalCourse,schemeId\nCS101,Computer Basics,,${scheme.id}\nCS102,Advanced CS,,${fakeSchemeId}`;
            const filePath = createTempCSV(csv, 'test_rollback_courses.csv');
            const res = await request(app).
            post('/api/v1/courses/bulk/csv').
            set('Authorization', `Bearer ${adminToken}`).
            attach('csvFile', filePath);
            expect(res.status).toBe(httpStatus.NOT_FOUND);
            const all = await Course.findAll();
            expect(all.length).toBe(0);
        });
    });
});
