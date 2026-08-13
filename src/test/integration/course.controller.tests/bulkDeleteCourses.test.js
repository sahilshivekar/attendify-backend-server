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
import Branch from '../../../db/models/branch.model.js';
import Scheme from '../../../db/models/scheme.model.js';
import Course from '../../../db/models/course.model.js';
import httpStatus from 'http-status';
import {
    v4 as uuidv4
} from 'uuid';

setupTestDb();

describe('Course API - bulkDeleteCourses', () => {
    let adminToken, teacherToken, studentToken;
    let university, branch, scheme;
    let course1, course2, course3;

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

            await Admin.create({
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

            course1 = await Course.create({
                code: 'CS101',
                name: 'Introduction to Computer Science',
                credits: 3,
                schemeId: scheme.id
            });

            course2 = await Course.create({
                code: 'CS102',
                name: 'Data Structures',
                credits: 4,
                schemeId: scheme.id
            });

            course3 = await Course.create({
                code: 'CS103',
                name: 'Algorithms',
                credits: 3,
                schemeId: scheme.id
            });

        } catch (error) {
            console.error('Setup error:', error);
            throw error;
        }
    });

    describe('DELETE /api/v1/courses/bulk/delete', () => {

        describe('Authentication', () => {
            test('should return 401 if no token provided', async () => {
                const response = await request(app).
                delete('/api/v1/courses/bulk/delete').
                send({
                    courseIds: [course1.id, course2.id]
                });

                expect(response.status).toBe(httpStatus.UNAUTHORIZED);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('No token provided');
            });

            test('should return 401 if invalid token provided', async () => {
                const response = await request(app).
                delete('/api/v1/courses/bulk/delete').
                set('Authorization', 'Bearer invalidtoken').
                send({
                    courseIds: [course1.id, course2.id]
                });

                expect(response.status).toBe(httpStatus.UNAUTHORIZED);
                expect(response.body.success).toBe(false);
            });

            test('should return 403 if student tries to bulk delete', async () => {
                const response = await request(app).
                delete('/api/v1/courses/bulk/delete').
                set('Authorization', `Bearer ${studentToken}`).
                send({
                    courseIds: [course1.id, course2.id]
                });

                expect(response.status).toBe(httpStatus.FORBIDDEN);
                expect(response.body.success).toBe(false);
            });

            test('should return 403 if teacher tries to bulk delete', async () => {
                const response = await request(app).
                delete('/api/v1/courses/bulk/delete').
                set('Authorization', `Bearer ${teacherToken}`).
                send({
                    courseIds: [course1.id, course2.id]
                });

                expect(response.status).toBe(httpStatus.FORBIDDEN);
                expect(response.body.success).toBe(false);
            });
        });

        describe('Validation', () => {
            test('should return 400 if courseIds array is missing', async () => {
                const response = await request(app).
                delete('/api/v1/courses/bulk/delete').
                set('Authorization', `Bearer ${adminToken}`).
                send({});

                expect(response.status).toBe(httpStatus.BAD_REQUEST);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Course IDs array is required');
            });

            test('should return 400 if courseIds array is empty', async () => {
                const response = await request(app).
                delete('/api/v1/courses/bulk/delete').
                set('Authorization', `Bearer ${adminToken}`).
                send({
                    courseIds: []
                });

                expect(response.status).toBe(httpStatus.BAD_REQUEST);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('does not contain 1 required value(s)');
            });

            test('should return 400 for very large course ID arrays', async () => {
                const courseIds = Array.from({
                    length: 101
                }, () => uuidv4());

                const response = await request(app).
                delete('/api/v1/courses/bulk/delete').
                set('Authorization', `Bearer ${adminToken}`).
                send({
                    courseIds
                });

                expect(response.status).toBe(httpStatus.BAD_REQUEST);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Cannot delete more than 100 courses at once');
            });

            test('should return 400 if courseId is not a valid UUID', async () => {
                const invalidData = {
                    courseIds: ['invalid-uuid', course2.id]
                };

                const response = await request(app).
                delete('/api/v1/courses/bulk/delete').
                set('Authorization', `Bearer ${adminToken}`).
                send(invalidData);

                expect(response.status).toBe(httpStatus.BAD_REQUEST);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Each course ID must be a valid UUID');
            });
        });

        describe('Business Logic Validation', () => {
            test('should return 404 for non-existent course IDs', async () => {
                const invalidData = {
                    courseIds: [uuidv4(), course2.id]
                };

                const response = await request(app).
                delete('/api/v1/courses/bulk/delete').
                set('Authorization', `Bearer ${adminToken}`).
                send(invalidData);

                expect(response.status).toBe(httpStatus.NOT_FOUND);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Courses not found');
            });

            test('should handle duplicate course IDs in request', async () => {
                const duplicateData = {
                    courseIds: [course1.id, course1.id]
                };

                const response = await request(app).
                delete('/api/v1/courses/bulk/delete').
                set('Authorization', `Bearer ${adminToken}`).
                send(duplicateData);

                expect(response.status).toBe(httpStatus.NOT_FOUND);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Courses not found');
            });

            test('should return 404 for already deleted course IDs', async () => {

                await Course.destroy({
                    where: {
                        id: course1.id
                    }
                });

                const response = await request(app).
                delete('/api/v1/courses/bulk/delete').
                set('Authorization', `Bearer ${adminToken}`).
                send({
                    courseIds: [course1.id, course2.id]
                });

                expect(response.status).toBe(httpStatus.NOT_FOUND);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Courses not found');
            });
        });

        describe('Success Cases', () => {
            test('should bulk delete courses successfully', async () => {
                const response = await request(app).
                delete('/api/v1/courses/bulk/delete').
                set('Authorization', `Bearer ${adminToken}`).
                send({
                    courseIds: [course1.id, course2.id]
                });

                expect(response.status).toBe(httpStatus.OK);
                expect(response.body.success).toBe(true);
                expect(response.body.message).toContain('courses deleted successfully');
                expect(response.body.data.deletedCount).toBe(2);

                const remainingCourses = await Course.findAll({
                    where: {
                        id: [course1.id, course2.id]
                    }
                });
                expect(remainingCourses).toHaveLength(0);

                const course3Still = await Course.findByPk(course3.id);
                expect(course3Still).toBeTruthy();
            });

            test('should handle single course deletion', async () => {
                const singleDeleteData = {
                    courseIds: [course1.id]
                };

                const response = await request(app).
                delete('/api/v1/courses/bulk/delete').
                set('Authorization', `Bearer ${adminToken}`).
                send(singleDeleteData);

                expect(response.status).toBe(httpStatus.OK);
                expect(response.body.success).toBe(true);
                expect(response.body.message).toContain('courses deleted successfully');
                expect(response.body.data.deletedCount).toBe(1);

                const deletedCourse = await Course.findByPk(course1.id);
                expect(deletedCourse).toBeNull();

                const existingCourse = await Course.findByPk(course2.id);
                expect(existingCourse).toBeTruthy();
            });
        });
    });
});
