import request from 'supertest';
import app from '../../../app.js';
import setupTestDb from '../../../test/util/setupTestDb.js';
import Student from '../../../db/models/student.model.js';
import University from '../../../db/models/university.model.js';
import Scheme from '../../../db/models/scheme.model.js';
import Branch from '../../../db/models/branch.model.js';
import {
    faker
} from '@faker-js/faker';
import httpStatus from 'http-status';

setupTestDb();

describe('Student Auth API - loginStudent', () => {
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
            email: 'john.doe@test.com',
            phoneNumber: '1234567890',
            password: 'TestPass123!',
            schemeId: testScheme.id,
            branchId: testBranch.id,
            admissionYear: 2025,
            admissionType: 'FE',
            gender: "Male"
        });
    });

    describe('POST /api/v1/auth/students/login', () => {
        test('should login student successfully with email', async () => {
            const loginData = {
                emailOrPRN: testStudent.email,
                password: 'TestPass123!'
            };

            const res = await request(app).
            post('/api/v1/auth/students/login').
            send(loginData).
            expect(httpStatus.OK);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Login Successful');
            expect(res.body.data).toMatchObject({
                student: {
                    id: testStudent.id,
                    email: testStudent.email,
                    firstName: testStudent.firstName,
                    lastName: testStudent.lastName
                },
                accessToken: expect.any(String),
                refreshToken: expect.any(String)
            });
            expect(res.body.data.student).not.toHaveProperty('password');
            expect(res.body.data.student).not.toHaveProperty('refreshToken');

            expect(res.headers['set-cookie']).toBeDefined();
            expect(res.headers['set-cookie'].some((cookie) => cookie.includes('studentAccessToken'))).toBe(true);
            expect(res.headers['set-cookie'].some((cookie) => cookie.includes('studentRefreshToken'))).toBe(true);
        });

        test('should login student successfully with PRN', async () => {
            const loginData = {
                emailOrPRN: testStudent.prn,
                password: 'TestPass123!'
            };

            const res = await request(app).
            post('/api/v1/auth/students/login').
            send(loginData).
            expect(httpStatus.OK);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Login Successful');
            expect(res.body.data).toMatchObject({
                student: {
                    id: testStudent.id,
                    prn: testStudent.prn,
                    firstName: testStudent.firstName,
                    lastName: testStudent.lastName
                },
                accessToken: expect.any(String),
                refreshToken: expect.any(String)
            });
        });

        test('should return 404 when student not found with email', async () => {
            const loginData = {
                emailOrPRN: 'nonexistent@test.com',
                password: 'TestPass123!'
            };

            const res = await request(app).
            post('/api/v1/auth/students/login').
            send(loginData).
            expect(httpStatus.NOT_FOUND);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('No student found with entered credentials');
        });

        test('should return 404 when student not found with PRN', async () => {
            const loginData = {
                emailOrPRN: 'NONEXISTENT123',
                password: 'TestPass123!'
            };

            const res = await request(app).
            post('/api/v1/auth/students/login').
            send(loginData).
            expect(httpStatus.NOT_FOUND);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('No student found with entered credentials');
        });

        test('should return 401 when password is incorrect', async () => {
            const loginData = {
                emailOrPRN: testStudent.email,
                password: 'WrongPass123!'
            };

            const res = await request(app).
            post('/api/v1/auth/students/login').
            send(loginData).
            expect(httpStatus.UNAUTHORIZED);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Password didn\'t match');
        });

        test('should return 400 when emailOrPRN is missing', async () => {
            const loginData = {
                password: 'TestPass123!'
            };

            const res = await request(app).
            post('/api/v1/auth/students/login').
            send(loginData).
            expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Email or PRN is required');
        });

        test('should return 400 when password is missing', async () => {
            const loginData = {
                emailOrPRN: testStudent.email
            };

            const res = await request(app).
            post('/api/v1/auth/students/login').
            send(loginData).
            expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Password is required');
        });

    });
});
