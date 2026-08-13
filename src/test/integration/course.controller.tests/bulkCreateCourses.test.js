import {
    jest
} from '@jest/globals';
import request from 'supertest';
import app from '../../../app.js';
import setupTestDb from '../../util/setupTestDb.js';
import Admin from '../../../db/models/admin.model.js';
import Teacher from '../../../db/models/teacher.model.js';
import Student from '../../../db/models/student.model.js';
import University from '../../../db/models/university.model.js';
import Scheme from '../../../db/models/scheme.model.js';
import Branch from '../../../db/models/branch.model.js';
import Course from '../../../db/models/course.model.js';
import httpStatus from 'http-status';
import {
    v4 as uuidv4
} from 'uuid';

setupTestDb();

describe('Course API - bulkCreateCourses', () => {
    let adminToken, teacherToken, studentToken;
    let admin, teacher, student;
    let university, scheme, branch;

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

            admin = await Admin.create({
                firstName: 'Test',
                lastName: 'Admin',
                email: 'testadmin@example.com',
                username: 'testadmin',
                password: 'Admin@12345'
            });

            const adminLoginRes = await request(app).
            post('/api/v1/auth/admins/login').
            send({
                emailOrUsername: 'testadmin@example.com',
                password: 'Admin@12345'
            });
            adminToken = adminLoginRes.body.data.accessToken;

            await Teacher.create({
                firstName: 'Test',
                lastName: 'Teacher',
                email: 'testteacher@example.com',
                phoneNumber: '+919876543211',
                password: 'Teacher@123',
                gender: 'Male',
                role: 'Teacher'
            });

            const teacherLoginRes = await request(app).
            post('/api/v1/auth/teachers/login').
            send({
                email: 'testteacher@example.com',
                password: 'Teacher@123'
            });
            teacherToken = teacherLoginRes.body.data.accessToken;

            await Student.create({
                firstName: 'Test',
                lastName: 'Student',
                email: 'teststudent@example.com',
                phoneNumber: '+919876543212',
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
                emailOrPRN: 'teststudent@example.com',
                password: 'Student@123'
            });
            studentToken = studentLoginRes.body.data.accessToken;

        } catch (error) {
            console.error('Setup error:', error);
            throw error;
        }
    });

    describe('POST /api/v1/courses/bulk/create', () => {
        const validCoursesData = () => ({
            courses: [{
                    code: 'CS101',
                    name: 'Introduction to Computer Science',
                    schemeId: scheme.id
                },
                {
                    code: 'CS102',
                    name: 'Data Structures',
                    schemeId: scheme.id
                },
                {
                    code: 'CS103',
                    name: 'Algorithms',
                    schemeId: scheme.id
                }
            ]

        });

        describe('Authentication', () => {
            test('should return 401 if no token provided', async () => {
                const response = await request(app).
                post('/api/v1/courses/bulk/create').
                send({
                    courses: [{
                        code: 'TEST101',
                        name: 'Test Course',
                        schemeId: uuidv4()
                    }]
                });

                expect(response.status).toBe(httpStatus.UNAUTHORIZED);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('No token provided');
            });

            test('should return 401 if invalid token provided', async () => {
                const response = await request(app).
                post('/api/v1/courses/bulk/create').
                set('Authorization', 'Bearer invalidtoken').
                send({
                    courses: [{
                        code: 'TEST101',
                        name: 'Test Course',
                        schemeId: uuidv4()
                    }]
                });

                expect(response.status).toBe(httpStatus.UNAUTHORIZED);
                expect(response.body.success).toBe(false);
            });

            test('should return 403 if student tries to bulk create', async () => {
                const response = await request(app).
                post('/api/v1/courses/bulk/create').
                set('Authorization', `Bearer ${studentToken}`).
                send({
                    courses: [{
                        code: 'TEST101',
                        name: 'Test Course',
                        schemeId: uuidv4()
                    }]
                });

                expect(response.status).toBe(httpStatus.FORBIDDEN);
                expect(response.body.success).toBe(false);
            });

            test('should return 403 if teacher tries to bulk create', async () => {
                const response = await request(app).
                post('/api/v1/courses/bulk/create').
                set('Authorization', `Bearer ${teacherToken}`).
                send({
                    courses: [{
                        code: 'TEST101',
                        name: 'Test Course',
                        schemeId: uuidv4()
                    }]
                });

                expect(response.status).toBe(httpStatus.FORBIDDEN);
                expect(response.body.success).toBe(false);
            });
        });

        describe('Validation', () => {
            test('should return 400 if courses array is missing', async () => {
                const response = await request(app).
                post('/api/v1/courses/bulk/create').
                set('Authorization', `Bearer ${adminToken}`).
                send({});

                expect(response.status).toBe(httpStatus.BAD_REQUEST);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Courses array is required');
            });

            test('should return 400 if courses array is empty', async () => {
                const response = await request(app).
                post('/api/v1/courses/bulk/create').
                set('Authorization', `Bearer ${adminToken}`).
                send({
                    courses: []
                });

                expect(response.status).toBe(httpStatus.BAD_REQUEST);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('At least 1 course is required');
            });

            test('should return 400 for very large course arrays', async () => {
                const courses = Array.from({
                    length: 101
                }, (_, index) => ({
                    code: `CS${index.toString().padStart(3, '0')}`,
                    name: `Course ${index}`,
                    schemeId: uuidv4()
                }));

                const response = await request(app).
                post('/api/v1/courses/bulk/create').
                set('Authorization', `Bearer ${adminToken}`).
                send({
                    courses
                });

                expect(response.status).toBe(httpStatus.BAD_REQUEST);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Cannot create more than 100 courses at once');
            });

            test('should return 400 if course code is missing', async () => {
                const invalidData = {
                    ...validCoursesData()
                };
                delete invalidData.courses[0].code;

                const response = await request(app).
                post('/api/v1/courses/bulk/create').
                set('Authorization', `Bearer ${adminToken}`).
                send(invalidData);

                expect(response.status).toBe(httpStatus.BAD_REQUEST);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Course code is required');
            });

            test('should return 400 if course name is missing', async () => {
                const invalidData = {
                    ...validCoursesData()
                };
                delete invalidData.courses[0].name;

                const response = await request(app).
                post('/api/v1/courses/bulk/create').
                set('Authorization', `Bearer ${adminToken}`).
                send(invalidData);

                expect(response.status).toBe(httpStatus.BAD_REQUEST);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Course name is required');
            });

            test('should return 400 if schemeId is not a valid UUID', async () => {
                const invalidData = {
                    ...validCoursesData()
                };
                invalidData.courses[0].schemeId = 'invalid-uuid';

                const response = await request(app).
                post('/api/v1/courses/bulk/create').
                set('Authorization', `Bearer ${adminToken}`).
                send(invalidData);

                expect(response.status).toBe(httpStatus.BAD_REQUEST);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Scheme ID must be a valid UUID');
            });
        });

        describe('Business Logic Validation', () => {
            test('should return 400 if scheme does not exist', async () => {
                const invalidData = {
                    ...validCoursesData()
                };
                invalidData.courses[0].schemeId = uuidv4();

                const response = await request(app).
                post('/api/v1/courses/bulk/create').
                set('Authorization', `Bearer ${adminToken}`).
                send(invalidData);

                expect(response.status).toBe(httpStatus.BAD_REQUEST);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Invalid scheme IDs');
            });

            test('should return 409 if duplicate course codes exist in request', async () => {
                const duplicateData = {
                    ...validCoursesData()
                };
                duplicateData.courses[1].code = duplicateData.courses[0].code;

                const response = await request(app).
                post('/api/v1/courses/bulk/create').
                set('Authorization', `Bearer ${adminToken}`).
                send(duplicateData);

                expect(response.status).toBe(httpStatus.CONFLICT);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Course codes already exist');
            });

            test('should return 409 if course code already exists in database', async () => {

                await Course.create({
                    code: 'CS101',
                    name: 'Existing Course',
                    schemeId: scheme.id
                });

                const response = await request(app).
                post('/api/v1/courses/bulk/create').
                set('Authorization', `Bearer ${adminToken}`).
                send(validCoursesData());

                expect(response.status).toBe(httpStatus.CONFLICT);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Course codes already exist');
            });
        });

        describe('Success Cases', () => {
            test('should bulk create courses successfully', async () => {
                const response = await request(app).
                post('/api/v1/courses/bulk/create').
                set('Authorization', `Bearer ${adminToken}`).
                send(validCoursesData());

                expect(response.status).toBe(httpStatus.CREATED);
                expect(response.body.success).toBe(true);
                expect(response.body.message).toBe('3 courses created successfully');
                expect(response.body.data).toHaveProperty('courses');
                expect(response.body.data.courses).toHaveLength(3);
                expect(response.body.data.courses[0]).toHaveProperty('id');
                expect(response.body.data.courses[0]).toHaveProperty('code');

                const createdCourses = await Course.findAll({
                    where: {
                        code: ['CS101', 'CS102', 'CS103']
                    }
                });
                expect(createdCourses).toHaveLength(3);
            });

            test('should handle single course in array', async () => {
                const singleCourseData = {
                    courses: [validCoursesData().courses[0]]
                };

                const response = await request(app).
                post('/api/v1/courses/bulk/create').
                set('Authorization', `Bearer ${adminToken}`).
                send(singleCourseData);

                expect(response.status).toBe(httpStatus.CREATED);
                expect(response.body.success).toBe(true);
                expect(response.body.message).toBe('1 courses created successfully');
                expect(response.body.data.courses).toHaveLength(1);
            });

            test('should handle optional fields correctly', async () => {
                const dataWithOptionals = {
                    ...validCoursesData()
                };
                dataWithOptionals.courses[0].optionalCourse = 'Programming Fundamentals';

                const response = await request(app).
                post('/api/v1/courses/bulk/create').
                set('Authorization', `Bearer ${adminToken}`).
                send(dataWithOptionals);

                expect(response.status).toBe(httpStatus.CREATED);
                expect(response.body.success).toBe(true);
                expect(response.body.message).toBe('3 courses created successfully');
                expect(response.body.data.courses[0]).toHaveProperty('optionalCourse', 'Programming Fundamentals');
            });
        });
    });
});
