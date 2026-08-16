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
import Semester from '../../../db/models/semester.model.js';
import Division from '../../../db/models/division.model.js';
import Timetable from '../../../db/models/timetable.model.js';

setupTestDb();

describe('Timetable API - GET /api/v1/timetables', () => {
    let adminToken;
    let teacherToken;
    let studentToken;
    let university;
    let branch;
    let scheme;
    let semester1;
    let semester2;
    let divisionA1;
    let divisionA2;
    let divisionB1;
    let ttA1;
    let ttA2;
    let ttB1;

    beforeEach(async () => {
        try {

            await Admin.create({
                email: 'admin@example.com',
                username: 'adminuser',
                password: 'Admin@12345'
            });
            const adminLoginRes = await request(app).post('/api/v1/auth/admins/login').send({
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
            const teacherLoginRes = await request(app).post('/api/v1/auth/teachers/login').send({
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

            semester1 = await Semester.create({
                semesterNumber: 1,
                branchId: branch.id,
                academicStartYear: 2025,
                academicEndYear: 2026,
                startDate: '2025-08-01',
                endDate: '2025-12-31',
                schemeId: scheme.id
            });
            semester2 = await Semester.create({
                semesterNumber: 2,
                branchId: branch.id,
                academicStartYear: 2026,
                academicEndYear: 2026,
                startDate: '2026-01-01',
                endDate: '2026-05-31',
                schemeId: scheme.id
            });

            divisionA1 = await Division.create({
                divisionCode: 'A1',
                semesterId: semester1.id
            });
            divisionA2 = await Division.create({
                divisionCode: 'A2',
                semesterId: semester1.id
            });
            divisionB1 = await Division.create({
                divisionCode: 'B1',
                semesterId: semester2.id
            });

            ttA1 = await Timetable.create({
                divisionId: divisionA1.id,
                timetableVersion: 1
            });
            ttA2 = await Timetable.create({
                divisionId: divisionA2.id,
                timetableVersion: 2
            });
            ttB1 = await Timetable.create({
                divisionId: divisionB1.id,
                timetableVersion: 1
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
            const studentLoginRes = await request(app).post('/api/v1/auth/students/login').send({
                emailOrPRN: 'student1@example.com',
                password: 'Student@123'
            });
            studentToken = studentLoginRes.body.data.accessToken;
        } catch (err) {

            console.error('beforeEach setup error:', err);
            throw err;
        }
    });

    test('should return 401 when no token is provided', async () => {
        const res = await request(app).get('/api/v1/timetables');
        expect(res.status).toBe(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 when invalid token is provided', async () => {
        const res = await request(app).get('/api/v1/timetables').set('Authorization', 'Bearer invalidtoken');
        expect(res.status).toBe(httpStatus.UNAUTHORIZED);
    });

    test('should allow Admin/Teacher/Student to fetch timetables', async () => {
        for (const token of [adminToken, teacherToken, studentToken]) {
            const res = await request(app).get('/api/v1/timetables').set('Authorization', `Bearer ${token}`);
            expect(res.status).toBe(httpStatus.OK);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('timetables');
            expect(res.body.data).toHaveProperty('totalCount');
            expect(Array.isArray(res.body.data.timetables)).toBe(true);

            const item = res.body.data.timetables[0];
            expect(item).toHaveProperty('Division');
            expect(item.Division).toHaveProperty('Semester');
            expect(item.Division.Semester).toHaveProperty('Branch');
            expect(item.Division.Semester).toHaveProperty('Scheme');
        }
    });

    describe('Validation errors', () => {
        test('should return 400 for invalid page', async () => {
            const res = await request(app).
            get('/api/v1/timetables').
            set('Authorization', `Bearer ${adminToken}`).
            query({
                page: 'zero'
            });
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Page must be a number');
        });

        test('should return 400 for invalid limit', async () => {
            const res = await request(app).
            get('/api/v1/timetables').
            set('Authorization', `Bearer ${adminToken}`).
            query({
                limit: 'many'
            });
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Limit must be a number');
        });

        test('should return 400 for invalid semesterNumber', async () => {
            const res = await request(app).
            get('/api/v1/timetables').
            set('Authorization', `Bearer ${adminToken}`).
            query({
                semesterNumber: 'one'
            });
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Semester number must be a number');
        });

        test('should return 400 for invalid academic years', async () => {
            const res1 = await request(app).
            get('/api/v1/timetables').
            set('Authorization', `Bearer ${adminToken}`).
            query({
                academicStartYearOfSemester: 'yyyy'
            });
            expect(res1.status).toBe(httpStatus.BAD_REQUEST);
            expect(res1.body.message).toContain('Academic start year must be a number');

            const res2 = await request(app).
            get('/api/v1/timetables').
            set('Authorization', `Bearer ${adminToken}`).
            query({
                academicEndYearOfSemester: 'zzzz'
            });
            expect(res2.status).toBe(httpStatus.BAD_REQUEST);
            expect(res2.body.message).toContain('Academic end year must be a number');
        });
    });

    describe('Filtering and pagination', () => {
        test('should filter by semesterNumber', async () => {
            const res = await request(app).
            get('/api/v1/timetables').
            set('Authorization', `Bearer ${adminToken}`).
            query({
                semesterNumber: 1
            });
            expect(res.status).toBe(httpStatus.OK);
            const {
                timetables,
                totalCount
            } = res.body.data;
            expect(totalCount).toBe(2);
            const allSemNumbers = timetables.map((t) => t.Division.Semester.semesterNumber);
            expect(new Set(allSemNumbers)).toEqual(new Set([1]));
        });

        test('should filter by academicStartYearOfSemester and academicEndYearOfSemester', async () => {
            const res = await request(app).
            get('/api/v1/timetables').
            set('Authorization', `Bearer ${adminToken}`).
            query({
                academicStartYearOfSemester: 2026,
                academicEndYearOfSemester: 2026
            });
            expect(res.status).toBe(httpStatus.OK);
            const {
                timetables,
                totalCount
            } = res.body.data;
            expect(totalCount).toBe(1);
            expect(timetables[0].Division.Semester.academicStartYear).toBe(2026);
            expect(timetables[0].Division.Semester.academicEndYear).toBe(2026);
        });

        test('should paginate results', async () => {
            const resPage1 = await request(app).
            get('/api/v1/timetables').
            set('Authorization', `Bearer ${adminToken}`).
            query({
                page: 1,
                limit: 2
            });
            expect(resPage1.status).toBe(httpStatus.OK);
            expect(resPage1.body.data.timetables).toHaveLength(2);
            expect(resPage1.body.data.totalCount).toBe(3);

            const resPage2 = await request(app).
            get('/api/v1/timetables').
            set('Authorization', `Bearer ${adminToken}`).
            query({
                page: 2,
                limit: 2
            });
            expect(resPage2.status).toBe(httpStatus.OK);
            expect(resPage2.body.data.timetables.length).toBeGreaterThanOrEqual(1);
        });
    });
});
