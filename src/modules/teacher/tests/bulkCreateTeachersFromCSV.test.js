import {
    jest
} from '@jest/globals';
import request from 'supertest';
import app from '../../../app.js';
import setupTestDb from '../../../test/util/setupTestDb.js';
import Admin from '../../../db/models/admin.model.js';
import Teacher from '../../../db/models/teacher.model.js';
import httpStatus from 'http-status';
import fs from 'fs';
import path from 'path';
import {
    fileURLToPath
} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

setupTestDb();

describe('Teacher API - POST /api/v1/teachers/bulk/csv', () => {
    let adminToken;
    let tempDir;

    const createTempCSV = (content, filename = 'test_teachers.csv') => {
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
            const csv = `firstName,lastName,email,phoneNumber,gender,role\nJohn,Doe,john@example.com,+919876543210,Male,Teacher`;
            const filePath = createTempCSV(csv);
            const res = await request(app).post('/api/v1/teachers/bulk/csv').attach('csvFile', filePath);
            expect(res.status).toBe(httpStatus.UNAUTHORIZED);
        });

        test('401 when invalid token', async () => {
            const csv = `firstName,lastName,email,phoneNumber,gender,role\nJohn,Doe,john@example.com,+919876543210,Male,Teacher`;
            const filePath = createTempCSV(csv);
            const res = await request(app).
            post('/api/v1/teachers/bulk/csv').
            set('Authorization', 'Bearer invalidtoken').
            attach('csvFile', filePath);
            expect(res.status).toBe(httpStatus.UNAUTHORIZED);
        });
    });

    describe('File Validation', () => {
        test('400 when no file', async () => {
            const res = await request(app).
            post('/api/v1/teachers/bulk/csv').
            set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('CSV file is required');
        });

        test('400 when CSV empty', async () => {
            const csv = `firstName,lastName,email,phoneNumber,gender,role`;
            const filePath = createTempCSV(csv, 'test_empty_teacher.csv');
            const res = await request(app).
            post('/api/v1/teachers/bulk/csv').
            set('Authorization', `Bearer ${adminToken}`).
            attach('csvFile', filePath);
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('CSV file is empty');
        });
    });

    describe('Row Validation', () => {
        test('400 when email invalid', async () => {
            const csv = `firstName,lastName,email,phoneNumber,gender,role\nJohn,Doe,invalid,+919876543210,Male,Teacher`;
            const filePath = createTempCSV(csv, 'test_invalid_email_teacher.csv');
            const res = await request(app).
            post('/api/v1/teachers/bulk/csv').
            set('Authorization', `Bearer ${adminToken}`).
            attach('csvFile', filePath);
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Validation failed');
        });

        test('400 when gender invalid', async () => {
            const csv = `firstName,lastName,email,phoneNumber,gender,role\nJohn,Doe,john@example.com,+919876543210,Invalid,Teacher`;
            const filePath = createTempCSV(csv, 'test_invalid_gender_teacher.csv');
            const res = await request(app).
            post('/api/v1/teachers/bulk/csv').
            set('Authorization', `Bearer ${adminToken}`).
            attach('csvFile', filePath);
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Validation failed');
        });

        test('400 when role invalid', async () => {
            const csv = `firstName,lastName,email,phoneNumber,gender,role\nJohn,Doe,john@example.com,+919876543210,Male,InvalidRole`;
            const filePath = createTempCSV(csv, 'test_invalid_role_teacher.csv');
            const res = await request(app).
            post('/api/v1/teachers/bulk/csv').
            set('Authorization', `Bearer ${adminToken}`).
            attach('csvFile', filePath);
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Validation failed');
        });
    });

    describe('Duplicates', () => {
        test('400 when duplicate emails in CSV', async () => {
            const csv = `firstName,lastName,email,phoneNumber,gender,role\nJohn,Doe,john@example.com,+919876543210,Male,Teacher\nJane,Smith,john@example.com,+919876543211,Female,Teacher`;
            const filePath = createTempCSV(csv, 'test_dup_emails_teacher.csv');
            const res = await request(app).
            post('/api/v1/teachers/bulk/csv').
            set('Authorization', `Bearer ${adminToken}`).
            attach('csvFile', filePath);
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Duplicate emails');
        });

        test('400 when duplicate phones in CSV', async () => {
            const csv = `firstName,lastName,email,phoneNumber,gender,role\nJohn,Doe,john@example.com,+919876543210,Male,Teacher\nJane,Smith,jane@example.com,+919876543210,Female,Teacher`;
            const filePath = createTempCSV(csv, 'test_dup_phones_teacher.csv');
            const res = await request(app).
            post('/api/v1/teachers/bulk/csv').
            set('Authorization', `Bearer ${adminToken}`).
            attach('csvFile', filePath);
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Duplicate phone numbers');
        });

        test('400 when email exists in DB', async () => {
            await Teacher.create({
                firstName: 'Existing',
                lastName: 'Teacher',
                email: 'existing@example.com',
                phoneNumber: '+919876543200',
                gender: 'Male',
                role: 'Teacher'
            });
            const csv = `firstName,lastName,email,phoneNumber,gender,role\nJohn,Doe,existing@example.com,+919876543210,Male,Teacher`;
            const filePath = createTempCSV(csv, 'test_existing_email_teacher.csv');
            const res = await request(app).
            post('/api/v1/teachers/bulk/csv').
            set('Authorization', `Bearer ${adminToken}`).
            attach('csvFile', filePath);
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('already exist in the database');
        });

        test('400 when phone exists in DB', async () => {
            await Teacher.create({
                firstName: 'Existing',
                lastName: 'Teacher',
                email: 'existing2@example.com',
                phoneNumber: '+919876543200',
                gender: 'Male',
                role: 'Teacher'
            });
            const csv = `firstName,lastName,email,phoneNumber,gender,role\nJohn,Doe,john@example.com,+919876543200,Male,Teacher`;
            const filePath = createTempCSV(csv, 'test_existing_phone_teacher.csv');
            const res = await request(app).
            post('/api/v1/teachers/bulk/csv').
            set('Authorization', `Bearer ${adminToken}`).
            attach('csvFile', filePath);
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('already exist in the database');
        });
    });

    describe('Success & Rollback', () => {
        test('creates single teacher', async () => {
            const csv = `firstName,lastName,email,phoneNumber,gender,role\nJohn,Doe,john@example.com,+919876543210,Male,Teacher`;
            const filePath = createTempCSV(csv, 'test_single_teacher.csv');
            const res = await request(app).
            post('/api/v1/teachers/bulk/csv').
            set('Authorization', `Bearer ${adminToken}`).
            attach('csvFile', filePath);
            expect(res.status).toBe(httpStatus.CREATED);
            expect(res.body.data.createdCount).toBe(1);
            const t = await Teacher.findOne({
                where: {
                    email: 'john@example.com'
                }
            });
            expect(t).toBeTruthy();
        });

        test('creates multiple teachers', async () => {
            const csv = `firstName,lastName,email,phoneNumber,gender,role\nJohn,Doe,john@example.com,+919876543210,Male,Teacher\nJane,Smith,jane@example.com,+919876543211,Female,Teacher`;
            const filePath = createTempCSV(csv, 'test_multiple_teacher.csv');
            const res = await request(app).
            post('/api/v1/teachers/bulk/csv').
            set('Authorization', `Bearer ${adminToken}`).
            attach('csvFile', filePath);
            expect(res.status).toBe(httpStatus.CREATED);
            const all = await Teacher.findAll();
            expect(all.length).toBe(2);
        });

        test('rollback if any row invalid', async () => {
            const csv = `firstName,lastName,email,phoneNumber,gender,role\nJohn,Doe,john@example.com,+919876543210,Male,Teacher\nJane,Smith,invalid,+919876543211,Female,Teacher`;
            const filePath = createTempCSV(csv, 'test_rollback_teacher.csv');
            const res = await request(app).
            post('/api/v1/teachers/bulk/csv').
            set('Authorization', `Bearer ${adminToken}`).
            attach('csvFile', filePath);
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            const all = await Teacher.findAll();
            expect(all.length).toBe(0);
        });
    });
});
