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

describe('Branch API - addBranch', () => {
    let adminToken;
    let teacherToken;
    let studentToken;

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

            const university = await University.create({
                name: 'Test University',
                abbreviation: 'TU'
            });
            const branch = await Branch.create({
                name: 'Computer Science',
                abbreviation: 'CS'
            });
            const scheme = await Scheme.create({
                name: 'CS 2026 Scheme',
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
        } catch (error) {
            console.error('Error in beforeEach:', error);
            throw error;
        }
    });

    describe('POST /api/v1/branches', () => {
        describe('Authentication', () => {
            test('should return 401 if no token provided', async () => {
                const response = await request(app).
                post('/api/v1/branches').
                send({
                    name: 'Test Branch',
                    abbreviation: 'TB'
                });

                expect(response.status).toBe(httpStatus.UNAUTHORIZED);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('token');
            });

            test('should return 401 if invalid token provided', async () => {
                const response = await request(app).
                post('/api/v1/branches').
                set('Authorization', 'Bearer invalidtoken').
                send({
                    name: 'Test Branch',
                    abbreviation: 'TB'
                });

                expect(response.status).toBe(httpStatus.UNAUTHORIZED);
                expect(response.body.success).toBe(false);
            });

            test('should return 403 if student tries to add branch', async () => {
                const response = await request(app).
                post('/api/v1/branches').
                set('Authorization', `Bearer ${studentToken}`).
                send({
                    name: 'Test Branch',
                    abbreviation: 'TB'
                });

                expect(response.status).toBe(httpStatus.FORBIDDEN);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Insufficient permissions');
            });
        });

        describe('Validation', () => {
            test('should return 400 if name is missing', async () => {
                const response = await request(app).
                post('/api/v1/branches').
                set('Authorization', `Bearer ${adminToken}`).
                send({
                    abbreviation: 'TB'
                });

                expect(response.status).toBe(httpStatus.BAD_REQUEST);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Name is required');
            });

            test('should return 400 if abbreviation is empty', async () => {
                const response = await request(app).
                post('/api/v1/branches').
                set('Authorization', `Bearer ${adminToken}`).
                send({
                    name: 'Test Branch',
                    abbreviation: ''
                });

                expect(response.status).toBe(httpStatus.BAD_REQUEST);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Abbreviation cannot be empty');
            });
        });

        describe('Success Cases', () => {
            test('should add branch successfully with admin token', async () => {
                const branchData = {
                    name: 'Electrical Engineering',
                    abbreviation: 'EE'
                };

                const response = await request(app).
                post('/api/v1/branches').
                set('Authorization', `Bearer ${adminToken}`).
                send(branchData);

                expect(response.status).toBe(httpStatus.CREATED);
                expect(response.body.success).toBe(true);
                expect(response.body.message).toContain('Branch added successfully');
                expect(response.body.data).toHaveProperty('id');
                expect(response.body.data.name).toBe(branchData.name);
                expect(response.body.data.abbreviation).toBe(branchData.abbreviation);

                const createdBranch = await Branch.findByPk(response.body.data.id);
                expect(createdBranch).toBeTruthy();
                expect(createdBranch.name).toBe(branchData.name);
                expect(createdBranch.abbreviation).toBe(branchData.abbreviation);
            });

            test('should return 403 if teacher tries to add branch', async () => {
                const branchData = {
                    name: 'Civil Engineering',
                    abbreviation: 'CE'
                };

                const response = await request(app).
                post('/api/v1/branches').
                set('Authorization', `Bearer ${teacherToken}`).
                send(branchData);

                expect(response.status).toBe(httpStatus.FORBIDDEN);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Insufficient permissions');
            });

            test('should handle empty strings for optional fields', async () => {
                const branchData = {
                    name: 'Test Branch',
                    abbreviation: 'TB'
                };

                const response = await request(app).
                post('/api/v1/branches').
                set('Authorization', `Bearer ${adminToken}`).
                send(branchData);

                expect(response.status).toBe(httpStatus.CREATED);
                expect(response.body.success).toBe(true);
                expect(response.body.data.name).toBe(branchData.name);
                expect(response.body.data.abbreviation).toBe(branchData.abbreviation);
            });
        });
    });
});
