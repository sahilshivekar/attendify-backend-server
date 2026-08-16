import {
    jest
} from '@jest/globals';
import request from 'supertest';
import httpStatus from 'http-status';
import app from '../../../app.js';
import setupTestDb from '../../../test/util/setupTestDb.js';
import Admin from '../../../db/models/admin.model.js';
import Teacher from '../../../db/models/teacher.model.js';
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

describe('Room Controller - getRoomShedule', () => {
    let adminToken;
    let university;
    let branch;
    let scheme;
    let semester;
    let division;
    let batch;
    let course;
    let teacher;
    let timetable;
    let room1;
    let room2;

    beforeEach(async () => {
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
            startDate: '2026-08-01',
            endDate: '2026-12-31',
            schemeId: scheme.id
        });
        division = await Division.create({
            divisionCode: 'A',
            semesterId: semester.id
        });
        batch = await Batch.create({
            batchCode: 'Batch 1',
            divisionId: division.id
        });

        teacher = await Teacher.create({
            firstName: 'John',
            lastName: 'Doe',
            email: 'teacher@example.com',
            phoneNumber: '+911234567890',
            password: 'Teacher@123',
            gender: 'Male',
            role: 'Teacher'
        });

        course = await Course.create({
            name: 'Programming Fundamentals',
            code: 'CS101',
            schemeId: scheme.id
        });

        room1 = await Room.create({
            roomNumber: 'R1',
            sittingCapacity: 40
        });
        room2 = await Room.create({
            roomNumber: 'R2',
            sittingCapacity: 50
        });

        timetable = await Timetable.create({
            divisionId: division.id
        });

        await Class.create({
            teacherId: teacher.id,
            startTime: '09:00:00',
            endTime: '10:00:00',
            dayOfWeek: 'Monday',
            roomId: room1.id,
            batchId: batch.id,
            activeFrom: '2026-01-01',
            activeTill: '2026-12-31',
            classType: 'Lecture',
            courseId: course.id,
            timetableId: timetable.id
        });

        await Class.create({
            teacherId: teacher.id,
            startTime: '11:00:00',
            endTime: '12:00:00',
            dayOfWeek: 'Monday',
            roomId: room1.id,
            batchId: batch.id,
            activeFrom: '2026-01-01',
            activeTill: '2026-12-31',
            classType: 'Lecture',
            courseId: course.id,
            timetableId: timetable.id
        });

        await Class.create({
            teacherId: teacher.id,
            startTime: '09:30:00',
            endTime: '09:45:00',
            dayOfWeek: 'Tuesday',
            roomId: room1.id,
            batchId: batch.id,
            activeFrom: '2025-01-01',
            activeTill: '2025-01-01',
            classType: 'Lecture',
            courseId: course.id,
            timetableId: timetable.id
        });

        await Class.create({
            teacherId: teacher.id,
            startTime: '09:15:00',
            endTime: '09:30:00',
            dayOfWeek: 'Monday',
            roomId: room2.id,
            batchId: batch.id,
            activeFrom: '2026-01-01',
            activeTill: '2026-12-31',
            classType: 'Lecture',
            courseId: course.id,
            timetableId: timetable.id
        });
    });

    const buildUrl = (roomId, q) => {
        const params = new URLSearchParams(q).toString();
        return `/api/v1/rooms/${roomId}/schedule?${params}`;
    };

    test('should require authentication', async () => {
        const res = await request(app).get(buildUrl(room1.id, {
            startDate: '2026-01-01',
            endDate: '2026-12-31',
            startTime: '09:15:00',
            endTime: '09:45:00'
        }));
        expect(res.status).toBe(httpStatus.UNAUTHORIZED);
    });

    test('should validate params and query', async () => {

        let res = await request(app).
        get(buildUrl('not-a-uuid', {
            startDate: '2026-01-01',
            endDate: '2026-12-31',
            startTime: '09:15:00',
            endTime: '09:45:00'
        })).
        set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(httpStatus.BAD_REQUEST);

        res = await request(app).
        get(buildUrl(room1.id, {
            endDate: '2026-12-31',
            startTime: '09:15:00',
            endTime: '09:45:00'
        })).
        set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(httpStatus.BAD_REQUEST);

        res = await request(app).
        get(buildUrl(room1.id, {
            startDate: '2026-01-01',
            endDate: '2026-12-31',
            startTime: '10:00:00',
            endTime: '09:00:00'
        })).
        set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(httpStatus.BAD_REQUEST);
    });

    test('should return 404 if room not found', async () => {
        const res = await request(app).
        get(buildUrl('aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', {
            startDate: '2026-01-01',
            endDate: '2026-12-31',
            startTime: '09:15:00',
            endTime: '09:45:00'
        })).
        set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(httpStatus.NOT_FOUND);
    });

    test('should return only classes in the given time window and date range for the room', async () => {
        const res = await request(app).
        get(buildUrl(room1.id, {
            startDate: '2026-01-01',
            endDate: '2026-12-31',
            startTime: '09:15:00',
            endTime: '09:45:00'
        })).
        set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(httpStatus.OK);
        expect(res.body.success).toBe(true);
        const {
            room,
            classes
        } = res.body.data;
        expect(room.id).toBe(room1.id);

        expect(Array.isArray(classes)).toBe(true);
        expect(classes.length).toBe(1);
        expect(classes[0].roomId).toBe(room1.id);
        expect(classes[0].startTime).toBe('09:00:00');
        expect(classes[0].endTime).toBe('10:00:00');
    });
});
