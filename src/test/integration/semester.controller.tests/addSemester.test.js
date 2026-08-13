import request from 'supertest';
import httpStatus from 'http-status';
import app from '../../../app.js';
import setupTestDb from '../../util/setupTestDb.js';

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

describe('Semester API - POST /api/v1/semesters', () => {
    let adminToken;
    let teacherToken;
    let studentToken;
    let university;
    let branch;
    let scheme;

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
        } catch (err) {

            console.error('beforeEach setup error:', err);
            throw err;
        }
    });

    const validPayload = () => ({
        branchId: branch.id,
        semesterNumber: 1,
        academicStartYear: 2026,
        academicEndYear: 2026,
        startDate: '2026-01-01',
        endDate: '2026-06-01',
        schemeId: scheme.id,
        optionalCourseIds: []
    });

    test('should return 401 when no token is provided with otherwise valid body', async () => {
        const res = await request(app).
        post('/api/v1/semesters').
        send(validPayload());
        expect(res.status).toBe(httpStatus.UNAUTHORIZED);
        expect(res.body.success).toBe(false);
    });

    test('should return 401 when invalid token is provided', async () => {
        const res = await request(app).
        post('/api/v1/semesters').
        set('Authorization', 'Bearer invalidtoken').
        send(validPayload());
        expect(res.status).toBe(httpStatus.UNAUTHORIZED);
        expect(res.body.success).toBe(false);
    });

    test('should return 403 for Teacher role', async () => {
        const res = await request(app).
        post('/api/v1/semesters').
        set('Authorization', `Bearer ${teacherToken}`).
        send(validPayload());
        expect(res.status).toBe(httpStatus.FORBIDDEN);
        expect(res.body.success).toBe(false);
    });

    test('should return 403 for Student role', async () => {
        const res = await request(app).
        post('/api/v1/semesters').
        set('Authorization', `Bearer ${studentToken}`).
        send(validPayload());
        expect(res.status).toBe(httpStatus.FORBIDDEN);
        expect(res.body.success).toBe(false);
    });

    describe('Validation errors', () => {
        test('should return 400 when branchId is missing', async () => {
            const {
                branchId,
                ...rest
            } = validPayload();
            const res = await request(app).
            post('/api/v1/semesters').
            set('Authorization', `Bearer ${adminToken}`).
            send(rest);
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Branch ID is required');
        });

        test('should return 400 when branchId is not a UUID', async () => {
            const payload = {
                ...validPayload(),
                branchId: 'not-a-uuid'
            };
            const res = await request(app).
            post('/api/v1/semesters').
            set('Authorization', `Bearer ${adminToken}`).
            send(payload);
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Branch ID must be a valid UUID');
        });

        test('should return 400 when semesterNumber is missing', async () => {
            const {
                semesterNumber,
                ...rest
            } = validPayload();
            const res = await request(app).
            post('/api/v1/semesters').
            set('Authorization', `Bearer ${adminToken}`).
            send(rest);
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Semester number is required');
        });

        test('should return 400 when academicStartYear is missing', async () => {
            const {
                academicStartYear,
                ...rest
            } = validPayload();
            const res = await request(app).
            post('/api/v1/semesters').
            set('Authorization', `Bearer ${adminToken}`).
            send(rest);
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Academic start year is required');
        });

        test('should return 400 when academicEndYear is missing', async () => {
            const {
                academicEndYear,
                ...rest
            } = validPayload();
            const res = await request(app).
            post('/api/v1/semesters').
            set('Authorization', `Bearer ${adminToken}`).
            send(rest);
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Academic end year is required');
        });

        test('should return 400 when startDate is missing', async () => {
            const {
                startDate,
                ...rest
            } = validPayload();
            const res = await request(app).
            post('/api/v1/semesters').
            set('Authorization', `Bearer ${adminToken}`).
            send(rest);
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Start date is required');
        });

        test('should return 400 when endDate is missing', async () => {
            const {
                endDate,
                ...rest
            } = validPayload();
            const res = await request(app).
            post('/api/v1/semesters').
            set('Authorization', `Bearer ${adminToken}`).
            send(rest);
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('End date is required');
        });

        test('should return 400 when schemeId is missing', async () => {
            const {
                schemeId,
                ...rest
            } = validPayload();
            const res = await request(app).
            post('/api/v1/semesters').
            set('Authorization', `Bearer ${adminToken}`).
            send(rest);
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Scheme ID is required');
        });

        test('should return 400 when optionalCourseIds contains non-UUID', async () => {
            const payload = {
                ...validPayload(),
                optionalCourseIds: ['not-a-uuid']
            };
            const res = await request(app).
            post('/api/v1/semesters').
            set('Authorization', `Bearer ${adminToken}`).
            send(payload);
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Each optional course ID must be a valid UUID');
        });
    });

    describe('Business rule validations', () => {
        test('should return 400 when academicEndYear < academicStartYear', async () => {
            const payload = {
                ...validPayload(),
                academicStartYear: 2026,
                academicEndYear: 2025
            };
            const res = await request(app).
            post('/api/v1/semesters').
            set('Authorization', `Bearer ${adminToken}`).
            send(payload);
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toBe('Academic end year cannot be less than academic start year');
        });

        test('should return 400 when startDate >= endDate', async () => {
            const payload = {
                ...validPayload(),
                startDate: '2026-02-01',
                endDate: '2026-02-01'
            };
            const res = await request(app).
            post('/api/v1/semesters').
            set('Authorization', `Bearer ${adminToken}`).
            send(payload);
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toBe('End date cannot be less than or equal to start date');
        });

        test('should return 400 when startDate year < academicStartYear', async () => {
            const payload = {
                ...validPayload(),
                academicStartYear: 2026,
                academicEndYear: 2026,
                startDate: '2025-12-31',
                endDate: '2026-01-02'
            };
            const res = await request(app).
            post('/api/v1/semesters').
            set('Authorization', `Bearer ${adminToken}`).
            send(payload);
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toBe('Start date cannot be lesser than academic start year');
        });

        test('should return 400 when endDate year > academicEndYear', async () => {
            const payload = {
                ...validPayload(),
                academicStartYear: 2026,
                academicEndYear: 2026,
                startDate: '2026-08-01',
                endDate: '2026-01-01'
            };
            const res = await request(app).
            post('/api/v1/semesters').
            set('Authorization', `Bearer ${adminToken}`).
            send(payload);
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toBe('End date cannot be greater than academic end year');
        });
    });

    describe('Optional courses validation and success', () => {
        let c1a, c1b, c2a;
        const semesterNumber = 7;

        beforeEach(async () => {

            c1a = await Course.create({
                schemeId: scheme.id,
                code: 'C1A',
                name: 'Course 1A',
                optionalCourse: 'OS1'
            });
            c1b = await Course.create({
                schemeId: scheme.id,
                code: 'C1B',
                name: 'Course 1B',
                optionalCourse: 'OS1'
            });
            c2a = await Course.create({
                schemeId: scheme.id,
                code: 'C2A',
                name: 'Course 2A',
                optionalCourse: 'OS2'
            });

            await BranchCourseSemester.create({
                branchId: branch.id,
                courseId: c1a.id,
                semesterNumber
            });
            await BranchCourseSemester.create({
                branchId: branch.id,
                courseId: c1b.id,
                semesterNumber
            });
            await BranchCourseSemester.create({
                branchId: branch.id,
                courseId: c2a.id,
                semesterNumber
            });
        });

        test('should return 400 when optionalCourseIds count does not match required groups', async () => {
            const payload = {
                ...validPayload(),
                semesterNumber,
                optionalCourseIds: [c1a.id]
            };
            const res = await request(app).
            post('/api/v1/semesters').
            set('Authorization', `Bearer ${adminToken}`).
            send(payload);
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toBe('Please give 2 optional courses');
        });

        test('should return 400 when optionalCourseIds are invalid for required groups', async () => {

            const payload = {
                ...validPayload(),
                semesterNumber,
                optionalCourseIds: [c1a.id, c1b.id]
            };
            const res = await request(app).
            post('/api/v1/semesters').
            set('Authorization', `Bearer ${adminToken}`).
            send(payload);
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toBe('Invalid optional courses');
        });

        test('should create semester and link optional courses when valid', async () => {
            const payload = {
                ...validPayload(),
                semesterNumber,
                optionalCourseIds: [c1a.id, c2a.id]
            };
            const res = await request(app).
            post('/api/v1/semesters').
            set('Authorization', `Bearer ${adminToken}`).
            send(payload);
            expect(res.status).toBe(httpStatus.CREATED);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Semester added successfully');

            const created = await Semester.findOne({
                where: {
                    branchId: branch.id,
                    semesterNumber
                }
            });
            expect(created).toBeTruthy();
            const scLinks = await SemesterCourse.findAll({
                where: {
                    semesterId: created.id
                }
            });
            const linkedCourseIds = scLinks.map((l) => l.courseId);
            expect(linkedCourseIds).toEqual(expect.arrayContaining([c1a.id, c2a.id]));
            expect(linkedCourseIds).toHaveLength(2);

            const returnedIds = res.body.data.addedOptionalCourses.map((c) => c.id);
            expect(returnedIds).toEqual(expect.arrayContaining([c1a.id, c2a.id]));
            expect(returnedIds).toHaveLength(2);
        });
    });

    test('should create semester successfully when no optional courses exist', async () => {
        const payload = validPayload();
        const res = await request(app).
        post('/api/v1/semesters').
        set('Authorization', `Bearer ${adminToken}`).
        send(payload);
        expect(res.status).toBe(httpStatus.CREATED);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe('Semester added successfully');

        const created = await Semester.findOne({
            where: {
                branchId: branch.id,
                semesterNumber: payload.semesterNumber,
                academicStartYear: payload.academicStartYear,
                academicEndYear: payload.academicEndYear,
                schemeId: scheme.id
            }
        });
        expect(created).toBeTruthy();
        const scLinks = await SemesterCourse.findAll({
            where: {
                semesterId: created.id
            }
        });
        expect(scLinks).toHaveLength(0);

        expect(Array.isArray(res.body.data.addedOptionalCourses)).toBe(true);
        expect(res.body.data.addedOptionalCourses).toHaveLength(0);
    });
});
