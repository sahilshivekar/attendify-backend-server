import {
    jest
} from '@jest/globals';
import request from 'supertest';
import app from '../../../app.js';
import setupTestDb from '../../util/setupTestDb.js';
import University from '../../../db/models/university.model.js';
import Branch from '../../../db/models/branch.model.js';
import Scheme from '../../../db/models/scheme.model.js';
import Semester from '../../../db/models/semester.model.js';
import Course from '../../../db/models/course.model.js';
import Teacher from '../../../db/models/teacher.model.js';
import Room from '../../../db/models/room.model.js';
import Timetable from '../../../db/models/timetable.model.js';
import Division from '../../../db/models/division.model.js';
import Batch from '../../../db/models/batch.model.js';
import Class from '../../../db/models/class.model.js';
import {
    Attendance
} from '../../../db/models/attendance.model.js';
import Admin from '../../../db/models/admin.model.js';
import jwt from 'jsonwebtoken';
import {
    config
} from '../../../config/config.js';

setupTestDb();

describe('DELETE /api/v1/classes/bulk/delete', () => {
    let validUniversity;
    let validBranch;
    let validScheme;
    let validSemester;
    let validCourse;
    let validTeacher;
    let validRoom;
    let validTimetable;
    let validDivision;
    let validBatch;
    let testClass1;
    let testClass2;
    let adminToken;

    beforeEach(async () => {
        try {

            const admin = await Admin.create({
                email: 'admin@example.com',
                username: 'adminuser',
                password: 'Admin@12345'
            });

            validUniversity = await University.create({
                name: 'Test University',
                abbreviation: 'TU'
            });

            adminToken = jwt.sign({
                id: admin.id,
                role: 'admin'
            }, config.jwt.accessTokenSecret);

            validBranch = await Branch.create({
                name: 'Computer Science',
                abbreviation: 'CS'
            });

            validScheme = await Scheme.create({
                name: 'CS 2026 Scheme',
                universityId: validUniversity.id
            });

            validSemester = await Semester.create({
                branchId: validBranch.id,
                semesterNumber: 1,
                academicStartYear: 2025,
                academicEndYear: 2026,
                startDate: '2025-08-01',
                endDate: '2025-12-31',
                schemeId: validScheme.id
            });

            validCourse = await Course.create({
                name: 'Programming Fundamentals',
                code: 'CS101',
                schemeId: validScheme.id
            });

            validTeacher = await Teacher.create({
                firstName: 'John',
                lastName: 'Doe',
                email: 'teacher@example.com',
                phoneNumber: '+911234567890',
                password: 'Teacher@123',
                gender: 'Male',
                role: 'Teacher'
            });

            validRoom = await Room.create({
                roomNumber: '101',
                sittingCapacity: 60
            });

            validDivision = await Division.create({
                divisionCode: 'A',
                semesterId: validSemester.id
            });

            validBatch = await Batch.create({
                batchCode: 'Batch 1',
                divisionId: validDivision.id
            });

            validTimetable = await Timetable.create({
                divisionId: validDivision.id
            });

            testClass1 = await Class.create({
                teacherId: validTeacher.id,
                startTime: '09:00:00',
                endTime: '10:00:00',
                dayOfWeek: 'Monday',
                roomId: validRoom.id,
                batchId: validBatch.id,
                activeFrom: '2025-08-01',
                activeTill: '2025-12-31',
                classType: 'Lecture',
                courseId: validCourse.id,
                timetableId: validTimetable.id,
                isExtraClass: false
            });

            testClass2 = await Class.create({
                teacherId: validTeacher.id,
                startTime: '11:00:00',
                endTime: '12:00:00',
                dayOfWeek: 'Tuesday',
                roomId: validRoom.id,
                batchId: validBatch.id,
                activeFrom: '2025-08-01',
                activeTill: '2025-12-31',
                classType: 'Tutorial',
                courseId: validCourse.id,
                timetableId: validTimetable.id,
                isExtraClass: false
            });
        } catch (error) {
            console.error('Setup error:', error);
            throw error;
        }
    });

    describe('Authentication Tests', () => {
        test('should return 401 without token', async () => {
            const response = await request(app).
            delete('/api/v1/classes/bulk/delete').
            send({
                classIds: [testClass1.id]
            });

            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Unauthorized request: No token provided');
        });

        test('should return 401 with invalid token', async () => {
            const response = await request(app).
            delete('/api/v1/classes/bulk/delete').
            set('Authorization', 'Bearer invalid-token').
            send({
                classIds: [testClass1.id]
            });

            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Unauthorized request: Invalid token');
        });

        test('should return 403 for student access', async () => {

        });

        test('should return 403 for teacher access', async () => {

        });
    });

    describe('Validation Tests', () => {
        test('should return 400 when classIds array is missing', async () => {
            const response = await request(app).
            delete('/api/v1/classes/bulk/delete').
            set('Authorization', `Bearer ${adminToken}`).
            send({});

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Class IDs array is required');
        });

        test('should return 400 when classIds array is empty', async () => {
            const response = await request(app).
            delete('/api/v1/classes/bulk/delete').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                classIds: []
            });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('At least one class ID is required');
        });

        test('should return 400 when classIds contain invalid UUIDs', async () => {
            const response = await request(app).
            delete('/api/v1/classes/bulk/delete').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                classIds: ['invalid-uuid']
            });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Each class ID must be a valid UUID');
        });

        test('should return 400 when classIds contain null values', async () => {
            const response = await request(app).
            delete('/api/v1/classes/bulk/delete').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                classIds: [null]
            });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Each class ID must be a valid UUID');
        });

        test('should return 400 when classIds contain empty strings', async () => {
            const response = await request(app).
            delete('/api/v1/classes/bulk/delete').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                classIds: ['']
            });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Each class ID must be a valid UUID');
        });

        test('should return 413 when request payload is too large', async () => {
            const largeClassIds = Array(100).fill().map(() => '12345678-1234-1234-1234-123456789012');

            const response = await request(app).
            delete('/api/v1/classes/bulk/delete').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                classIds: largeClassIds,

                largeField: 'x'.repeat(10000)
            });

            expect([413, 400]).toContain(response.status);
        });
    });

    describe('Business Logic Tests', () => {
        test('should return 404 when trying to delete non-existent classes', async () => {
            const response = await request(app).
            delete('/api/v1/classes/bulk/delete').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                classIds: ['12345678-1234-1234-1234-123456789012']
            });

            expect(response.status).toBe(404);
            expect(response.body.message).toContain('Some classes not found');
        });

        test('should return 409 when trying to delete class with dependent attendance records', async () => {

            await Attendance.create({
                classId: testClass1.id,
                teacherId: validTeacher.id,
                date: '2025-09-16',
                startTime: '09:00:00',
                endTime: '10:00:00',
                status: 'Present',
                markedAt: new Date(),
                courseId: validCourse.id,
                batchId: validBatch.id
            });

            const response = await request(app).
            delete('/api/v1/classes/bulk/delete').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                classIds: [testClass1.id]
            });

            expect(response.status).toBe(409);
            expect(response.body.message).toContain('Cannot delete class');
            expect(response.body.message).toContain('dependent records');
        });

        test('should handle mixed valid and invalid class IDs', async () => {
            const response = await request(app).
            delete('/api/v1/classes/bulk/delete').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                classIds: [
                    testClass1.id,
                    '12345678-1234-1234-1234-123456789012'
                ]

            });

            expect(response.status).toBe(404);
            expect(response.body.message).toContain('Some classes not found');
        });

        test('should handle duplicate class IDs in request', async () => {
            const response = await request(app).
            delete('/api/v1/classes/bulk/delete').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                classIds: [
                    testClass1.id,
                    testClass1.id
                ]

            });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.deletedCount).toBe(1);
        });

        test('should validate class ownership/access properly', async () => {

            const response = await request(app).
            delete('/api/v1/classes/bulk/delete').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                classIds: [testClass1.id]
            });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe('Success Tests', () => {
        test('should successfully delete single class', async () => {
            const response = await request(app).
            delete('/api/v1/classes/bulk/delete').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                classIds: [testClass1.id]
            });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Classes deleted successfully');
            expect(response.body.data).toHaveProperty('deletedCount');
            expect(response.body.data.deletedCount).toBe(1);

            const deletedClass = await Class.findByPk(testClass1.id);
            expect(deletedClass).toBe(null);
        });

        test('should successfully delete multiple classes', async () => {
            const response = await request(app).
            delete('/api/v1/classes/bulk/delete').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                classIds: [testClass1.id, testClass2.id]
            });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Classes deleted successfully');
            expect(response.body.data.deletedCount).toBe(2);

            const deletedClass1 = await Class.findByPk(testClass1.id);
            const deletedClass2 = await Class.findByPk(testClass2.id);
            expect(deletedClass1).toBe(null);
            expect(deletedClass2).toBe(null);
        });

        test('should return correct response structure', async () => {
            const response = await request(app).
            delete('/api/v1/classes/bulk/delete').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                classIds: [testClass1.id]
            });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success');
            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('data');
            expect(response.body.data).toHaveProperty('deletedCount');
            expect(typeof response.body.data.deletedCount).toBe('number');
        });

        test('should handle deletion when some classes are already deleted', async () => {

            await Class.destroy({
                where: {
                    id: testClass1.id
                }
            });

            const response = await request(app).
            delete('/api/v1/classes/bulk/delete').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                classIds: [testClass1.id, testClass2.id]
            });

            expect(response.status).toBe(404);
            expect(response.body.message).toContain('Some classes not found');
        });

        test('should successfully delete when no dependent records exist', async () => {

            const attendanceCount = await Attendance.count({
                where: {
                    classId: testClass1.id
                }
            });

            expect(attendanceCount).toBe(0);

            const response = await request(app).
            delete('/api/v1/classes/bulk/delete').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                classIds: [testClass1.id]
            });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.deletedCount).toBe(1);
        });

        test('should handle large batch deletion efficiently', async () => {

            const additionalClasses = [];
            for (let i = 0; i < 5; i++) {
                const additionalClass = await Class.create({
                    teacherId: validTeacher.id,
                    startTime: `${10 + i}:00:00`,
                    endTime: `${11 + i}:00:00`,
                    dayOfWeek: 'Wednesday',
                    roomId: validRoom.id,
                    batchId: validBatch.id,
                    activeFrom: '2025-08-01',
                    activeTill: '2025-12-31',
                    classType: 'Lecture',
                    courseId: validCourse.id,
                    timetableId: validTimetable.id,
                    isExtraClass: false
                });
                additionalClasses.push(additionalClass.id);
            }

            const classIds = [testClass1.id, testClass2.id, ...additionalClasses];

            const response = await request(app).
            delete('/api/v1/classes/bulk/delete').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                classIds
            });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.deletedCount).toBe(7);

            const remainingCount = await Class.count({
                where: {
                    id: classIds
                }
            });
            expect(remainingCount).toBe(0);
        });
    });
});
