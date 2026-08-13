import {
    jest
} from '@jest/globals';
import request from 'supertest';
import httpStatus from 'http-status';
import {
    v4 as uuidv4
} from 'uuid';
import app from '../../../app.js';
import setupTestDb from '../../util/setupTestDb.js';
import Admin from '../../../db/models/admin.model.js';
import Student from '../../../db/models/student.model.js';
import Dropout from '../../../db/models/dropout.model.js';
import University from '../../../db/models/university.model.js';
import Branch from '../../../db/models/branch.model.js';
import Scheme from '../../../db/models/scheme.model.js';

setupTestDb();

describe('Dropout Controller - getDropoutDetailsOfStudent', () => {
    let adminToken;
    let university;
    let branch;
    let scheme;
    let student;
    let dropout1;
    let dropout2;

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

        dropout1 = await Dropout.create({
            studentId: student.id,
            academicStartYear: 2022,
            academicEndYear: 2023
        });
        dropout2 = await Dropout.create({
            studentId: student.id,
            academicStartYear: 2023,
            academicEndYear: 2025
        });
    });

    const url = '/api/v1/dropouts/student';

    test('should require authentication', async () => {
        const res = await request(app).
        get(url).
        query({
            studentId: student.id
        });
        console.log('AUTH TEST RESPONSE:', res.body);
        expect(res.status).toBe(httpStatus.UNAUTHORIZED);
        expect(res.body.success).toBe(false);
    });

    test('should return 400 for missing studentId', async () => {
        const res = await request(app).
        get(url).
        set('Authorization', `Bearer ${adminToken}`);
        console.log('MISSING STUDENTID RESPONSE:', res.body);
        expect(res.status).toBe(httpStatus.BAD_REQUEST);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Student ID is required');
    });

    test('should return 400 for invalid studentId UUID', async () => {
        const res = await request(app).
        get(url).
        set('Authorization', `Bearer ${adminToken}`).
        query({
            studentId: 'not-a-uuid'
        });
        console.log('INVALID UUID RESPONSE:', res.body);
        expect(res.status).toBe(httpStatus.BAD_REQUEST);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Student ID must be a valid UUID');
    });

    test('should return 404 for valid but non-existent student', async () => {
        const randomId = uuidv4();
        const res = await request(app).
        get(url).
        set('Authorization', `Bearer ${adminToken}`).
        query({
            studentId: randomId
        });
        console.log('NON-EXISTENT STUDENT RESPONSE:', res.body);
        expect(res.status).toBe(httpStatus.NOT_FOUND);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('Student not found');
    });

    test('should get dropout details for student successfully', async () => {
        const res = await request(app).
        get(url).
        set('Authorization', `Bearer ${adminToken}`).
        query({
            studentId: student.id
        });
        console.log('SUCCESS RESPONSE:', res.body);
        expect(res.status).toBe(httpStatus.OK);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBe(2);
        expect(res.body.data[0].studentId).toBe(student.id);
        expect(res.body.data[1].studentId).toBe(student.id);
    });
});
