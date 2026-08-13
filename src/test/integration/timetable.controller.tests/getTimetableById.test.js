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
import Semester from '../../../db/models/semester.model.js';
import Division from '../../../db/models/division.model.js';
import Timetable from '../../../db/models/timetable.model.js';

setupTestDb();

describe('Timetable API - GET /api/v1/timetables/:id', () => {
    let adminToken;
    let teacherToken;
    let studentToken;
    let university;
    let branch;
    let scheme;
    let semester;
    let division;
    let timetable;

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
            semester = await Semester.create({
                semesterNumber: 1,
                branchId: branch.id,
                academicStartYear: 2025,
                academicEndYear: 2026,
                startDate: '2025-08-01',
                endDate: '2025-12-31',
                schemeId: scheme.id
            });
            division = await Division.create({
                divisionCode: 'A',
                semesterId: semester.id
            });
            timetable = await Timetable.create({
                divisionId: division.id,
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
        const res = await request(app).get(`/api/v1/timetables/${timetable.id}`);
        expect(res.status).toBe(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 when invalid token is provided', async () => {
        const res = await request(app).get(`/api/v1/timetables/${timetable.id}`).set('Authorization', 'Bearer invalidtoken');
        expect(res.status).toBe(httpStatus.UNAUTHORIZED);
    });

    test('should allow Admin/Teacher/Student to fetch a timetable by id', async () => {
        for (const token of [adminToken, teacherToken, studentToken]) {
            const res = await request(app).get(`/api/v1/timetables/${timetable.id}`).set('Authorization', `Bearer ${token}`);
            expect(res.status).toBe(httpStatus.OK);
            expect(res.body.success).toBe(true);
            const data = res.body.data;
            expect(data).toHaveProperty('id', timetable.id);
            expect(data).toHaveProperty('Division');
            expect(data.Division).toHaveProperty('Semester');
            expect(data.Division.Semester).toHaveProperty('Branch');
            expect(data.Division.Semester).toHaveProperty('Scheme');
        }
    });

    test('should return 400 for invalid UUID id', async () => {
        const res = await request(app).get('/api/v1/timetables/not-a-uuid').set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(httpStatus.BAD_REQUEST);
        expect(res.body.message).toContain('Timetable ID must be a valid UUID');
    });

    test('should return 404 when timetable not found', async () => {
        const res = await request(app).
        get('/api/v1/timetables/8e9efb3e-0a92-4e4f-9a9b-6f0f7b0b1234').
        set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(httpStatus.NOT_FOUND);
        expect(res.body.message).toBe('Timetable not found');
    });
});
