import {
    jest
} from '@jest/globals';
import request from 'supertest';
import httpStatus from 'http-status';
import app from '../../../app.js';
import setupTestDb from '../../util/setupTestDb.js';
import Admin from '../../../db/models/admin.model.js';
import Student from '../../../db/models/student.model.js';
import Dropout from '../../../db/models/dropout.model.js';
import University from '../../../db/models/university.model.js';
import Branch from '../../../db/models/branch.model.js';
import Scheme from '../../../db/models/scheme.model.js';

setupTestDb();

describe('Dropout Controller - addStudentToDropout', () => {
    let adminToken;
    let university;
    let branch;
    let scheme;
    let student;

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

        student = await Student.create({
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'student@example.com',
            phoneNumber: '+919876543210',
            prn: 'STU001',
            password: 'Student@123',
            schemeId: scheme.id,
            branchId: branch.id,
            admissionYear: 2022,
            admissionType: 'FE',
            gender: 'Male'
        });
    });

    const url = '/api/v1/dropouts';

    test('should require authentication', async () => {
        const res = await request(app).
        post(url).
        send({
            studentId: student.id,
            academicStartYear: 2022,
            academicEndYear: 2023
        });
        expect(res.status).toBe(httpStatus.UNAUTHORIZED);
        expect(res.body.success).toBe(false);
    });

    test('should return 400 for missing studentId', async () => {
        const res = await request(app).
        post(url).
        set('Authorization', `Bearer ${adminToken}`).
        send({
            academicStartYear: 2022,
            academicEndYear: 2023
        });
        expect(res.status).toBe(httpStatus.BAD_REQUEST);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Student ID is required');
    });

    test('should return 400 for missing academicStartYear', async () => {
        const res = await request(app).
        post(url).
        set('Authorization', `Bearer ${adminToken}`).
        send({
            studentId: student.id,
            academicEndYear: 2023
        });
        expect(res.status).toBe(httpStatus.BAD_REQUEST);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Academic start year is required');
    });

    test('should return 400 for missing academicEndYear', async () => {
        const res = await request(app).
        post(url).
        set('Authorization', `Bearer ${adminToken}`).
        send({
            studentId: student.id,
            academicStartYear: 2022
        });
        expect(res.status).toBe(httpStatus.BAD_REQUEST);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Academic end year is required');
    });

    test('should return 400 for invalid studentId UUID', async () => {
        const res = await request(app).
        post(url).
        set('Authorization', `Bearer ${adminToken}`).
        send({
            studentId: 'not-a-uuid',
            academicStartYear: 2022,
            academicEndYear: 2023
        });
        expect(res.status).toBe(httpStatus.BAD_REQUEST);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Student ID must be a valid UUID');
    });

    test('should return 400 if academicStartYear < admissionYear', async () => {
        const res = await request(app).
        post(url).
        set('Authorization', `Bearer ${adminToken}`).
        send({
            studentId: student.id,
            academicStartYear: 2020,
            academicEndYear: 2023
        });
        expect(res.status).toBe(httpStatus.BAD_REQUEST);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('Academic start year cannot be before');
    });

    test('should return 409 if student already in dropout', async () => {
        await Dropout.create({
            studentId: student.id,
            academicStartYear: 2022,
            academicEndYear: 2023
        });
        const res = await request(app).
        post(url).
        set('Authorization', `Bearer ${adminToken}`).
        send({
            studentId: student.id,
            academicStartYear: 2022,
            academicEndYear: 2023
        });
        expect(res.status).toBe(httpStatus.CONFLICT);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('already in dropout');
    });

    test('should add student to dropout successfully', async () => {
        const res = await request(app).
        post(url).
        set('Authorization', `Bearer ${adminToken}`).
        send({
            studentId: student.id,
            academicStartYear: 2022,
            academicEndYear: 2023
        });
        expect(res.status).toBe(httpStatus.CREATED);
        expect(res.body.success).toBe(true);
        expect(res.body.data.studentId).toBe(student.id);
        expect(res.body.data.academicStartYear).toBe(2022);
        expect(res.body.data.academicEndYear).toBe(2023);
    });
});
