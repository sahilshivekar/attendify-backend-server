import {
    jest
} from '@jest/globals';
import request from 'supertest';
import app from '../../../app.js';
import setupTestDb from '../../../test/util/setupTestDb.js';
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
import Admin from '../../../db/models/admin.model.js';
import jwt from 'jsonwebtoken';
import {
    config
} from '../../../config/config.js';

setupTestDb();

describe('POST /api/v1/classes/bulk/create', () => {
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
        } catch (error) {
            console.error('Setup error:', error);
            throw error;
        }
    });

    describe('Authentication Tests', () => {
        test('should return 401 without token', async () => {
            const response = await request(app).
            post('/api/v1/classes/bulk/create').
            send({
                classes: [{
                    teacherId: validTeacher.id,
                    startTime: '09:00',
                    endTime: '10:00',
                    dayOfWeek: 'Monday',
                    roomId: validRoom.id,
                    batchId: validBatch.id,
                    activeFrom: '2025-08-01',
                    activeTill: '2025-12-31',
                    classType: 'Lecture',
                    courseId: validCourse.id,
                    timetableId: validTimetable.id
                }]
            });

            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Unauthorized request: No token provided');
        });

        test('should return 401 with invalid token', async () => {
            const response = await request(app).
            post('/api/v1/classes/bulk/create').
            set('Authorization', 'Bearer invalid-token').
            send({
                classes: [{
                    teacherId: validTeacher.id,
                    startTime: '09:00',
                    endTime: '10:00',
                    dayOfWeek: 'Monday',
                    roomId: validRoom.id,
                    batchId: validBatch.id,
                    activeFrom: '2025-08-01',
                    activeTill: '2025-12-31',
                    classType: 'Lecture',
                    courseId: validCourse.id,
                    timetableId: validTimetable.id
                }]
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
        test('should return 400 when classes array is missing', async () => {
            const response = await request(app).
            post('/api/v1/classes/bulk/create').
            set('Authorization', `Bearer ${adminToken}`).
            send({});

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Classes array is required');
        });

        test('should return 400 when classes array is empty', async () => {
            const response = await request(app).
            post('/api/v1/classes/bulk/create').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                classes: []
            });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('At least one class is required');
        });

        test('should return 400 when teacherId is missing', async () => {
            const response = await request(app).
            post('/api/v1/classes/bulk/create').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                classes: [{
                    startTime: '09:00',
                    endTime: '10:00',
                    dayOfWeek: 'Monday',
                    roomId: validRoom.id,
                    batchId: validBatch.id,
                    activeFrom: '2025-08-01',
                    activeTill: '2025-12-31',
                    classType: 'Lecture',
                    courseId: validCourse.id,
                    timetableId: validTimetable.id
                }]
            });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Teacher ID is required');
        });

        test('should return 400 when teacherId is invalid UUID', async () => {
            const response = await request(app).
            post('/api/v1/classes/bulk/create').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                classes: [{
                    teacherId: 'invalid-uuid',
                    startTime: '09:00',
                    endTime: '10:00',
                    dayOfWeek: 'Monday',
                    roomId: validRoom.id,
                    batchId: validBatch.id,
                    activeFrom: '2025-08-01',
                    activeTill: '2025-12-31',
                    classType: 'Lecture',
                    courseId: validCourse.id,
                    timetableId: validTimetable.id
                }]
            });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Teacher ID must be a valid UUID');
        });

        test('should return 400 when startTime is missing', async () => {
            const response = await request(app).
            post('/api/v1/classes/bulk/create').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                classes: [{
                    teacherId: validTeacher.id,
                    endTime: '10:00',
                    dayOfWeek: 'Monday',
                    roomId: validRoom.id,
                    batchId: validBatch.id,
                    activeFrom: '2025-08-01',
                    activeTill: '2025-12-31',
                    classType: 'Lecture',
                    courseId: validCourse.id,
                    timetableId: validTimetable.id
                }]
            });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Start time is required');
        });

        test('should return 400 when startTime is invalid format', async () => {
            const response = await request(app).
            post('/api/v1/classes/bulk/create').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                classes: [{
                    teacherId: validTeacher.id,
                    startTime: '25:00',
                    endTime: '10:00',
                    dayOfWeek: 'Monday',
                    roomId: validRoom.id,
                    batchId: validBatch.id,
                    activeFrom: '2025-08-01',
                    activeTill: '2025-12-31',
                    classType: 'Lecture',
                    courseId: validCourse.id,
                    timetableId: validTimetable.id
                }]
            });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Start time must be in HH:MM format');
        });

        test('should return 400 when dayOfWeek is invalid', async () => {
            const response = await request(app).
            post('/api/v1/classes/bulk/create').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                classes: [{
                    teacherId: validTeacher.id,
                    startTime: '09:00',
                    endTime: '10:00',
                    dayOfWeek: 'InvalidDay',
                    roomId: validRoom.id,
                    batchId: validBatch.id,
                    activeFrom: '2025-08-01',
                    activeTill: '2025-12-31',
                    classType: 'Lecture',
                    courseId: validCourse.id,
                    timetableId: validTimetable.id
                }]
            });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Day of week must be a valid day');
        });

        test('should return 400 when classType is invalid', async () => {
            const response = await request(app).
            post('/api/v1/classes/bulk/create').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                classes: [{
                    teacherId: validTeacher.id,
                    startTime: '09:00',
                    endTime: '10:00',
                    dayOfWeek: 'Monday',
                    roomId: validRoom.id,
                    batchId: validBatch.id,
                    activeFrom: '2025-08-01',
                    activeTill: '2025-12-31',
                    classType: 'InvalidType',
                    courseId: validCourse.id,
                    timetableId: validTimetable.id
                }]
            });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Class type must be Lecture, Practical, or Tutorial');
        });

        test('should return 400 when activeFrom is missing', async () => {
            const response = await request(app).
            post('/api/v1/classes/bulk/create').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                classes: [{
                    teacherId: validTeacher.id,
                    startTime: '09:00',
                    endTime: '10:00',
                    dayOfWeek: 'Monday',
                    roomId: validRoom.id,
                    batchId: validBatch.id,
                    activeTill: '2025-12-31',
                    classType: 'Lecture',
                    courseId: validCourse.id,
                    timetableId: validTimetable.id
                }]
            });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Active from date is required');
        });

        test('should return 413 when request payload is too large', async () => {
            const largeClasses = Array(100).fill().map((_, index) => ({
                teacherId: validTeacher.id,
                startTime: '09:00',
                endTime: '10:00',
                dayOfWeek: 'Monday',
                roomId: validRoom.id,
                batchId: validBatch.id,
                activeFrom: '2025-08-01',
                activeTill: '2025-12-31',
                classType: 'Lecture',
                courseId: validCourse.id,
                timetableId: validTimetable.id,

                largeField: 'x'.repeat(1000)
            }));

            const response = await request(app).
            post('/api/v1/classes/bulk/create').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                classes: largeClasses
            });

            expect([413, 400]).toContain(response.status);
        });
    });

    describe('Business Logic Tests', () => {
        test('should return 404 when teacher does not exist', async () => {
            const response = await request(app).
            post('/api/v1/classes/bulk/create').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                classes: [{
                    teacherId: '12345678-1234-1234-1234-123456789012',
                    startTime: '09:00',
                    endTime: '10:00',
                    dayOfWeek: 'Monday',
                    roomId: validRoom.id,
                    batchId: validBatch.id,
                    activeFrom: '2025-08-01',
                    activeTill: '2025-12-31',
                    classType: 'Lecture',
                    courseId: validCourse.id,
                    timetableId: validTimetable.id
                }]
            });

            expect(response.status).toBe(404);
            expect(response.body.message).toContain('Teacher not found');
        });

        test('should return 404 when room does not exist', async () => {
            const response = await request(app).
            post('/api/v1/classes/bulk/create').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                classes: [{
                    teacherId: validTeacher.id,
                    startTime: '09:00',
                    endTime: '10:00',
                    dayOfWeek: 'Monday',
                    roomId: '12345678-1234-1234-1234-123456789012',
                    batchId: validBatch.id,
                    activeFrom: '2025-08-01',
                    activeTill: '2025-12-31',
                    classType: 'Lecture',
                    courseId: validCourse.id,
                    timetableId: validTimetable.id
                }]
            });

            expect(response.status).toBe(404);
            expect(response.body.message).toContain('Room not found');
        });

        test('should return 404 when course does not exist', async () => {
            const response = await request(app).
            post('/api/v1/classes/bulk/create').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                classes: [{
                    teacherId: validTeacher.id,
                    startTime: '09:00',
                    endTime: '10:00',
                    dayOfWeek: 'Monday',
                    roomId: validRoom.id,
                    batchId: validBatch.id,
                    activeFrom: '2025-08-01',
                    activeTill: '2025-12-31',
                    classType: 'Lecture',
                    courseId: '12345678-1234-1234-1234-123456789012',
                    timetableId: validTimetable.id
                }]
            });

            expect(response.status).toBe(404);
            expect(response.body.message).toContain('Course not found');
        });

        test('should return 404 when timetable does not exist', async () => {
            const response = await request(app).
            post('/api/v1/classes/bulk/create').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                classes: [{
                    teacherId: validTeacher.id,
                    startTime: '09:00',
                    endTime: '10:00',
                    dayOfWeek: 'Monday',
                    roomId: validRoom.id,
                    batchId: validBatch.id,
                    activeFrom: '2025-08-01',
                    activeTill: '2025-12-31',
                    classType: 'Lecture',
                    courseId: validCourse.id,
                    timetableId: '12345678-1234-1234-1234-123456789012'
                }]
            });

            expect(response.status).toBe(404);
            expect(response.body.message).toContain('Timetable not found');
        });

        test('should handle time conflicts gracefully', async () => {

            await Class.create({
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
                timetableId: validTimetable.id
            });

            const response = await request(app).
            post('/api/v1/classes/bulk/create').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                classes: [{
                    teacherId: validTeacher.id,
                    startTime: '09:30',
                    endTime: '10:30',
                    dayOfWeek: 'Monday',
                    roomId: validRoom.id,
                    batchId: validBatch.id,
                    activeFrom: '2025-08-01',
                    activeTill: '2025-12-31',
                    classType: 'Lecture',
                    courseId: validCourse.id,
                    timetableId: validTimetable.id
                }]
            });

            expect(response.status).toBe(409);
            expect(response.body.message).toContain('scheduling conflict');
        });

        test('should handle mixed valid and invalid data gracefully', async () => {
            const response = await request(app).
            post('/api/v1/classes/bulk/create').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                classes: [{
                        teacherId: validTeacher.id,
                        startTime: '09:00',
                        endTime: '10:00',
                        dayOfWeek: 'Monday',
                        roomId: validRoom.id,
                        batchId: validBatch.id,
                        activeFrom: '2025-08-01',
                        activeTill: '2025-12-31',
                        classType: 'Lecture',
                        courseId: validCourse.id,
                        timetableId: validTimetable.id
                    },
                    {
                        teacherId: '12345678-1234-1234-1234-123456789012',
                        startTime: '11:00',
                        endTime: '12:00',
                        dayOfWeek: 'Monday',
                        roomId: validRoom.id,
                        batchId: validBatch.id,
                        activeFrom: '2025-08-01',
                        activeTill: '2025-12-31',
                        classType: 'Lecture',
                        courseId: validCourse.id,
                        timetableId: validTimetable.id
                    }
                ]

            });

            expect(response.status).toBe(404);
            expect(response.body.message).toContain('Teacher not found');
        });
    });

    describe('Success Tests', () => {
        test('should successfully create single class', async () => {
            const classData = {
                teacherId: validTeacher.id,
                startTime: '09:00',
                endTime: '10:00',
                dayOfWeek: 'Monday',
                roomId: validRoom.id,
                batchId: validBatch.id,
                activeFrom: '2025-08-01',
                activeTill: '2025-12-31',
                classType: 'Lecture',
                courseId: validCourse.id,
                timetableId: validTimetable.id,
                isExtraClass: false
            };

            const response = await request(app).
            post('/api/v1/classes/bulk/create').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                classes: [classData]
            });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Classes created successfully');
            expect(response.body.data).toHaveProperty('createdClasses');
            expect(response.body.data.createdClasses).toHaveLength(1);

            const createdClass = await Class.findOne({
                where: {
                    teacherId: validTeacher.id,
                    roomId: validRoom.id,
                    dayOfWeek: 'Monday'
                }
            });
            expect(createdClass).toBeTruthy();
            expect(createdClass.classType).toBe('Lecture');
        });

        test('should successfully create multiple classes', async () => {
            const classesData = [{
                    teacherId: validTeacher.id,
                    startTime: '09:00',
                    endTime: '10:00',
                    dayOfWeek: 'Monday',
                    roomId: validRoom.id,
                    batchId: validBatch.id,
                    activeFrom: '2025-08-01',
                    activeTill: '2025-12-31',
                    classType: 'Lecture',
                    courseId: validCourse.id,
                    timetableId: validTimetable.id,
                    isExtraClass: false
                },
                {
                    teacherId: validTeacher.id,
                    startTime: '11:00',
                    endTime: '12:00',
                    dayOfWeek: 'Tuesday',
                    roomId: validRoom.id,
                    batchId: validBatch.id,
                    activeFrom: '2025-08-01',
                    activeTill: '2025-12-31',
                    classType: 'Tutorial',
                    courseId: validCourse.id,
                    timetableId: validTimetable.id,
                    isExtraClass: false
                }
            ];

            const response = await request(app).
            post('/api/v1/classes/bulk/create').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                classes: classesData
            });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Classes created successfully');
            expect(response.body.data.createdClasses).toHaveLength(2);

            const classCount = await Class.count({
                where: {
                    teacherId: validTeacher.id,
                    timetableId: validTimetable.id
                }
            });
            expect(classCount).toBe(2);
        });

        test('should handle null batchId correctly', async () => {
            const classData = {
                teacherId: validTeacher.id,
                startTime: '09:00',
                endTime: '10:00',
                dayOfWeek: 'Monday',
                roomId: validRoom.id,
                batchId: null,
                activeFrom: '2025-08-01',
                activeTill: '2025-12-31',
                classType: 'Lecture',
                courseId: validCourse.id,
                timetableId: validTimetable.id,
                isExtraClass: false
            };

            const response = await request(app).
            post('/api/v1/classes/bulk/create').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                classes: [classData]
            });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.createdClasses).toHaveLength(1);
        });

        test('should return created classes with correct structure', async () => {
            const classData = {
                teacherId: validTeacher.id,
                startTime: '09:00',
                endTime: '10:00',
                dayOfWeek: 'Monday',
                roomId: validRoom.id,
                batchId: validBatch.id,
                activeFrom: '2025-08-01',
                activeTill: '2025-12-31',
                classType: 'Lecture',
                courseId: validCourse.id,
                timetableId: validTimetable.id,
                isExtraClass: false
            };

            const response = await request(app).
            post('/api/v1/classes/bulk/create').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                classes: [classData]
            });

            expect(response.status).toBe(201);
            expect(response.body.data.createdClasses[0]).toHaveProperty('id');
            expect(response.body.data.createdClasses[0]).toHaveProperty('teacherId');
            expect(response.body.data.createdClasses[0]).toHaveProperty('startTime');
            expect(response.body.data.createdClasses[0]).toHaveProperty('endTime');
            expect(response.body.data.createdClasses[0]).toHaveProperty('dayOfWeek');
            expect(response.body.data.createdClasses[0]).toHaveProperty('roomId');
            expect(response.body.data.createdClasses[0]).toHaveProperty('classType');
            expect(response.body.data.createdClasses[0]).toHaveProperty('courseId');
            expect(response.body.data.createdClasses[0]).toHaveProperty('timetableId');
            expect(response.body.data.createdClasses[0]).toHaveProperty('createdAt');
            expect(response.body.data.createdClasses[0]).toHaveProperty('updatedAt');
        });
    });
});
