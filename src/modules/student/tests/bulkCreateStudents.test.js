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
import httpStatus from 'http-status';
import {
    v4 as uuidv4
} from 'uuid';
import jwt from 'jsonwebtoken';
import {
    config
} from '../../../config/config.js';

setupTestDb();

describe('Student API - bulkCreateStudents', () => {
    let adminToken, teacherToken, studentToken;
    let admin, teacher, student;
    let university, branch, scheme, semester, division, batch;

    beforeEach(async () => {
        try {

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
                endDate: '2026-01-31',
                schemeId: scheme.id
            });

            admin = await Admin.create({
                firstName: 'Test',
                lastName: 'Admin',
                email: 'testadmin@example.com',
                phoneNumber: '+919876543210',
                password: 'Admin@12345',
                username: 'testadmin',
                gender: 'Male',
                universityId: university.id
            });

            adminToken = jwt.sign({
                id: admin.id,
                role: 'admin'
            }, config.jwt.accessTokenSecret || 'test-secret');

            teacher = await Teacher.create({
                firstName: 'Test',
                lastName: 'Teacher',
                email: 'testteacher@example.com',
                phoneNumber: '+919876543211',
                password: 'Teacher@123',
                username: 'testteacher',
                gender: 'Male',
                role: 'Teacher',
                teachingCourse: 'Computer Science',
                universityId: university.id
            });

            teacherToken = jwt.sign({
                id: teacher.id,
                role: 'teacher'
            }, config.jwt.accessTokenSecret || 'test-secret');

            student = await Student.create({
                prn: 'STU001',
                firstName: 'Test',
                lastName: 'Student',
                email: 'teststudent@example.com',
                phoneNumber: '+919876543212',
                password: 'Student@123',
                username: 'teststudent',
                gender: 'Male',
                schemeId: scheme.id,
                branchId: branch.id,
                admissionYear: 2025,
                admissionType: 'FE'
            });

            studentToken = jwt.sign({
                id: student.id,
                role: 'student'
            }, config.jwt.accessTokenSecret || 'test-secret');

        } catch (error) {
            console.error('Setup error:', error);
            throw error;
        }
    });

    describe('POST /api/v1/students/bulk/create', () => {
        const validStudentsData = () => ({
            students: [{
                    firstName: 'Alice',
                    lastName: 'Johnson',
                    email: 'alice@example.com',
                    phoneNumber: '+919876543213',
                    prn: 'STU101',
                    schemeId: scheme.id,
                    branchId: branch.id,
                    admissionYear: 2025,
                    admissionType: 'FE',
                    gender: 'Female'
                },
                {
                    firstName: 'Bob',
                    lastName: 'Wilson',
                    email: 'bob@example.com',
                    phoneNumber: '+919876543214',
                    prn: 'STU102',
                    schemeId: scheme.id,
                    branchId: branch.id,
                    admissionYear: 2025,
                    admissionType: 'FE',
                    gender: 'Male'
                }
            ]

        });

        describe('Authentication', () => {
            test('should return 401 if no token provided', async () => {
                const response = await request(app).
                post('/api/v1/students/bulk/create').
                send(validStudentsData());

                console.log('Response body:', response.body);
                console.log('Response status:', response.status);

                expect(response.status).toBe(httpStatus.UNAUTHORIZED);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('No token provided');
            });

            test('should return 401 if invalid token provided', async () => {
                const response = await request(app).
                post('/api/v1/students/bulk/create').
                set('Authorization', 'Bearer invalidtoken').
                send(validStudentsData());

                expect(response.status).toBe(httpStatus.UNAUTHORIZED);
                expect(response.body.success).toBe(false);
            });

            test('should return 403 if student tries to bulk create', async () => {
                const response = await request(app).
                post('/api/v1/students/bulk/create').
                set('Authorization', `Bearer ${studentToken}`).
                send(validStudentsData());

                expect(response.status).toBe(httpStatus.FORBIDDEN);
                expect(response.body.success).toBe(false);
            });

            test('should return 403 if teacher tries to bulk create', async () => {
                const response = await request(app).
                post('/api/v1/students/bulk/create').
                set('Authorization', `Bearer ${teacherToken}`).
                send(validStudentsData());

                expect(response.status).toBe(httpStatus.FORBIDDEN);
                expect(response.body.success).toBe(false);
            });
        });

        describe('Validation', () => {
            test('should return 400 if students array is missing', async () => {
                const response = await request(app).
                post('/api/v1/students/bulk/create').
                set('Authorization', `Bearer ${adminToken}`).
                send({});

                expect(response.status).toBe(httpStatus.BAD_REQUEST);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Students array is required');
            });

            test('should return 400 if students array is empty', async () => {
                const response = await request(app).
                post('/api/v1/students/bulk/create').
                set('Authorization', `Bearer ${adminToken}`).
                send({
                    students: []
                });

                expect(response.status).toBe(httpStatus.BAD_REQUEST);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('At least one student is required');
            });

            test('should return 413 for very large student arrays', async () => {
                const students = Array.from({
                    length: 101
                }, (_, index) => ({
                    firstName: `Student${index}`,
                    lastName: 'Test',
                    email: `student${index}@example.com`,
                    phoneNumber: `+919876543${index.toString().padStart(3, '0')}`,
                    prn: `STU${index.toString().padStart(3, '0')}`,
                    schemeId: scheme.id,
                    branchId: branch.id,
                    admissionYear: 2025,
                    admissionType: 'FE',
                    gender: 'Male'
                }));

                const response = await request(app).
                post('/api/v1/students/bulk/create').
                set('Authorization', `Bearer ${adminToken}`).
                send({
                    students
                });

                expect(response.status).toBe(413);
                expect(response.body.success).toBe(false);
            });

            test('should return 400 if firstName is missing', async () => {
                const invalidData = {
                    ...validStudentsData()
                };
                delete invalidData.students[0].firstName;

                const response = await request(app).
                post('/api/v1/students/bulk/create').
                set('Authorization', `Bearer ${adminToken}`).
                send(invalidData);

                expect(response.status).toBe(httpStatus.BAD_REQUEST);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('First name is required');
            });

            test('should return 400 if email format is invalid', async () => {
                const invalidData = {
                    ...validStudentsData()
                };
                invalidData.students[0].email = 'invalid-email';

                const response = await request(app).
                post('/api/v1/students/bulk/create').
                set('Authorization', `Bearer ${adminToken}`).
                send(invalidData);

                expect(response.status).toBe(httpStatus.BAD_REQUEST);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Please provide a valid email address');
            });

            test('should return 400 if schemeId is not a valid UUID', async () => {
                const invalidData = {
                    ...validStudentsData()
                };
                invalidData.students[0].schemeId = 'invalid-uuid';

                const response = await request(app).
                post('/api/v1/students/bulk/create').
                set('Authorization', `Bearer ${adminToken}`).
                send(invalidData);

                expect(response.status).toBe(httpStatus.BAD_REQUEST);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Scheme ID must be a valid UUID');
            });
        });

        describe('Business Logic Validation', () => {
            test('should handle invalid scheme IDs gracefully', async () => {
                const invalidData = {
                    ...validStudentsData()
                };
                invalidData.students[0].schemeId = uuidv4();

                const response = await request(app).
                post('/api/v1/students/bulk/create').
                set('Authorization', `Bearer ${adminToken}`).
                send(invalidData);

                expect(response.status).toBe(httpStatus.CREATED);
                expect(response.body.success).toBe(true);
                expect(response.body.data.errors).toHaveLength(2);
                expect(response.body.data.createdStudents).toHaveLength(0);
            });

            test('should handle invalid branch IDs gracefully', async () => {
                const invalidData = {
                    ...validStudentsData()
                };
                invalidData.students[0].branchId = uuidv4();

                const response = await request(app).
                post('/api/v1/students/bulk/create').
                set('Authorization', `Bearer ${adminToken}`).
                send(invalidData);

                expect(response.status).toBe(httpStatus.CREATED);
                expect(response.body.success).toBe(true);
                expect(response.body.data.errors).toHaveLength(2);
                expect(response.body.data.createdStudents).toHaveLength(0);
            });

            test('should handle duplicate PRNs in request gracefully', async () => {
                const duplicateData = {
                    ...validStudentsData()
                };
                duplicateData.students[1].prn = duplicateData.students[0].prn;

                const response = await request(app).
                post('/api/v1/students/bulk/create').
                set('Authorization', `Bearer ${adminToken}`).
                send(duplicateData);

                expect(response.status).toBe(httpStatus.CREATED);
                expect(response.body.success).toBe(true);
                expect(response.body.data.errors).toHaveLength(1);
                expect(response.body.data.createdStudents).toHaveLength(1);
            });

            test('should handle duplicate emails in request gracefully', async () => {
                const duplicateData = {
                    ...validStudentsData()
                };
                duplicateData.students[1].email = duplicateData.students[0].email;

                const response = await request(app).
                post('/api/v1/students/bulk/create').
                set('Authorization', `Bearer ${adminToken}`).
                send(duplicateData);

                expect(response.status).toBe(httpStatus.CREATED);
                expect(response.body.success).toBe(true);
                expect(response.body.data.errors).toHaveLength(1);
                expect(response.body.data.createdStudents).toHaveLength(1);
            });

            test('should handle existing PRN in database gracefully', async () => {

                await Student.create({
                    firstName: 'Existing',
                    lastName: 'Student',
                    email: 'existing@example.com',
                    phoneNumber: '+919876543299',
                    prn: 'STU101',
                    schemeId: scheme.id,
                    branchId: branch.id,
                    admissionYear: 2025,
                    admissionType: 'FE',
                    gender: 'Male'
                });

                const response = await request(app).
                post('/api/v1/students/bulk/create').
                set('Authorization', `Bearer ${adminToken}`).
                send(validStudentsData());

                expect(response.status).toBe(httpStatus.CREATED);
                expect(response.body.success).toBe(true);
                expect(response.body.data.errors).toHaveLength(1);
                expect(response.body.data.createdStudents).toHaveLength(1);
            });
        });

        describe('Success Cases', () => {
            test('should bulk create students successfully', async () => {
                const response = await request(app).
                post('/api/v1/students/bulk/create').
                set('Authorization', `Bearer ${adminToken}`).
                send(validStudentsData());

                expect(response.status).toBe(httpStatus.CREATED);
                expect(response.body.success).toBe(true);
                expect(response.body.message).toContain('Bulk student creation completed');
                expect(response.body.data).toHaveProperty('createdStudents');
                expect(response.body.data.createdStudents).toHaveLength(2);
                expect(response.body.data.createdStudents[0]).toHaveProperty('id');
                expect(response.body.data.createdStudents[0]).toHaveProperty('prn');
                expect(response.body.data.errors).toHaveLength(0);

                const createdStudents = await Student.findAll({
                    where: {
                        prn: ['STU101', 'STU102']
                    }
                });
                expect(createdStudents).toHaveLength(2);
            });

            test('should handle single student in array', async () => {
                const singleStudentData = {
                    students: [validStudentsData().students[0]]
                };

                const response = await request(app).
                post('/api/v1/students/bulk/create').
                set('Authorization', `Bearer ${adminToken}`).
                send(singleStudentData);

                expect(response.status).toBe(httpStatus.CREATED);
                expect(response.body.success).toBe(true);
                expect(response.body.message).toContain('Bulk student creation completed');
                expect(response.body.data.createdStudents).toHaveLength(1);
            });

            test('should handle optional fields correctly', async () => {
                const dataWithOptionals = {
                    ...validStudentsData()
                };
                dataWithOptionals.students[0].middleName = 'Marie';
                dataWithOptionals.students[0].parentEmail = 'parent@example.com';
                dataWithOptionals.students[0].dob = '2000/05/15';

                const response = await request(app).
                post('/api/v1/students/bulk/create').
                set('Authorization', `Bearer ${adminToken}`).
                send(dataWithOptionals);

                expect(response.status).toBe(httpStatus.CREATED);
                expect(response.body.success).toBe(true);
                expect(response.body.data.createdStudents[0]).toHaveProperty('middleName', 'Marie');
            });
        });
    });
});
