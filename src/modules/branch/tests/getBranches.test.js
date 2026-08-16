import {
    jest
} from '@jest/globals';
import request from 'supertest';
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
import Batch from '../../../db/models/batch.model.js';
import Course from '../../../db/models/course.model.js';
import Room from '../../../db/models/room.model.js';
import Timetable from '../../../db/models/timetable.model.js';
import Class from '../../../db/models/class.model.js';
import {
    Attendance,
    AttendanceStudent
} from '../../../db/models/attendance.model.js';
import StudentSemester from '../../../db/models/studentSemester.model.js';
import StudentDivision from '../../../db/models/studentDivision.model.js';
import StudentBatch from '../../../db/models/studentBatch.model.js';
import {
    faker
} from '@faker-js/faker';
import httpStatus from 'http-status';
import {
    ROLES
} from '../../../config/roles.js';

setupTestDb();

describe('Branch API - getBranches', () => {
    let adminToken;
    let teacherToken;
    let studentToken;
    let university;
    let branch1;
    let branch2;
    let branch3;

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

            university = await University.create({
                name: 'Test University',
                abbreviation: 'TU'
            });

            branch1 = await Branch.create({
                name: 'Computer Science',
                abbreviation: 'CS'
            });
            branch2 = await Branch.create({
                name: 'Information Technology',
                abbreviation: 'IT'
            });
            branch3 = await Branch.create({
                name: 'Mechanical Engineering',
                abbreviation: 'ME'
            });

            const scheme = await Scheme.create({
                name: 'CS 2026 Scheme',
                universityId: university.id
            });

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

            await Student.create({
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'student1@example.com',
                phoneNumber: '+919876543210',
                prn: 'STU001',
                password: 'Student@123',
                schemeId: scheme.id,
                branchId: branch1.id,
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
        } catch (error) {
            console.error('Error in beforeEach:', error);
            throw error;
        }
    });

    describe('GET /api/v1/branches', () => {
        describe('Authentication', () => {
            test('should return 401 if no token provided', async () => {
                const response = await request(app).
                get('/api/v1/branches');

                expect(response.status).toBe(httpStatus.UNAUTHORIZED);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('token');
            });

            test('should return 401 if invalid token provided', async () => {
                const response = await request(app).
                get('/api/v1/branches').
                set('Authorization', 'Bearer invalidtoken');

                expect(response.status).toBe(httpStatus.UNAUTHORIZED);
                expect(response.body.success).toBe(false);
            });
        });

        describe('Success Cases', () => {
            test('should get all branches successfully with admin token', async () => {
                const response = await request(app).
                get('/api/v1/branches').
                set('Authorization', `Bearer ${adminToken}`);

                expect(response.status).toBe(httpStatus.OK);
                expect(response.body.success).toBe(true);
                expect(response.body.message).toContain('Branches retrieved successfully');
                expect(Array.isArray(response.body.data)).toBe(true);
                expect(response.body.data.length).toBeGreaterThanOrEqual(3);

                const branch = response.body.data[0];
                expect(branch).toHaveProperty('id');
                expect(branch).toHaveProperty('name');
                expect(branch).toHaveProperty('abbreviation');
            });

            test('should get branches with search query', async () => {
                const response = await request(app).
                get('/api/v1/branches').
                query({
                    searchQuery: 'Computer'
                }).
                set('Authorization', `Bearer ${adminToken}`);

                expect(response.status).toBe(httpStatus.OK);
                expect(response.body.success).toBe(true);
                expect(Array.isArray(response.body.data)).toBe(true);
                expect(response.body.data.length).toBe(1);
                expect(response.body.data[0].name).toBe('Computer Science');
            });

            test('should get branches with case insensitive search', async () => {
                const response = await request(app).
                get('/api/v1/branches').
                query({
                    searchQuery: 'computer'
                }).
                set('Authorization', `Bearer ${adminToken}`);

                expect(response.status).toBe(httpStatus.OK);
                expect(response.body.success).toBe(true);
                expect(Array.isArray(response.body.data)).toBe(true);
                expect(response.body.data.length).toBe(1);
                expect(response.body.data[0].name).toBe('Computer Science');
            });

            test('should get branches with partial search match', async () => {
                const response = await request(app).
                get('/api/v1/branches').
                query({
                    searchQuery: 'Eng'
                }).
                set('Authorization', `Bearer ${adminToken}`);

                expect(response.status).toBe(httpStatus.OK);
                expect(response.body.success).toBe(true);
                expect(Array.isArray(response.body.data)).toBe(true);
                expect(response.body.data.length).toBe(1);
                expect(response.body.data[0].name).toBe('Mechanical Engineering');
            });

            test('should return empty array when no branches match search', async () => {
                const response = await request(app).
                get('/api/v1/branches').
                query({
                    searchQuery: 'NonExistentBranch'
                }).
                set('Authorization', `Bearer ${adminToken}`);

                expect(response.status).toBe(httpStatus.OK);
                expect(response.body.success).toBe(true);
                expect(Array.isArray(response.body.data)).toBe(true);
                expect(response.body.data.length).toBe(0);
            });

            test('should get branches with teacher token', async () => {
                const response = await request(app).
                get('/api/v1/branches').
                set('Authorization', `Bearer ${teacherToken}`);

                expect(response.status).toBe(httpStatus.OK);
                expect(response.body.success).toBe(true);
                expect(Array.isArray(response.body.data)).toBe(true);
            });

            test('should get branches with student token', async () => {
                const response = await request(app).
                get('/api/v1/branches').
                set('Authorization', `Bearer ${studentToken}`);

                expect(response.status).toBe(httpStatus.OK);
                expect(response.body.success).toBe(true);
                expect(Array.isArray(response.body.data)).toBe(true);
            });
        });
    });
});
