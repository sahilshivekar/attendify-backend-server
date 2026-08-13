import {
    jest
} from '@jest/globals';
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
import Batch from '../../../db/models/batch.model.js';
import Course from '../../../db/models/course.model.js';
import Room from '../../../db/models/room.model.js';
import Timetable from '../../../db/models/timetable.model.js';
import Class from '../../../db/models/class.model.js';

setupTestDb();

describe('Class API - removeClass', () => {
    let adminToken;
    let teacherToken;
    let studentToken;

    let university;
    let branch;
    let scheme;
    let semester;
    let division;
    let batch;
    let course;
    let room;
    let timetable;
    let teacher;
    let classEntity;

    beforeEach(async () => {

        await Admin.create({
            email: 'admin@example.com',
            username: 'adminuser',
            password: 'Admin@12345'
        });
        const adminLogin = await request(app).post('/api/v1/auth/admins/login').send({
            emailOrUsername: 'admin@example.com',
            password: 'Admin@12345'
        });
        adminToken = adminLogin.body.data.accessToken;

        teacher = await Teacher.create({
            firstName: 'John',
            lastName: 'Doe',
            email: 'teacher@example.com',
            phoneNumber: '+911234567890',
            password: 'Teacher@123',
            gender: 'Male',
            role: 'Teacher'
        });
        const teacherLogin = await request(app).post('/api/v1/auth/teachers/login').send({
            email: 'teacher@example.com',
            password: 'Teacher@123'
        });
        teacherToken = teacherLogin.body.data.accessToken;

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
            endDate: '2025-12-31',
            schemeId: scheme.id
        });
        division = await Division.create({
            divisionCode: 'A',
            semesterId: semester.id
        });
        batch = await Batch.create({
            batchCode: 'Batch A',
            divisionId: division.id
        });

        course = await Course.create({
            name: 'Programming Fundamentals',
            code: 'CS101',
            schemeId: scheme.id
        });
        room = await Room.create({
            roomNumber: '101',
            sittingCapacity: 60
        });

        timetable = await Timetable.create({
            divisionId: division.id
        });

        const student = await Student.create({
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'student@example.com',
            phoneNumber: '+919876543210',
            prn: 'STU001',
            password: 'Student@123',
            schemeId: scheme.id,
            branchId: branch.id,
            admissionYear: 2025,
            admissionType: 'FE',
            gender: 'Female'
        });
        const studentLogin = await request(app).post('/api/v1/auth/students/login').send({
            emailOrPRN: 'student@example.com',
            password: 'Student@123'
        });
        studentToken = studentLogin.body.data.accessToken;

        classEntity = await Class.create({
            teacherId: teacher.id,
            startTime: '09:00:00',
            endTime: '10:00:00',
            dayOfWeek: 'Monday',
            roomId: room.id,
            batchId: batch.id,
            activeFrom: '2025-08-01',
            activeTill: '2025-12-31',
            classType: 'Lecture',
            courseId: course.id,
            timetableId: timetable.id,
            isExtraClass: false
        });
    });

    describe('Authentication and Authorization', () => {
        test('should return 401 if no token provided', async () => {
            const res = await request(app).
            delete(`/api/v1/classes/${classEntity.id}`);
            expect(res.status).toBe(httpStatus.UNAUTHORIZED);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('No token provided');
        });

        test('should return 401 if invalid token provided', async () => {
            const res = await request(app).
            delete(`/api/v1/classes/${classEntity.id}`).
            set('Authorization', 'Bearer invalidtoken');
            expect(res.status).toBe(httpStatus.UNAUTHORIZED);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Invalid token');
        });

        test('should return 403 if teacher tries to remove', async () => {
            const res = await request(app).
            delete(`/api/v1/classes/${classEntity.id}`).
            set('Authorization', `Bearer ${teacherToken}`);
            expect(res.status).toBe(httpStatus.FORBIDDEN);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Insufficient permissions');
        });

        test('should return 403 if student tries to remove', async () => {
            const res = await request(app).
            delete(`/api/v1/classes/${classEntity.id}`).
            set('Authorization', `Bearer ${studentToken}`);
            expect(res.status).toBe(httpStatus.FORBIDDEN);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Insufficient permissions');
        });
    });

    describe('Validation', () => {
        test('should return 400 if id is not a valid UUID', async () => {
            const res = await request(app).
            delete('/api/v1/classes/invalid-uuid').
            set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Class ID must be a valid UUID');
        });
    });

    describe('Success', () => {
        test('should remove class successfully', async () => {
            const res = await request(app).
            delete(`/api/v1/classes/${classEntity.id}`).
            set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(httpStatus.OK);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toContain('Class deleted successfully');

            const deletedClass = await Class.findByPk(classEntity.id);
            expect(deletedClass).toBeNull();
        });
    });

    describe('Not Found', () => {
        test('should return 404 if class does not exist', async () => {
            const fakeId = '550e8400-e29b-41d4-a716-446655440000';
            const res = await request(app).
            delete(`/api/v1/classes/${fakeId}`).
            set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(httpStatus.NOT_FOUND);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Class not found');
        });
    });
});
