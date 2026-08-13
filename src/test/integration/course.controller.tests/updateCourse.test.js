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
import Course from '../../../db/models/course.model.js';

setupTestDb();

describe('Course Controller - updateCourse', () => {
    let adminToken;
    let university;
    let scheme;
    let course;

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
        course = await Course.create({
            name: 'Programming Fundamentals',
            code: 'CS101',
            schemeId: scheme.id
        });
    });

    const url = (id) => `/api/v1/courses/${id}`;

    test('should require authentication', async () => {
        const res = await request(app).put(url(course.id)).send({
            name: 'New Name'
        });
        expect(res.status).toBe(httpStatus.UNAUTHORIZED);
        expect(res.body.success).toBe(false);
    });

    test('should return 400 if id is not a valid UUID', async () => {
        const res = await request(app).
        put('/api/v1/courses/not-a-uuid').
        set('Authorization', `Bearer ${adminToken}`).
        send({
            name: 'New Name'
        });
        expect(res.status).toBe(httpStatus.BAD_REQUEST);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('valid UUID');
    });

    test('should return 404 if course does not exist', async () => {
        const fakeId = '550e8400-e29b-41d4-a716-446655440000';
        const res = await request(app).
        put(url(fakeId)).
        set('Authorization', `Bearer ${adminToken}`).
        send({
            name: 'New Name'
        });
        expect(res.status).toBe(httpStatus.NOT_FOUND);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('Course not found');
    });

    test('should update course successfully', async () => {
        const res = await request(app).
        put(url(course.id)).
        set('Authorization', `Bearer ${adminToken}`).
        send({
            name: 'Advanced Programming',
            code: 'CS999'
        });
        expect(res.status).toBe(httpStatus.OK);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toContain('Course updated successfully');
        expect(res.body.data.name).toBe('Advanced Programming');
        expect(res.body.data.code).toBe('CS999');
    });
});
