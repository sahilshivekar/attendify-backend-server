import request from 'supertest';
import httpStatus from 'http-status';
import app from '../../../app.js';
import setupTestDb from '../../../test/util/setupTestDb.js';

import Admin from '../../../db/models/admin.model.js';
import Teacher from '../../../db/models/teacher.model.js';
import Student from '../../../db/models/student.model.js';
import University from '../../../db/models/university.model.js';
import Branch from '../../../db/models/branch.model.js';
import Scheme from '../../../db/models/scheme.model.js';
import Course from '../../../db/models/course.model.js';
import BranchCourseSemester from '../../../db/models/branchCourseSemester.model.js';
import Semester from '../../../db/models/semester.model.js';
import SemesterCourse from '../../../db/models/semesterCourse.model.js';

setupTestDb();

describe('Semester API - GET /api/v1/semesters/courses', () => {
    let adminToken;
    let teacherToken;
    let studentToken;
    let university;
    let branch;
    let scheme;
    let semester;
    let comp1, comp2, opt1, opt2;

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

            await Teacher.create({
                firstName: 'John',
                lastName: 'Doe',
                email: 'teacher@example.com',
                phoneNumber: '+911234567890',
                password: 'Teacher@123',
                gender: 'Male',
                role: 'Teacher'
            });
            const teacherLoginRes = await request(app).
            post('/api/v1/auth/teachers/login').
            send({
                email: 'teacher@example.com',
                password: 'Teacher@123'
            });
            teacherToken = teacherLoginRes.body.data.accessToken;

            university = await University.create({
                name: 'Test University',
                abbreviation: 'TU'
            });
            branch = await Branch.create({
                name: 'Computer Science',
                abbreviation: 'CS'
            });
            scheme = await Scheme.create({
                name: 'CS 2026',
                universityId: university.id
            });

            await Student.create({
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'student1@example.com',
                phoneNumber: '+919876543210',
                prn: 'STU001',
                password: 'Student@123',
                schemeId: scheme.id,
                branchId: branch.id,
                admissionYear: 2025,
                admissionType: 'FE',
                gender: 'Male'
            });
            const studentLoginRes = await request(app).
            post('/api/v1/auth/students/login').
            send({
                emailOrPRN: 'student1@example.com',
                password: 'Student@123'
            });
            studentToken = studentLoginRes.body.data.accessToken;

            comp1 = await Course.create({
                schemeId: scheme.id,
                code: 'C-COMP-1',
                name: 'Compulsory 1',
                optionalCourse: null
            });
            comp2 = await Course.create({
                schemeId: scheme.id,
                code: 'C-COMP-2',
                name: 'Compulsory 2',
                optionalCourse: null
            });
            opt1 = await Course.create({
                schemeId: scheme.id,
                code: 'C-OPT-1',
                name: 'Optional 1',
                optionalCourse: 'OS1'
            });
            opt2 = await Course.create({
                schemeId: scheme.id,
                code: 'C-OPT-2',
                name: 'Optional 2',
                optionalCourse: 'OS2'
            });

            const semesterNumber = 6;
            await BranchCourseSemester.create({
                branchId: branch.id,
                courseId: comp1.id,
                semesterNumber
            });
            await BranchCourseSemester.create({
                branchId: branch.id,
                courseId: comp2.id,
                semesterNumber
            });

            await BranchCourseSemester.create({
                branchId: branch.id,
                courseId: opt1.id,
                semesterNumber
            });
            await BranchCourseSemester.create({
                branchId: branch.id,
                courseId: opt2.id,
                semesterNumber
            });

            semester = await Semester.create({
                branchId: branch.id,
                schemeId: scheme.id,
                semesterNumber,
                academicStartYear: 2026,
                academicEndYear: 2026,
                startDate: '2026-01-01',
                endDate: '2026-06-01'
            });
            await SemesterCourse.create({
                semesterId: semester.id,
                courseId: opt1.id
            });
            await SemesterCourse.create({
                semesterId: semester.id,
                courseId: opt2.id
            });
        } catch (err) {

            console.error('beforeEach setup error:', err);
            throw err;
        }
    });

    test('should return 401 when no token is provided', async () => {
        const res = await request(app).
        get('/api/v1/semesters/courses').
        query({
            semesterId: semester.id
        });
        expect(res.status).toBe(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 when invalid token is provided', async () => {
        const res = await request(app).
        get('/api/v1/semesters/courses').
        set('Authorization', 'Bearer invalidtoken').
        query({
            semesterId: semester.id
        });
        expect(res.status).toBe(httpStatus.UNAUTHORIZED);
    });

    test('should return 400 when semesterId is not a UUID', async () => {
        const res = await request(app).
        get('/api/v1/semesters/courses').
        set('Authorization', `Bearer ${adminToken}`).
        query({
            semesterId: 'not-a-uuid'
        });
        expect(res.status).toBe(httpStatus.BAD_REQUEST);
        expect(res.body.message).toContain('Semester ID must be a valid UUID');
    });

    test('should return 404 when semester not found', async () => {
        const nonExistId = '8e9efb3e-0a92-4e4f-9a9b-6f0f7b0b1234';
        const res = await request(app).
        get('/api/v1/semesters/courses').
        set('Authorization', `Bearer ${adminToken}`).
        query({
            semesterId: nonExistId
        });
        expect(res.status).toBe(httpStatus.NOT_FOUND);
        expect(res.body.message).toBe('Semester not found');
    });

    test('should return courses for Admin (compulsory + optional)', async () => {
        const res = await request(app).
        get('/api/v1/semesters/courses').
        set('Authorization', `Bearer ${adminToken}`).
        query({
            semesterId: semester.id
        });
        expect(res.status).toBe(httpStatus.OK);
        expect(res.body.success).toBe(true);

        expect(res.body.data).toHaveProperty('compulsoryCourses');
        expect(res.body.data).toHaveProperty('optionalCourses');
        expect(Array.isArray(res.body.data.compulsoryCourses)).toBe(true);
        expect(Array.isArray(res.body.data.optionalCourses)).toBe(true);
        expect(res.body.data.compulsoryCourses.length).toBe(2);
        expect(res.body.data.optionalCourses.length).toBe(2);
    });

    test('should return courses for Teacher', async () => {
        const res = await request(app).
        get('/api/v1/semesters/courses').
        set('Authorization', `Bearer ${teacherToken}`).
        query({
            semesterId: semester.id
        });
        expect(res.status).toBe(httpStatus.OK);
        expect(res.body.success).toBe(true);
    });

    test('should return courses for Student', async () => {
        const res = await request(app).
        get('/api/v1/semesters/courses').
        set('Authorization', `Bearer ${studentToken}`).
        query({
            semesterId: semester.id
        });
        expect(res.status).toBe(httpStatus.OK);
        expect(res.body.success).toBe(true);
    });
});
