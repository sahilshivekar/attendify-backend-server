import request from 'supertest';
import app from '../../../app.js';
import setupTestDb from '../../util/setupTestDb.js';
import Student from '../../../db/models/student.model.js';
import University from '../../../db/models/university.model.js';
import Scheme from '../../../db/models/scheme.model.js';
import Branch from '../../../db/models/branch.model.js';
import VerificationCode from '../../../db/models/verificationCode.model.js';
import {
    faker
} from '@faker-js/faker';
import httpStatus from 'http-status';

setupTestDb();

describe('Student Auth API - sendVerificationCodeToEmail', () => {
    let testStudent;
    let testUniversity;
    let testScheme;
    let testBranch;

    beforeEach(async () => {

        testUniversity = await University.create({
            name: 'Test University',
            abbreviation: 'TU'
        });

        testScheme = await Scheme.create({
            name: 'Test Scheme',
            universityId: testUniversity.id
        });

        testBranch = await Branch.create({
            name: 'Computer Science',
            abbreviation: 'CS'
        });

        testStudent = await Student.create({
            prn: 'TU2025001',
            firstName: 'John',
            lastName: 'Doe',
            email: faker.internet.email().toLowerCase(),
            phoneNumber: '1234567890',
            password: 'TestPass123!',
            schemeId: testScheme.id,
            branchId: testBranch.id,
            admissionYear: 2025,
            admissionType: 'FE',
            gender: "Male"
        });
    });

    describe('POST /api/v1/auth/students/send-verification-code', () => {
        test('should send verification code successfully', async () => {
            const requestData = {
                email: testStudent.email
            };

            const res = await request(app).
            post('/api/v1/auth/students/send-verification-code').
            send(requestData).
            expect(httpStatus.OK);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe(`Verification code sent on ${testStudent.email}`);
            expect(res.body.data).toHaveProperty('expiresAt');
            expect(res.body.data.expiresAt).toEqual(expect.any(String));

            const verificationCodes = await VerificationCode.findAll({
                where: {
                    email: testStudent.email
                }
            });
            expect(verificationCodes.length).toBe(1);
            expect(verificationCodes[0].code).toMatch(/^\d{6}$/);
        });

        test('should handle email in uppercase', async () => {
            const requestData = {
                email: testStudent.email.toUpperCase()
            };

            const res = await request(app).
            post('/api/v1/auth/students/send-verification-code').
            send(requestData).
            expect(httpStatus.OK);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe(`Verification code sent on ${testStudent.email}`);
        });

        test('should return 404 when student does not exist', async () => {
            const requestData = {
                email: faker.internet.email().toLowerCase()
            };

            const res = await request(app).
            post('/api/v1/auth/students/send-verification-code').
            send(requestData).
            expect(httpStatus.NOT_FOUND);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Student with this email doesn\'t exists');
        });

        test('should return 400 when email is missing', async () => {
            const requestData = {};

            const res = await request(app).
            post('/api/v1/auth/students/send-verification-code').
            send(requestData).
            expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Email is required');
        });

        test('should return 400 when email is invalid', async () => {
            const requestData = {
                email: 'invalid-email'
            };

            const res = await request(app).
            post('/api/v1/auth/students/send-verification-code').
            send(requestData).
            expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Please provide a valid email address');
        });
    });
});
