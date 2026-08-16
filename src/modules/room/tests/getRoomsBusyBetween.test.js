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

describe('Room Controller - getRooms with busyBetween filters', () => {
    let adminToken;
    let teacher;
    let university;
    let branch;
    let scheme;
    let semester;
    let division;
    let batch;
    let course;
    let timetable;
    let room1;
    let room2;
    let room3;

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
        room3 = await Room.create({
            roomNumber: 'R3',
            sittingCapacity: 60
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
            roomId: room2.id,
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
            dayOfWeek: 'Monday',
            roomId: room3.id,
            batchId: batch.id,
            activeFrom: '2025-01-01',
            activeTill: '2025-01-01',
            classType: 'Lecture',
            courseId: course.id,
            timetableId: timetable.id
        });
    });

    const url = '/api/v1/rooms';

    test('should include only classes overlapping the given time window and still active', async () => {
        const res = await request(app).
        get(url).
        set('Authorization', `Bearer ${adminToken}`).
        query({
            busyBetweenStartTime: '09:30:00',
            busyBetweenEndTime: '09:45:00',
            getAll: true
        });

        expect(res.status).toBe(httpStatus.OK);
        expect(res.body.success).toBe(true);

        const rooms = res.body.data.rooms;
        expect(Array.isArray(rooms)).toBe(true);

        const r1 = rooms.find((r) => r.roomNumber === 'R1');
        const r2 = rooms.find((r) => r.roomNumber === 'R2');
        const r3 = rooms.find((r) => r.roomNumber === 'R3');

        expect(r1).toBeTruthy();
        expect(r2).toBeTruthy();
        expect(r3).toBeTruthy();

        expect(Array.isArray(r1.Classes)).toBe(true);
        expect(Array.isArray(r2.Classes)).toBe(true);
        expect(Array.isArray(r3.Classes)).toBe(true);

        expect(r1.Classes.length).toBe(1);
        expect(r2.Classes.length).toBe(0);
        expect(r3.Classes.length).toBe(0);
    });

    test('should return all rooms when no busyBetween filter is provided', async () => {
        const res = await request(app).
        get(url).
        set('Authorization', `Bearer ${adminToken}`).
        query({
            getAll: true
        });

        expect(res.status).toBe(httpStatus.OK);
        const {
            rooms,
            totalCount
        } = res.body.data;
        expect(totalCount).toBe(3);
        expect(rooms.length).toBe(3);
        expect(rooms.map((r) => r.roomNumber).sort()).toEqual(['R1', 'R2', 'R3']);

        const anyHasClassesKey = rooms.some((r) => Object.prototype.hasOwnProperty.call(r, 'Classes'));
        expect(anyHasClassesKey).toBe(false);
    });
});
