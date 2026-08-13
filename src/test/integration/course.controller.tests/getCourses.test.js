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
import Semester from '../../../db/models/semester.model.js';
import Course from '../../../db/models/course.model.js';
import BranchCourseSemester from '../../../db/models/branchCourseSemester.model.js';

setupTestDb();

describe('Course Controller - getCourses', () => {
    let adminToken;
    let university;
    let branch;
    let scheme;
    let semester;
    let coursePF;
    let courseDS;
    let branchCourseSemesterPF;
    let branchCourseSemesterDS;

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
        semester = await Semester.create({
            semesterNumber: 1,
            branchId: branch.id,
            academicStartYear: 2025,
            academicEndYear: 2026,
            startDate: '2025-08-01',
            endDate: '2025-12-31',
            schemeId: scheme.id
        });
        coursePF = await Course.create({
            name: 'Programming Fundamentals',
            code: 'CS101',
            schemeId: scheme.id
        });
        courseDS = await Course.create({
            name: 'Data Structures',
            code: 'CS201',
            schemeId: scheme.id
        });
        branchCourseSemesterPF = await BranchCourseSemester.create({
            branchId: branch.id,
            courseId: coursePF.id,
            semesterNumber: semester.semesterNumber
        });
        branchCourseSemesterDS = await BranchCourseSemester.create({
            branchId: branch.id,
            courseId: courseDS.id,
            semesterNumber: semester.semesterNumber
        });
    });

    const url = '/api/v1/courses';

    test('should require authentication', async () => {
        const res = await request(app).get(url);
        expect(res.status).toBe(httpStatus.UNAUTHORIZED);
        expect(res.body.success).toBe(false);
    });

    test('should return all courses with default pagination', async () => {
        const res = await request(app).
        get(url).
        set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(httpStatus.OK);
        expect(res.body.success).toBe(true);
        expect(res.body.data.courses.length).toBeGreaterThanOrEqual(2);
        expect(res.body.data.totalCount).toBeGreaterThanOrEqual(2);
    });

    test('should filter by searchQuery', async () => {
        const res = await request(app).
        get(url).
        set('Authorization', `Bearer ${adminToken}`).
        query({
            searchQuery: 'program'
        });
        expect(res.status).toBe(httpStatus.OK);
        expect(res.body.data.courses.length).toBe(1);
        expect(res.body.data.courses[0].name).toContain('Programming');
    });

    test('should filter by branchId', async () => {
        const res = await request(app).
        get(url).
        set('Authorization', `Bearer ${adminToken}`).
        query({
            branchId: branch.id
        });
        expect(res.status).toBe(httpStatus.OK);
        expect(res.body.data.courses.length).toBeGreaterThanOrEqual(2);
    });

    test('should filter by semesterNumber', async () => {
        const res = await request(app).
        get(url).
        set('Authorization', `Bearer ${adminToken}`).
        query({
            semesterNumber: semester.semesterNumber
        });
        expect(res.status).toBe(httpStatus.OK);
        expect(res.body.data.courses.length).toBeGreaterThanOrEqual(2);
    });

    test('should filter by schemeId', async () => {
        const res = await request(app).
        get(url).
        set('Authorization', `Bearer ${adminToken}`).
        query({
            schemeId: scheme.id
        });
        expect(res.status).toBe(httpStatus.OK);
        expect(res.body.data.courses.length).toBeGreaterThanOrEqual(2);
    });

    test('should support pagination', async () => {
        const res = await request(app).
        get(url).
        set('Authorization', `Bearer ${adminToken}`).
        query({
            page: 1,
            limit: 1
        });
        expect(res.status).toBe(httpStatus.OK);
        expect(res.body.data.courses.length).toBe(1);
        expect(res.body.data.totalCount).toBeGreaterThanOrEqual(2);
    });

    test('should return all courses when getAll=true', async () => {
        const res = await request(app).
        get(url).
        set('Authorization', `Bearer ${adminToken}`).
        query({
            getAll: true,
            limit: 1
        });
        expect(res.status).toBe(httpStatus.OK);
        expect(res.body.data.courses.length).toBeGreaterThanOrEqual(2);
    });

    test('should return 400 for invalid branchId', async () => {
        const res = await request(app).
        get(url).
        set('Authorization', `Bearer ${adminToken}`).
        query({
            branchId: 'not-a-uuid'
        });
        expect(res.status).toBe(httpStatus.BAD_REQUEST);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('valid UUID');
    });

    test('should return 400 for invalid schemeId', async () => {
        const res = await request(app).
        get(url).
        set('Authorization', `Bearer ${adminToken}`).
        query({
            schemeId: 'not-a-uuid'
        });
        expect(res.status).toBe(httpStatus.BAD_REQUEST);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('valid UUID');
    });

    test('should return 400 for invalid semesterNumber', async () => {
        const res = await request(app).
        get(url).
        set('Authorization', `Bearer ${adminToken}`).
        query({
            semesterNumber: 'not-a-number'
        });
        expect(res.status).toBe(httpStatus.BAD_REQUEST);
        expect(res.body.success).toBe(false);
    });

    test('should return 400 for invalid teacherIds', async () => {
        const res = await request(app).
        get(url).
        set('Authorization', `Bearer ${adminToken}`).
        query({
            teacherIds: 'not-a-uuid,also-not-uuid'
        });
        expect(res.status).toBe(httpStatus.BAD_REQUEST);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('valid UUID');
    });
});
