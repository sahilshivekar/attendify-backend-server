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
import jwt from 'jsonwebtoken';
import {
    config
} from '../../../config/config.js';

setupTestDb();

describe('PUT /api/v1/attendances/bulk/update', () => {
    let validUniversity;
    let validBranch;
    let validScheme;
    let validSemester;
    let validDivision;
    let validBatch;
    let validCourse;
    let validRoom;
    let validTimetable;
    let validClass;
    let validTeacher;
    let validStudent1;
    let validStudent2;
    let validStudent3;
    let testAttendance1;
    let testAttendance2;
    let testAttendanceStudent1;
    let testAttendanceStudent2;
    let testAttendanceStudent3;
    let adminToken;

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

            validUniversity = await University.create({
                name: 'Test University',
                abbreviation: 'TU'
            });

            validBranch = await Branch.create({
                name: 'Computer Science',
                abbreviation: 'CS'
            });

            validScheme = await Scheme.create({
                name: 'CS 2026 Scheme',
                universityId: validUniversity.id
            });

            validSemester = await Semester.create({
                semesterNumber: 1,
                branchId: validBranch.id,
                academicStartYear: 2025,
                academicEndYear: 2026,
                startDate: '2025-08-01',
                endDate: '2025-12-31',
                schemeId: validScheme.id
            });

            validDivision = await Division.create({
                divisionCode: 'A',
                semesterId: validSemester.id
            });

            validBatch = await Batch.create({
                batchCode: 'Batch 1',
                divisionId: validDivision.id
            });

            validCourse = await Course.create({
                name: 'Data Structures',
                code: 'CS101',
                credits: 4,
                courseType: 'Theory',
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
                roomNumber: 'TR101',
                sittingCapacity: 60
            });

            validTimetable = await Timetable.create({
                divisionId: validDivision.id,
                timetableVersion: 1
            });

            validClass = await Class.create({
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

            validStudent1 = await Student.create({
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'student1@example.com',
                phoneNumber: '+919876543210',
                prn: 'STU001',
                password: 'Student@123',
                schemeId: validScheme.id,
                branchId: validBranch.id,
                admissionYear: 2025,
                admissionType: 'FE',
                gender: 'Male'
            });

            validStudent2 = await Student.create({
                firstName: 'Bob',
                lastName: 'Johnson',
                email: 'student2@example.com',
                phoneNumber: '+919876543211',
                prn: 'STU002',
                password: 'Student@123',
                schemeId: validScheme.id,
                branchId: validBranch.id,
                admissionYear: 2025,
                admissionType: 'FE',
                gender: 'Male'
            });

            validStudent3 = await Student.create({
                firstName: 'Alice',
                lastName: 'Brown',
                email: 'student3@example.com',
                phoneNumber: '+919876543212',
                prn: 'STU003',
                password: 'Student@123',
                schemeId: validScheme.id,
                branchId: validBranch.id,
                admissionYear: 2025,
                admissionType: 'FE',
                gender: 'Male'
            });

            await StudentSemester.create({
                studentId: validStudent1.id,
                semesterId: validSemester.id
            });
            await StudentSemester.create({
                studentId: validStudent2.id,
                semesterId: validSemester.id
            });
            await StudentSemester.create({
                studentId: validStudent3.id,
                semesterId: validSemester.id
            });

            await StudentDivision.create({
                studentId: validStudent1.id,
                divisionId: validDivision.id,
                startDate: '2025-08-01'
            });
            await StudentDivision.create({
                studentId: validStudent2.id,
                divisionId: validDivision.id,
                startDate: '2025-08-01'
            });
            await StudentDivision.create({
                studentId: validStudent3.id,
                divisionId: validDivision.id,
                startDate: '2025-08-01'
            });

            await StudentBatch.create({
                studentId: validStudent1.id,
                batchId: validBatch.id,
                startDate: '2025-08-01'
            });
            await StudentBatch.create({
                studentId: validStudent2.id,
                batchId: validBatch.id,
                startDate: '2025-08-01'
            });
            await StudentBatch.create({
                studentId: validStudent3.id,
                batchId: validBatch.id,
                startDate: '2025-08-01'
            });

            testAttendance1 = await Attendance.create({
                classId: validClass.id,
                date: '2025-09-16'
            });

            testAttendance2 = await Attendance.create({
                classId: validClass.id,
                date: '2025-09-17'
            });

            testAttendanceStudent1 = await AttendanceStudent.create({
                attendanceId: testAttendance1.id,
                studentId: validStudent1.id,
                attendanceStatus: true
            });

            testAttendanceStudent2 = await AttendanceStudent.create({
                attendanceId: testAttendance1.id,
                studentId: validStudent2.id,
                attendanceStatus: false
            });

            testAttendanceStudent3 = await AttendanceStudent.create({
                attendanceId: testAttendance2.id,
                studentId: validStudent3.id,
                attendanceStatus: true
            });
        } catch (error) {
            console.error('Setup error:', error);
            throw error;
        }
    });

    describe('Authentication Tests', () => {
        test('should return 401 without token', async () => {
            const response = await request(app).
            put('/api/v1/attendances/bulk/update').
            send({
                attendanceUpdates: [{
                    attendanceId: testAttendance1.id,
                    studentId: validStudent1.id,
                    newAttendanceStatus: false
                }]
            });

            expect(response.status).toBe(401);
            expect(response.body.message).toContain('Unauthorized request: No token provided');
        });

        test('should return 401 with invalid token', async () => {
            const response = await request(app).
            put('/api/v1/attendances/bulk/update').
            set('Authorization', 'Bearer invalid-token').
            send({
                attendanceUpdates: [{
                    attendanceId: testAttendance1.id,
                    studentId: validStudent1.id,
                    newAttendanceStatus: false
                }]
            });

            expect(response.status).toBe(401);
            expect(response.body.message).toContain('Invalid token');
        });

        test('should return 403 for student access', async () => {

        });

        test('should return 403 for teacher access', async () => {

        });
    });

    describe('Validation Tests', () => {
        test('should return 400 when attendanceUpdates array is missing', async () => {
            const response = await request(app).
            put('/api/v1/attendances/bulk/update').
            set('Authorization', `Bearer ${adminToken}`).
            send({});

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Attendance updates array is required');
        });

        test('should return 400 when attendanceUpdates array is empty', async () => {
            const response = await request(app).
            put('/api/v1/attendances/bulk/update').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                attendanceUpdates: []
            });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('At least 1 attendance update is required');
        });

        test('should return 400 when attendanceUpdates array exceeds maximum limit', async () => {
            const attendanceUpdates = Array(201).fill().map(() => ({
                attendanceId: testAttendance1.id,
                studentId: validStudent1.id,
                newAttendanceStatus: false
            }));

            const response = await request(app).
            put('/api/v1/attendances/bulk/update').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                attendanceUpdates
            });

            expect(response.status).toBe(413);
            expect(response.body.message).toContain('request entity too large');
        });

        test('should return 400 when attendanceId is missing', async () => {
            const response = await request(app).
            put('/api/v1/attendances/bulk/update').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                attendanceUpdates: [{
                    studentId: validStudent1.id,
                    newAttendanceStatus: false
                }]
            });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Attendance ID is required');
        });

        test('should return 400 when attendanceId is invalid UUID', async () => {
            const response = await request(app).
            put('/api/v1/attendances/bulk/update').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                attendanceUpdates: [{
                    attendanceId: 'invalid-uuid',
                    studentId: validStudent1.id,
                    newAttendanceStatus: false
                }]
            });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Attendance ID must be a valid UUID');
        });

        test('should return 400 when studentId is missing', async () => {
            const response = await request(app).
            put('/api/v1/attendances/bulk/update').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                attendanceUpdates: [{
                    attendanceId: testAttendance1.id,
                    newAttendanceStatus: false
                }]
            });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Student ID is required');
        });

        test('should return 400 when studentId is invalid UUID', async () => {
            const response = await request(app).
            put('/api/v1/attendances/bulk/update').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                attendanceUpdates: [{
                    attendanceId: testAttendance1.id,
                    studentId: 'invalid-uuid',
                    newAttendanceStatus: false
                }]
            });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Student ID must be a valid UUID');
        });

        test('should return 400 when newAttendanceStatus is missing', async () => {
            const response = await request(app).
            put('/api/v1/attendances/bulk/update').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                attendanceUpdates: [{
                    attendanceId: testAttendance1.id,
                    studentId: validStudent1.id
                }]
            });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('New attendance status is required');
        });

        test('should return 400 when newAttendanceStatus is not boolean', async () => {
            const response = await request(app).
            put('/api/v1/attendances/bulk/update').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                attendanceUpdates: [{
                    attendanceId: testAttendance1.id,
                    studentId: validStudent1.id,
                    newAttendanceStatus: 'invalid'
                }]
            });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('New attendance status must be a boolean');
        });

        test('should return 413 when request payload is too large', async () => {
            const largeAttendanceUpdates = Array(100).fill().map(() => ({
                attendanceId: testAttendance1.id,
                studentId: validStudent1.id,
                newAttendanceStatus: false,

                largeField: 'x'.repeat(1000)
            }));

            const response = await request(app).
            put('/api/v1/attendances/bulk/update').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                attendanceUpdates: largeAttendanceUpdates,
                largeField: 'x'.repeat(10000)
            });

            expect([413, 400]).toContain(response.status);
        });
    });

    describe('Business Logic Tests', () => {
        test('should return 404 when attendance record does not exist', async () => {
            const response = await request(app).
            put('/api/v1/attendances/bulk/update').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                attendanceUpdates: [{
                    attendanceId: '12345678-1234-1234-1234-123456789012',
                    studentId: validStudent1.id,
                    newAttendanceStatus: false
                }]
            });

            expect(response.status).toBe(404);
            expect(response.body.message).toContain('Attendance records not found');
        });

        test('should return 404 when student does not exist', async () => {
            const response = await request(app).
            put('/api/v1/attendances/bulk/update').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                attendanceUpdates: [{
                    attendanceId: testAttendance1.id,
                    studentId: '12345678-1234-1234-1234-123456789012',
                    newAttendanceStatus: false
                }]
            });

            expect(response.status).toBe(404);
            expect(response.body.message).toContain('Students not found');
        });

        test('should return 404 when attendance student record does not exist', async () => {
            const response = await request(app).
            put('/api/v1/attendances/bulk/update').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                attendanceUpdates: [{
                    attendanceId: testAttendance2.id,
                    studentId: validStudent1.id,
                    newAttendanceStatus: false
                }]
            });

            expect(response.status).toBe(404);
            expect(response.body.message).toContain('Invalid attendance-student combinations found');
        });

        test('should handle mixed valid and invalid data gracefully', async () => {
            const response = await request(app).
            put('/api/v1/attendances/bulk/update').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                attendanceUpdates: [{
                        attendanceId: testAttendance1.id,
                        studentId: validStudent1.id,
                        newAttendanceStatus: false
                    },
                    {
                        attendanceId: '12345678-1234-1234-1234-123456789012',
                        studentId: validStudent2.id,
                        newAttendanceStatus: true
                    }
                ]

            });

            expect(response.status).toBe(404);
            expect(response.body.message).toContain('Attendance records not found');
        });

        test('should handle duplicate attendance updates gracefully', async () => {
            const response = await request(app).
            put('/api/v1/attendances/bulk/update').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                attendanceUpdates: [{
                        attendanceId: testAttendance1.id,
                        studentId: validStudent1.id,
                        newAttendanceStatus: false
                    },
                    {
                        attendanceId: testAttendance1.id,
                        studentId: validStudent1.id,
                        newAttendanceStatus: true
                    }
                ]

            });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('should validate university access properly', async () => {

            const response = await request(app).
            put('/api/v1/attendances/bulk/update').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                attendanceUpdates: [{
                    attendanceId: testAttendance1.id,
                    studentId: validStudent1.id,
                    newAttendanceStatus: false
                }]
            });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('should return 400 when no status changes are needed', async () => {
            const response = await request(app).
            put('/api/v1/attendances/bulk/update').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                attendanceUpdates: [{
                    attendanceId: testAttendance1.id,
                    studentId: validStudent1.id,
                    newAttendanceStatus: true
                }]
            });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('No attendance status changes to apply');
        });
    });

    describe('Success Tests', () => {
        test('should successfully update single attendance record', async () => {
            const response = await request(app).
            put('/api/v1/attendances/bulk/update').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                attendanceUpdates: [{
                    attendanceId: testAttendance1.id,
                    studentId: validStudent1.id,
                    newAttendanceStatus: false
                }]
            });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('attendance records updated successfully');
            expect(response.body.data).toHaveProperty('updatedCount');
            expect(response.body.data.updatedCount).toBe(1);

            const updatedAttendance = await AttendanceStudent.findOne({
                where: {
                    attendanceId: testAttendance1.id,
                    studentId: validStudent1.id
                }
            });
            expect(updatedAttendance.attendanceStatus).toBe(false);
        });

        test('should successfully update multiple attendance records', async () => {
            const response = await request(app).
            put('/api/v1/attendances/bulk/update').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                attendanceUpdates: [{
                        attendanceId: testAttendance1.id,
                        studentId: validStudent1.id,
                        newAttendanceStatus: false
                    },
                    {
                        attendanceId: testAttendance1.id,
                        studentId: validStudent2.id,
                        newAttendanceStatus: true
                    }
                ]

            });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('attendance records updated successfully');
            expect(response.body.data.updatedCount).toBe(2);

            const updatedAttendance1 = await AttendanceStudent.findOne({
                where: {
                    attendanceId: testAttendance1.id,
                    studentId: validStudent1.id
                }
            });
            const updatedAttendance2 = await AttendanceStudent.findOne({
                where: {
                    attendanceId: testAttendance1.id,
                    studentId: validStudent2.id
                }
            });

            expect(updatedAttendance1.attendanceStatus).toBe(false);
            expect(updatedAttendance2.attendanceStatus).toBe(true);
        });

        test('should return correct response structure', async () => {
            const response = await request(app).
            put('/api/v1/attendances/bulk/update').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                attendanceUpdates: [{
                    attendanceId: testAttendance1.id,
                    studentId: validStudent1.id,
                    newAttendanceStatus: false
                }]
            });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success');
            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('data');
            expect(response.body.data).toHaveProperty('updatedCount');
            expect(typeof response.body.data.updatedCount).toBe('number');
        });

        test('should handle updates across different attendance records', async () => {
            const response = await request(app).
            put('/api/v1/attendances/bulk/update').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                attendanceUpdates: [{
                        attendanceId: testAttendance1.id,
                        studentId: validStudent1.id,
                        newAttendanceStatus: false
                    },
                    {
                        attendanceId: testAttendance2.id,
                        studentId: validStudent3.id,
                        newAttendanceStatus: false
                    }
                ]

            });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.updatedCount).toBe(2);

            const updatedAttendance1 = await AttendanceStudent.findOne({
                where: {
                    attendanceId: testAttendance1.id,
                    studentId: validStudent1.id
                }
            });
            const updatedAttendance3 = await AttendanceStudent.findOne({
                where: {
                    attendanceId: testAttendance2.id,
                    studentId: validStudent3.id
                }
            });

            expect(updatedAttendance1.attendanceStatus).toBe(false);
            expect(updatedAttendance3.attendanceStatus).toBe(false);
        });

        test('should handle no actual status change gracefully', async () => {
            const response = await request(app).
            put('/api/v1/attendances/bulk/update').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                attendanceUpdates: [{
                    attendanceId: testAttendance1.id,
                    studentId: validStudent1.id,
                    newAttendanceStatus: true
                }]
            });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('No attendance status changes to apply');
        });

        test('should handle large batch updates efficiently', async () => {

            const additionalStudents = [];
            const additionalUpdates = [];

            for (let i = 0; i < 5; i++) {

                const student = await Student.create({
                    prn: `PRN2025${String(i).padStart(6, '0')}`,
                    firstName: `TestStudent${i}`,
                    lastName: `BatchTest${i}`,
                    studentCollegeId: `BATCH${String(i).padStart(3, '0')}`,
                    phoneNumber: `900000000${i}`,
                    email: `batchtest${i}@example.com`,
                    gender: 'Male',
                    dateOfBirth: '2000-01-01',
                    admissionYear: 2025,
                    admissionType: 'FE',
                    universityId: validUniversity.id,
                    branchId: validBranch.id,
                    schemeId: validScheme.id
                });

                await StudentDivision.create({
                    studentId: student.id,
                    divisionId: validDivision.id,
                    startDate: '2025-01-01'
                });

                await StudentBatch.create({
                    studentId: student.id,
                    batchId: validBatch.id,
                    startDate: '2025-01-01'
                });

                const attendanceStudent = await AttendanceStudent.create({
                    attendanceId: testAttendance2.id,
                    studentId: student.id,
                    attendanceStatus: true
                });

                additionalStudents.push(student);
                additionalUpdates.push({
                    attendanceId: testAttendance2.id,
                    studentId: student.id,
                    newAttendanceStatus: false
                });
            }

            const response = await request(app).
            put('/api/v1/attendances/bulk/update').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                attendanceUpdates: additionalUpdates
            });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.updatedCount).toBe(5);
        });

        test('should maintain data integrity during bulk updates', async () => {
            const originalAttendance = await AttendanceStudent.findOne({
                where: {
                    attendanceId: testAttendance1.id,
                    studentId: validStudent2.id
                }
            });

            const response = await request(app).
            put('/api/v1/attendances/bulk/update').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                attendanceUpdates: [{
                    attendanceId: testAttendance1.id,
                    studentId: validStudent1.id,
                    newAttendanceStatus: false
                }]
            });

            expect(response.status).toBe(200);

            const updatedAttendance1 = await AttendanceStudent.findOne({
                where: {
                    attendanceId: testAttendance1.id,
                    studentId: validStudent1.id
                }
            });
            const unchangedAttendance2 = await AttendanceStudent.findOne({
                where: {
                    attendanceId: testAttendance1.id,
                    studentId: validStudent2.id
                }
            });

            expect(updatedAttendance1.attendanceStatus).toBe(false);
            expect(unchangedAttendance2.attendanceStatus).toBe(originalAttendance.attendanceStatus);
        });
    });
});
