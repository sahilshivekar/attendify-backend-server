import {
    jest
} from '@jest/globals';
import request from 'supertest';
import httpStatus from 'http-status';
import app from '../../../app.js';
import setupTestDb from '../../util/setupTestDb.js';
import Admin from '../../../db/models/admin.model.js';
import University from '../../../db/models/university.model.js';
import Scheme from '../../../db/models/scheme.model.js';

setupTestDb();

describe('Course Controller - addCourse', () => {
    let adminToken;
    let university;
    let scheme;

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
        scheme = await Scheme.create({
            name: 'CS 2026 Scheme',
            universityId: university.id
        });
    });

    const url = '/api/v1/courses';

    test('should require authentication', async () => {
        const res = await request(app).post(url).send({});
        expect(res.status).toBe(httpStatus.BAD_REQUEST);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('required');
    });

    test('should return 400 if required fields are missing', async () => {
        const res = await request(app).
        post(url).
        set('Authorization', `Bearer ${adminToken}`).
        send({});
        expect(res.status).toBe(httpStatus.BAD_REQUEST);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('required');
    });

    test('should return 400 if schemeId is not a valid UUID', async () => {
        const res = await request(app).
        post(url).
        set('Authorization', `Bearer ${adminToken}`).
        send({
            code: 'CS101',
            name: 'Programming Fundamentals',
            schemeId: 'not-a-uuid'
        });
        expect(res.status).toBe(httpStatus.BAD_REQUEST);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('valid UUID');
    });

    test('should return 404 if scheme does not exist', async () => {
        const fakeSchemeId = '550e8400-e29b-41d4-a716-446655440000';
        const res = await request(app).
        post(url).
        set('Authorization', `Bearer ${adminToken}`).
        send({
            code: 'CS101',
            name: 'Programming Fundamentals',
            schemeId: fakeSchemeId
        });
        expect(res.status).toBe(httpStatus.NOT_FOUND);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('Scheme not found');
    });

    test('should add course successfully', async () => {
        const res = await request(app).
        post(url).
        set('Authorization', `Bearer ${adminToken}`).
        send({
            code: 'CS101',
            name: 'Programming Fundamentals',
            schemeId: scheme.id
        });
        expect(res.status).toBe(httpStatus.CREATED);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toContain('Course added successfully');
        expect(res.body.data.name).toBe('Programming Fundamentals');
        expect(res.body.data.code).toBe('CS101');
        expect(res.body.data.schemeId).toBe(scheme.id);
    });
});
