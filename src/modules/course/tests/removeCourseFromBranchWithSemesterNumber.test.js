import {
    jest
} from '@jest/globals';
import request from 'supertest';
import httpStatus from 'http-status';
import app from '../../../app.js';
import setupTestDb from '../../../test/util/setupTestDb.js';
import Admin from '../../../db/models/admin.model.js';
import University from '../../../db/models/university.model.js';
import Branch from '../../../db/models/branch.model.js';
import Scheme from '../../../db/models/scheme.model.js';
import Course from '../../../db/models/course.model.js';
import BranchCourseSemester from '../../../db/models/branchCourseSemester.model.js';

setupTestDb();

describe('Course Controller - removeCourseFromBranchWithSemesterNumber', () => {
    let adminToken;
    let university;
    let branch;
    let scheme;
    let course;
    let branchCourseSemester;

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
        course = await Course.create({
            name: 'Programming Fundamentals',
            code: 'CS101',
            schemeId: scheme.id
        });
        branchCourseSemester = await BranchCourseSemester.create({
            branchId: branch.id,
            courseId: course.id,
            semesterNumber: 1
        });
    });

    const url = (id) => `/api/v1/courses/branch/${id}`;

    test('should require authentication', async () => {
        const res = await request(app).delete(url(branchCourseSemester.id));
        expect(res.status).toBe(httpStatus.UNAUTHORIZED);
        expect(res.body.success).toBe(false);
    });

    test('should return 400 if id is not a valid UUID', async () => {
        const res = await request(app).
        delete('/api/v1/courses/branch/not-a-uuid').
        set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(httpStatus.BAD_REQUEST);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('valid UUID');
    });

    test('should return 404 if branchCourseSemester does not exist', async () => {
        const fakeId = '550e8400-e29b-41d4-a716-446655440000';
        const res = await request(app).
        delete(url(fakeId)).
        set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(httpStatus.NOT_FOUND);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('BranchCourseSemester not found');
    });

    test('should delete branchCourseSemester successfully', async () => {
        const res = await request(app).
        delete(url(branchCourseSemester.id)).
        set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(httpStatus.OK);

        const deleted = await BranchCourseSemester.findByPk(branchCourseSemester.id);
        expect(deleted).toBeNull();
    });
});
