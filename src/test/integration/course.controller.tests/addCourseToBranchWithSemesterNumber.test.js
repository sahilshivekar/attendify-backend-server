import {
    jest
} from '@jest/globals';
import request from 'supertest';
import httpStatus from 'http-status';
import app from '../../../app.js';
import setupTestDb from '../../util/setupTestDb.js';
import Admin from '../../../db/models/admin.model.js';
import University from '../../../db/models/university.model.js';
import Branch from '../../../db/models/branch.model.js';
import Scheme from '../../../db/models/scheme.model.js';
import Course from '../../../db/models/course.model.js';
import BranchCourseSemester from '../../../db/models/branchCourseSemester.model.js';

setupTestDb();

describe('Course Controller - addCourseToBranchWithSemesterNumber', () => {
    let adminToken;
    let university;
    let branch;
    let scheme;
    let course;
    let semesterNumber;

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
        semesterNumber = 1;
    });

    const url = '/api/v1/courses/branch';

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

    test('should return 400 if courseId or branchId is not a valid UUID', async () => {
        const res = await request(app).
        post(url).
        set('Authorization', `Bearer ${adminToken}`).
        send({
            courseId: 'not-a-uuid',
            branchId: 'not-a-uuid',
            semesterNumber
        });
        expect(res.status).toBe(httpStatus.BAD_REQUEST);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('valid UUID');
    });

    test('should return 404 if course does not exist', async () => {
        const fakeCourseId = '550e8400-e29b-41d4-a716-446655440000';
        const res = await request(app).
        post(url).
        set('Authorization', `Bearer ${adminToken}`).
        send({
            courseId: fakeCourseId,
            branchId: branch.id,
            semesterNumber
        });
        expect(res.status).toBe(httpStatus.NOT_FOUND);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('Course not found');
    });

    test('should return 404 if branch does not exist', async () => {
        const fakeBranchId = '550e8400-e29b-41d4-a716-446655440000';
        const res = await request(app).
        post(url).
        set('Authorization', `Bearer ${adminToken}`).
        send({
            courseId: course.id,
            branchId: fakeBranchId,
            semesterNumber
        });
        expect(res.status).toBe(httpStatus.NOT_FOUND);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('Branch not found');
    });

    test('should add course to branch with semester number successfully', async () => {
        const res = await request(app).
        post(url).
        set('Authorization', `Bearer ${adminToken}`).
        send({
            courseId: course.id,
            branchId: branch.id,
            semesterNumber
        });
        expect(res.status).toBe(httpStatus.CREATED);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toContain('Course added successfully');
        expect(res.body.data.courseId).toBe(course.id);
        expect(res.body.data.branchId).toBe(branch.id);
        expect(res.body.data.semesterNumber).toBe(semesterNumber);
    });

    test('should allow duplicate entry (no unique constraint)', async () => {

        await request(app).
        post(url).
        set('Authorization', `Bearer ${adminToken}`).
        send({
            courseId: course.id,
            branchId: branch.id,
            semesterNumber
        });

        const res = await request(app).
        post(url).
        set('Authorization', `Bearer ${adminToken}`).
        send({
            courseId: course.id,
            branchId: branch.id,
            semesterNumber
        });
        expect(res.status).toBe(httpStatus.CREATED);
        expect(res.body.success).toBe(true);
        expect(res.body.data.courseId).toBe(course.id);
    });
});
