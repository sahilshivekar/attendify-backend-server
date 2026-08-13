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
import httpStatus from 'http-status';
import Branch from '../../../db/models/branch.model.js';
import Scheme from '../../../db/models/scheme.model.js';

setupTestDb();

describe('Teacher API - bulkCreateTeachers', () => {
    let adminToken, teacherToken, studentToken;
    let admin, teacher, student;
    let university, branch, scheme;

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

            const admin = await Admin.create({
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

    describe('POST /api/v1/teachers/bulk/create', () => {
        const validTeachersData = () => ({
            teachers: [{
                    firstName: 'Alice',
                    lastName: 'Johnson',
                    email: 'alice.teacher@example.com',
                    phoneNumber: '+919876543213',
                    gender: 'Female',
                    role: 'Teacher'
                },
                {
                    firstName: 'Bob',
                    lastName: 'Wilson',
                    email: 'bob.teacher@example.com',
                    phoneNumber: '+919876543214',
                    gender: 'Male',
                    role: 'Teacher'
                }
            ]

        });

        describe('Authentication', () => {
            test('should return 401 if no token provided', async () => {
                const response = await request(app).
                post('/api/v1/teachers/bulk/create').
                send({
                    teachers: [{
                        firstName: 'Test',
                        lastName: 'Teacher',
                        email: 'test@example.com',
                        phoneNumber: '+919876543210',
                        gender: 'Male',
                        role: 'Teacher'
                    }]
                });

                expect(response.status).toBe(httpStatus.UNAUTHORIZED);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('No token provided');
            });

            test('should return 401 if invalid token provided', async () => {
                const response = await request(app).
                post('/api/v1/teachers/bulk/create').
                set('Authorization', 'Bearer invalidtoken').
                send({
                    teachers: [{
                        firstName: 'Test',
                        lastName: 'Teacher',
                        email: 'test@example.com',
                        phoneNumber: '+919876543210',
                        gender: 'Male',
                        role: 'Teacher'
                    }]
                });

                expect(response.status).toBe(httpStatus.UNAUTHORIZED);
                expect(response.body.success).toBe(false);
            });

            test('should return 403 if student tries to bulk create', async () => {
                const response = await request(app).
                post('/api/v1/teachers/bulk/create').
                set('Authorization', `Bearer ${studentToken}`).
                send({
                    teachers: [{
                        firstName: 'Test',
                        lastName: 'Teacher',
                        email: 'test@example.com',
                        phoneNumber: '+919876543210',
                        gender: 'Male',
                        role: 'Teacher'
                    }]
                });

                expect(response.status).toBe(httpStatus.FORBIDDEN);
                expect(response.body.success).toBe(false);
            });

            test('should return 403 if teacher tries to bulk create', async () => {
                const response = await request(app).
                post('/api/v1/teachers/bulk/create').
                set('Authorization', `Bearer ${teacherToken}`).
                send({
                    teachers: [{
                        firstName: 'Test',
                        lastName: 'Teacher',
                        email: 'test@example.com',
                        phoneNumber: '+919876543210',
                        gender: 'Male',
                        role: 'Teacher'
                    }]
                });

                expect(response.status).toBe(httpStatus.FORBIDDEN);
                expect(response.body.success).toBe(false);
            });
        });

        describe('Validation', () => {
            test('should return 400 if teachers array is missing', async () => {
                const response = await request(app).
                post('/api/v1/teachers/bulk/create').
                set('Authorization', `Bearer ${adminToken}`).
                send({});

                expect(response.status).toBe(httpStatus.BAD_REQUEST);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Teachers array is required');
            });

            test('should return 400 if teachers array is empty', async () => {
                const response = await request(app).
                post('/api/v1/teachers/bulk/create').
                set('Authorization', `Bearer ${adminToken}`).
                send({
                    teachers: []
                });

                expect(response.status).toBe(httpStatus.BAD_REQUEST);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('At least one teacher is required');
            });

            test('should handle large teacher arrays within limits', async () => {
                const teachers = Array.from({
                    length: 10
                }, (_, index) => ({
                    firstName: `Teacher${index}`,
                    lastName: 'Test',
                    email: `teacher${index}@example.com`,
                    phoneNumber: `+919876543${index.toString().padStart(3, '0')}`,
                    gender: 'Male',
                    role: 'Teacher'
                }));

                const response = await request(app).
                post('/api/v1/teachers/bulk/create').
                set('Authorization', `Bearer ${adminToken}`).
                send({
                    teachers
                });

                expect(response.status).toBe(httpStatus.CREATED);
                expect(response.body.success).toBe(true);
                expect(response.body.data.createdTeachers).toHaveLength(10);
                expect(response.body.data.errors).toHaveLength(0);
            });

            test('should return 400 if firstName is missing', async () => {
                const invalidData = {
                    ...validTeachersData()
                };
                delete invalidData.teachers[0].firstName;

                const response = await request(app).
                post('/api/v1/teachers/bulk/create').
                set('Authorization', `Bearer ${adminToken}`).
                send(invalidData);

                expect(response.status).toBe(httpStatus.BAD_REQUEST);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('First name is required');
            });

            test('should return 400 if email format is invalid', async () => {
                const invalidData = {
                    ...validTeachersData()
                };
                invalidData.teachers[0].email = 'invalid-email';

                const response = await request(app).
                post('/api/v1/teachers/bulk/create').
                set('Authorization', `Bearer ${adminToken}`).
                send(invalidData);

                expect(response.status).toBe(httpStatus.BAD_REQUEST);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Please provide a valid email address');
            });

            test('should return 400 if gender is missing', async () => {
                const invalidData = {
                    ...validTeachersData()
                };
                delete invalidData.teachers[0].gender;

                const response = await request(app).
                post('/api/v1/teachers/bulk/create').
                set('Authorization', `Bearer ${adminToken}`).
                send(invalidData);

                expect(response.status).toBe(httpStatus.BAD_REQUEST);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Gender is required');
            });
        });

        describe('Business Logic Validation', () => {
            test('should handle duplicate emails in request gracefully', async () => {
                const duplicateData = {
                    ...validTeachersData()
                };
                duplicateData.teachers[1].email = duplicateData.teachers[0].email;

                const response = await request(app).
                post('/api/v1/teachers/bulk/create').
                set('Authorization', `Bearer ${adminToken}`).
                send(duplicateData);

                expect(response.status).toBe(httpStatus.CREATED);
                expect(response.body.success).toBe(true);
                expect(response.body.data.errors).toHaveLength(1);
                expect(response.body.data.createdTeachers).toHaveLength(1);
            });

            test('should handle existing email in database gracefully', async () => {

                await Teacher.create({
                    firstName: 'Existing',
                    lastName: 'Teacher',
                    email: 'alice.teacher@example.com',
                    phoneNumber: '+919876543299',
                    gender: 'Female',
                    role: 'Teacher'
                });

                const response = await request(app).
                post('/api/v1/teachers/bulk/create').
                set('Authorization', `Bearer ${adminToken}`).
                send(validTeachersData());

                expect(response.status).toBe(httpStatus.CREATED);
                expect(response.body.success).toBe(true);
                expect(response.body.data.errors).toHaveLength(1);
                expect(response.body.data.createdTeachers).toHaveLength(1);
            });
        });

        describe('Success Cases', () => {
            test('should bulk create teachers successfully', async () => {
                const response = await request(app).
                post('/api/v1/teachers/bulk/create').
                set('Authorization', `Bearer ${adminToken}`).
                send(validTeachersData());

                expect(response.status).toBe(httpStatus.CREATED);
                expect(response.body.success).toBe(true);
                expect(response.body.message).toContain('Bulk teacher creation completed');
                expect(response.body.data).toHaveProperty('createdTeachers');
                expect(response.body.data.createdTeachers).toHaveLength(2);
                expect(response.body.data.createdTeachers[0]).toHaveProperty('id');
                expect(response.body.data.createdTeachers[0]).toHaveProperty('email');
                expect(response.body.data.errors).toHaveLength(0);
                expect(response.body.data).toHaveProperty('summary');
                expect(response.body.data.summary.total).toBe(2);
                expect(response.body.data.summary.created).toBe(2);
                expect(response.body.data.summary.failed).toBe(0);

                const createdTeachers = await Teacher.findAll({
                    where: {
                        email: ['alice.teacher@example.com', 'bob.teacher@example.com']
                    }
                });
                expect(createdTeachers).toHaveLength(2);
            });

            test('should handle single teacher in array', async () => {
                const singleTeacherData = {
                    teachers: [validTeachersData().teachers[0]]
                };

                const response = await request(app).
                post('/api/v1/teachers/bulk/create').
                set('Authorization', `Bearer ${adminToken}`).
                send(singleTeacherData);

                expect(response.status).toBe(httpStatus.CREATED);
                expect(response.body.success).toBe(true);
                expect(response.body.message).toContain('Bulk teacher creation completed');
                expect(response.body.data.createdTeachers).toHaveLength(1);
            });

            test('should handle optional fields correctly', async () => {
                const dataWithOptionals = {
                    ...validTeachersData()
                };
                dataWithOptionals.teachers[0].middleName = 'Marie';
                dataWithOptionals.teachers[0].highestQualification = 'PhD';
                dataWithOptionals.teachers[0].isActive = true;

                const response = await request(app).
                post('/api/v1/teachers/bulk/create').
                set('Authorization', `Bearer ${adminToken}`).
                send(dataWithOptionals);

                expect(response.status).toBe(httpStatus.CREATED);
                expect(response.body.success).toBe(true);
                expect(response.body.data.createdTeachers[0]).toHaveProperty('middleName', 'Marie');
                expect(response.body.data.createdTeachers[0]).toHaveProperty('highestQualification', 'PhD');
            });
        });
    });
});
