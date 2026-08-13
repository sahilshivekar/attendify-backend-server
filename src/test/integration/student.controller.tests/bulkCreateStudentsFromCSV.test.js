import {
    jest
} from '@jest/globals';
import request from 'supertest';
import app from '../../../app.js';
import setupTestDb from '../../util/setupTestDb.js';
import Admin from '../../../db/models/admin.model.js';
import Student from '../../../db/models/student.model.js';
import University from '../../../db/models/university.model.js';
import Branch from '../../../db/models/branch.model.js';
import Scheme from '../../../db/models/scheme.model.js';
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

describe('Student API - POST /api/v1/students/bulk/csv', () => {
    let adminToken;
    let university;
    let branch;
    let scheme;
    let tempDir;

    const createTempCSV = (content, filename = 'test_students.csv') => {
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
                    } catch (e) {

                    }
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
        } catch (err) {
            console.error('beforeEach setup error:', err);
            throw err;
        }
    });

    afterEach(() => {
        cleanupTempFiles();
    });

    describe('Authentication Tests', () => {
        test('should return 401 when no token is provided', async () => {
            const csvContent = `prn,firstName,lastName,email,phoneNumber,gender,schemeId,admissionYear,admissionType,branchId
STU001,John,Doe,john@example.com,+919876543210,Male,${scheme.id},2025,FE,${branch.id}`;
            const filePath = createTempCSV(csvContent);

            const res = await request(app).
            post('/api/v1/students/bulk/csv').
            attach('csvFile', filePath);

            expect(res.status).toBe(httpStatus.UNAUTHORIZED);
        });

        test('should return 401 when invalid token is provided', async () => {
            const csvContent = `prn,firstName,lastName,email,phoneNumber,gender,schemeId,admissionYear,admissionType,branchId
STU001,John,Doe,john@example.com,+919876543210,Male,${scheme.id},2025,FE,${branch.id}`;
            const filePath = createTempCSV(csvContent);

            const res = await request(app).
            post('/api/v1/students/bulk/csv').
            set('Authorization', 'Bearer invalidtoken').
            attach('csvFile', filePath);

            expect(res.status).toBe(httpStatus.UNAUTHORIZED);
        });
    });

    describe('File Validation Tests', () => {
        test('should return 400 when no file is provided', async () => {
            const res = await request(app).
            post('/api/v1/students/bulk/csv').
            set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('CSV file is required');
        });

        test('should return 400 when CSV file is empty', async () => {
            const csvContent = `prn,firstName,lastName,email,phoneNumber,gender,schemeId,admissionYear,admissionType,branchId`;
            const filePath = createTempCSV(csvContent, 'test_empty.csv');

            const res = await request(app).
            post('/api/v1/students/bulk/csv').
            set('Authorization', `Bearer ${adminToken}`).
            attach('csvFile', filePath);

            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('CSV file is empty or contains no valid data');
        });
    });

    describe('CSV Row Validation Tests', () => {
        test('should return 400 when prn is missing in a row', async () => {
            const csvContent = `prn,firstName,lastName,email,phoneNumber,gender,schemeId,admissionYear,admissionType,branchId
,John,Doe,john@example.com,+919876543210,Male,${scheme.id},2025,FE,${branch.id}`;
            const filePath = createTempCSV(csvContent, 'test_missing_prn.csv');

            const res = await request(app).
            post('/api/v1/students/bulk/csv').
            set('Authorization', `Bearer ${adminToken}`).
            attach('csvFile', filePath);

            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Validation failed');
        });

        test('should return 400 when email is invalid in a row', async () => {
            const csvContent = `prn,firstName,lastName,email,phoneNumber,gender,schemeId,admissionYear,admissionType,branchId
STU001,John,Doe,invalid-email,+919876543210,Male,${scheme.id},2025,FE,${branch.id}`;
            const filePath = createTempCSV(csvContent, 'test_invalid_email.csv');

            const res = await request(app).
            post('/api/v1/students/bulk/csv').
            set('Authorization', `Bearer ${adminToken}`).
            attach('csvFile', filePath);

            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Validation failed');
        });

        test('should return 400 when gender is invalid', async () => {
            const csvContent = `prn,firstName,lastName,email,phoneNumber,gender,schemeId,admissionYear,admissionType,branchId
STU001,John,Doe,john@example.com,+919876543210,InvalidGender,${scheme.id},2025,FE,${branch.id}`;
            const filePath = createTempCSV(csvContent, 'test_invalid_gender.csv');

            const res = await request(app).
            post('/api/v1/students/bulk/csv').
            set('Authorization', `Bearer ${adminToken}`).
            attach('csvFile', filePath);

            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Validation failed');
        });

        test('should return 400 when admissionType is invalid', async () => {
            const csvContent = `prn,firstName,lastName,email,phoneNumber,gender,schemeId,admissionYear,admissionType,branchId
STU001,John,Doe,john@example.com,+919876543210,Male,${scheme.id},2025,INVALID,${branch.id}`;
            const filePath = createTempCSV(csvContent, 'test_invalid_admission_type.csv');

            const res = await request(app).
            post('/api/v1/students/bulk/csv').
            set('Authorization', `Bearer ${adminToken}`).
            attach('csvFile', filePath);

            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Validation failed');
        });

        test('should return 400 when schemeId is not a valid UUID', async () => {
            const csvContent = `prn,firstName,lastName,email,phoneNumber,gender,schemeId,admissionYear,admissionType,branchId
STU001,John,Doe,john@example.com,+919876543210,Male,invalid-uuid,2025,FE,${branch.id}`;
            const filePath = createTempCSV(csvContent, 'test_invalid_schemeid.csv');

            const res = await request(app).
            post('/api/v1/students/bulk/csv').
            set('Authorization', `Bearer ${adminToken}`).
            attach('csvFile', filePath);

            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Validation failed');
        });

        test('should return 400 when branchId is not a valid UUID', async () => {
            const csvContent = `prn,firstName,lastName,email,phoneNumber,gender,schemeId,admissionYear,admissionType,branchId
STU001,John,Doe,john@example.com,+919876543210,Male,${scheme.id},2025,FE,invalid-uuid`;
            const filePath = createTempCSV(csvContent, 'test_invalid_branchid.csv');

            const res = await request(app).
            post('/api/v1/students/bulk/csv').
            set('Authorization', `Bearer ${adminToken}`).
            attach('csvFile', filePath);

            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Validation failed');
        });
    });

    describe('Duplicate Detection Tests', () => {
        test('should return 400 when CSV contains duplicate emails', async () => {
            const csvContent = `prn,firstName,lastName,email,phoneNumber,gender,schemeId,admissionYear,admissionType,branchId
STU001,John,Doe,john@example.com,+919876543210,Male,${scheme.id},2025,FE,${branch.id}
STU002,Jane,Smith,john@example.com,+919876543211,Female,${scheme.id},2025,FE,${branch.id}`;
            const filePath = createTempCSV(csvContent, 'test_dup_emails.csv');

            const res = await request(app).
            post('/api/v1/students/bulk/csv').
            set('Authorization', `Bearer ${adminToken}`).
            attach('csvFile', filePath);

            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Duplicate emails found within CSV file');
        });

        test('should return 400 when CSV contains duplicate PRNs', async () => {
            const csvContent = `prn,firstName,lastName,email,phoneNumber,gender,schemeId,admissionYear,admissionType,branchId
STU001,John,Doe,john@example.com,+919876543210,Male,${scheme.id},2025,FE,${branch.id}
STU001,Jane,Smith,jane@example.com,+919876543211,Female,${scheme.id},2025,FE,${branch.id}`;
            const filePath = createTempCSV(csvContent, 'test_dup_prns.csv');

            const res = await request(app).
            post('/api/v1/students/bulk/csv').
            set('Authorization', `Bearer ${adminToken}`).
            attach('csvFile', filePath);

            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Duplicate PRNs found within CSV file');
        });

        test('should return 400 when email already exists in database', async () => {

            await Student.create({
                prn: 'EXISTING001',
                firstName: 'Existing',
                lastName: 'Student',
                email: 'existing@example.com',
                phoneNumber: '+919876543200',
                gender: 'Male',
                schemeId: scheme.id,
                admissionYear: 2025,
                admissionType: 'FE',
                branchId: branch.id
            });

            const csvContent = `prn,firstName,lastName,email,phoneNumber,gender,schemeId,admissionYear,admissionType,branchId
STU001,John,Doe,existing@example.com,+919876543210,Male,${scheme.id},2025,FE,${branch.id}`;
            const filePath = createTempCSV(csvContent, 'test_existing_email.csv');

            const res = await request(app).
            post('/api/v1/students/bulk/csv').
            set('Authorization', `Bearer ${adminToken}`).
            attach('csvFile', filePath);

            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('already exist in the database');
        });

        test('should return 400 when PRN already exists in database', async () => {

            await Student.create({
                prn: 'EXISTING001',
                firstName: 'Existing',
                lastName: 'Student',
                email: 'existing@example.com',
                phoneNumber: '+919876543200',
                gender: 'Male',
                schemeId: scheme.id,
                admissionYear: 2025,
                admissionType: 'FE',
                branchId: branch.id
            });

            const csvContent = `prn,firstName,lastName,email,phoneNumber,gender,schemeId,admissionYear,admissionType,branchId
EXISTING001,John,Doe,john@example.com,+919876543210,Male,${scheme.id},2025,FE,${branch.id}`;
            const filePath = createTempCSV(csvContent, 'test_existing_prn.csv');

            const res = await request(app).
            post('/api/v1/students/bulk/csv').
            set('Authorization', `Bearer ${adminToken}`).
            attach('csvFile', filePath);

            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('already exist in the database');
        });

        test('should return 400 when phone number already exists in database', async () => {

            await Student.create({
                prn: 'EXISTING001',
                firstName: 'Existing',
                lastName: 'Student',
                email: 'existing@example.com',
                phoneNumber: '+919876543200',
                gender: 'Male',
                schemeId: scheme.id,
                admissionYear: 2025,
                admissionType: 'FE',
                branchId: branch.id
            });

            const csvContent = `prn,firstName,lastName,email,phoneNumber,gender,schemeId,admissionYear,admissionType,branchId
STU001,John,Doe,john@example.com,+919876543200,Male,${scheme.id},2025,FE,${branch.id}`;
            const filePath = createTempCSV(csvContent, 'test_existing_phone.csv');

            const res = await request(app).
            post('/api/v1/students/bulk/csv').
            set('Authorization', `Bearer ${adminToken}`).
            attach('csvFile', filePath);

            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('already exist in the database');
        });
    });

    describe('Foreign Key Validation Tests', () => {
        test('should return 404 when scheme does not exist', async () => {
            const fakeSchemeId = faker.string.uuid();
            const csvContent = `prn,firstName,lastName,email,phoneNumber,gender,schemeId,admissionYear,admissionType,branchId
STU001,John,Doe,john@example.com,+919876543210,Male,${fakeSchemeId},2025,FE,${branch.id}`;
            const filePath = createTempCSV(csvContent, 'test_invalid_scheme.csv');

            const res = await request(app).
            post('/api/v1/students/bulk/csv').
            set('Authorization', `Bearer ${adminToken}`).
            attach('csvFile', filePath);

            expect(res.status).toBe(httpStatus.NOT_FOUND);
            expect(res.body.message).toContain('scheme IDs do not exist');
        });

        test('should return 404 when branch does not exist', async () => {
            const fakeBranchId = faker.string.uuid();
            const csvContent = `prn,firstName,lastName,email,phoneNumber,gender,schemeId,admissionYear,admissionType,branchId
STU001,John,Doe,john@example.com,+919876543210,Male,${scheme.id},2025,FE,${fakeBranchId}`;
            const filePath = createTempCSV(csvContent, 'test_invalid_branch.csv');

            const res = await request(app).
            post('/api/v1/students/bulk/csv').
            set('Authorization', `Bearer ${adminToken}`).
            attach('csvFile', filePath);

            expect(res.status).toBe(httpStatus.NOT_FOUND);
            expect(res.body.message).toContain('branch IDs do not exist');
        });
    });

    describe('Success Tests', () => {
        test('should successfully create a single student from CSV', async () => {
            const csvContent = `prn,firstName,lastName,email,phoneNumber,gender,schemeId,admissionYear,admissionType,branchId
STU001,John,Doe,john@example.com,+919876543210,Male,${scheme.id},2025,FE,${branch.id}`;
            const filePath = createTempCSV(csvContent, 'test_single_success.csv');

            const res = await request(app).
            post('/api/v1/students/bulk/csv').
            set('Authorization', `Bearer ${adminToken}`).
            attach('csvFile', filePath);

            expect(res.status).toBe(httpStatus.CREATED);
            expect(res.body.message).toContain('Successfully created 1 students from CSV');
            expect(res.body.data.createdCount).toBe(1);
            expect(res.body.data.students).toHaveLength(1);
            expect(res.body.data.students[0].prn).toBe('STU001');
            expect(res.body.data.students[0].firstName).toBe('John');
            expect(res.body.data.students[0].email).toBe('john@example.com');

            const student = await Student.findOne({
                where: {
                    prn: 'STU001'
                }
            });
            expect(student).toBeTruthy();
            expect(student.firstName).toBe('John');
            expect(student.email).toBe('john@example.com');
        });

        test('should successfully create multiple students from CSV', async () => {
            const csvContent = `prn,firstName,lastName,email,phoneNumber,gender,schemeId,admissionYear,admissionType,branchId
STU001,John,Doe,john@example.com,+919876543210,Male,${scheme.id},2025,FE,${branch.id}
STU002,Jane,Smith,jane@example.com,+919876543211,Female,${scheme.id},2025,DSE,${branch.id}
STU003,Bob,Wilson,bob@example.com,+919876543212,Male,${scheme.id},2023,FE,${branch.id}`;
            const filePath = createTempCSV(csvContent, 'test_multiple_success.csv');

            const res = await request(app).
            post('/api/v1/students/bulk/csv').
            set('Authorization', `Bearer ${adminToken}`).
            attach('csvFile', filePath);

            expect(res.status).toBe(httpStatus.CREATED);
            expect(res.body.message).toContain('Successfully created 3 students from CSV');
            expect(res.body.data.createdCount).toBe(3);
            expect(res.body.data.students).toHaveLength(3);

            const students = await Student.findAll();
            expect(students).toHaveLength(3);
        });

        test('should successfully create students with optional fields', async () => {
            const csvContent = `prn,firstName,middleName,lastName,email,phoneNumber,gender,dob,schemeId,admissionYear,admissionType,branchId,parentEmail
STU001,John,Michael,Doe,john@example.com,+919876543210,Male,1999/01/15,${scheme.id},2025,FE,${branch.id},parent@example.com`;
            const filePath = createTempCSV(csvContent, 'test_optional_fields.csv');

            const res = await request(app).
            post('/api/v1/students/bulk/csv').
            set('Authorization', `Bearer ${adminToken}`).
            attach('csvFile', filePath);

            expect(res.status).toBe(httpStatus.CREATED);
            expect(res.body.data.createdCount).toBe(1);

            const student = await Student.findOne({
                where: {
                    prn: 'STU001'
                }
            });
            expect(student).toBeTruthy();
            expect(student.middleName).toBe('Michael');
            expect(student.parentEmail).toBe('parent@example.com');
            expect(student.dob).toBeTruthy();
        });

        test('should normalize email to lowercase', async () => {
            const csvContent = `prn,firstName,lastName,email,phoneNumber,gender,schemeId,admissionYear,admissionType,branchId
STU001,John,Doe,JOHN@EXAMPLE.COM,+919876543210,Male,${scheme.id},2025,FE,${branch.id}`;
            const filePath = createTempCSV(csvContent, 'test_email_normalize.csv');

            const res = await request(app).
            post('/api/v1/students/bulk/csv').
            set('Authorization', `Bearer ${adminToken}`).
            attach('csvFile', filePath);

            expect(res.status).toBe(httpStatus.CREATED);

            const student = await Student.findOne({
                where: {
                    prn: 'STU001'
                }
            });
            expect(student.email).toBe('john@example.com');
        });

        test('should handle different gender values correctly', async () => {
            const csvContent = `prn,firstName,lastName,email,phoneNumber,gender,schemeId,admissionYear,admissionType,branchId
STU001,John,Doe,john@example.com,+919876543210,Male,${scheme.id},2025,FE,${branch.id}
STU002,Jane,Smith,jane@example.com,+919876543211,Female,${scheme.id},2025,FE,${branch.id}
STU003,Alex,Other,alex@example.com,+919876543212,Other,${scheme.id},2025,FE,${branch.id}`;
            const filePath = createTempCSV(csvContent, 'test_genders.csv');

            const res = await request(app).
            post('/api/v1/students/bulk/csv').
            set('Authorization', `Bearer ${adminToken}`).
            attach('csvFile', filePath);

            expect(res.status).toBe(httpStatus.CREATED);
            expect(res.body.data.createdCount).toBe(3);

            const students = await Student.findAll({
                order: [
                    ['prn', 'ASC']
                ]
            });
            expect(students[0].gender).toBe('Male');
            expect(students[1].gender).toBe('Female');
            expect(students[2].gender).toBe('Other');
        });

        test('should set default password for all students', async () => {
            const csvContent = `prn,firstName,lastName,email,phoneNumber,gender,schemeId,admissionYear,admissionType,branchId
STU001,John,Doe,john@example.com,+919876543210,Male,${scheme.id},2025,FE,${branch.id}`;
            const filePath = createTempCSV(csvContent, 'test_default_password.csv');

            const res = await request(app).
            post('/api/v1/students/bulk/csv').
            set('Authorization', `Bearer ${adminToken}`).
            attach('csvFile', filePath);

            expect(res.status).toBe(httpStatus.CREATED);

            const student = await Student.findOne({
                where: {
                    prn: 'STU001'
                }
            });
            expect(student).toBeTruthy();
            expect(student.password).toBeTruthy();
            expect(student.password).not.toBe('Student@123');
        });
    });

    describe('Transaction Rollback Tests', () => {
        test('should rollback all changes if validation fails for any row', async () => {

            const csvContent = `prn,firstName,lastName,email,phoneNumber,gender,schemeId,admissionYear,admissionType,branchId
STU001,John,Doe,john@example.com,+919876543210,Male,${scheme.id},2025,FE,${branch.id}
STU002,Jane,Smith,jane@example.com,+919876543211,Female,${scheme.id},2025,FE,${branch.id}
STU003,Bob,Wilson,invalid-email,+919876543212,Male,${scheme.id},2025,FE,${branch.id}`;
            const filePath = createTempCSV(csvContent, 'test_partial_invalid.csv');

            const res = await request(app).
            post('/api/v1/students/bulk/csv').
            set('Authorization', `Bearer ${adminToken}`).
            attach('csvFile', filePath);

            expect(res.status).toBe(httpStatus.BAD_REQUEST);

            const students = await Student.findAll();
            expect(students).toHaveLength(0);
        });

        test('should rollback if foreign key constraint fails', async () => {
            const fakeSchemeId = faker.string.uuid();

            const csvContent = `prn,firstName,lastName,email,phoneNumber,gender,schemeId,admissionYear,admissionType,branchId
STU001,John,Doe,john@example.com,+919876543210,Male,${scheme.id},2025,FE,${branch.id}
STU002,Jane,Smith,jane@example.com,+919876543211,Female,${fakeSchemeId},2025,FE,${branch.id}`;
            const filePath = createTempCSV(csvContent, 'test_fk_rollback.csv');

            const res = await request(app).
            post('/api/v1/students/bulk/csv').
            set('Authorization', `Bearer ${adminToken}`).
            attach('csvFile', filePath);

            expect(res.status).toBe(httpStatus.NOT_FOUND);

            const students = await Student.findAll();
            expect(students).toHaveLength(0);
        });
    });

    describe('File Cleanup Tests', () => {
        test('should clean up temp file after successful upload', async () => {
            const csvContent = `prn,firstName,lastName,email,phoneNumber,gender,schemeId,admissionYear,admissionType,branchId
STU001,John,Doe,john@example.com,+919876543210,Male,${scheme.id},2025,FE,${branch.id}`;
            const filePath = createTempCSV(csvContent, 'test_cleanup_success.csv');

            expect(fs.existsSync(filePath)).toBe(true);

            await request(app).
            post('/api/v1/students/bulk/csv').
            set('Authorization', `Bearer ${adminToken}`).
            attach('csvFile', filePath);

        });

        test('should clean up temp file after validation error', async () => {
            const csvContent = `prn,firstName,lastName,email,phoneNumber,gender,schemeId,admissionYear,admissionType,branchId
,John,Doe,john@example.com,+919876543210,Male,${scheme.id},2025,FE,${branch.id}`;
            const filePath = createTempCSV(csvContent, 'test_cleanup_error.csv');

            await request(app).
            post('/api/v1/students/bulk/csv').
            set('Authorization', `Bearer ${adminToken}`).
            attach('csvFile', filePath);

        });
    });
});
