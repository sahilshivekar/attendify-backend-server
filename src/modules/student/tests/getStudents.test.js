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
import StudentSemester from '../../../db/models/studentSemester.model.js';
import StudentDivision from '../../../db/models/studentDivision.model.js';
import StudentBatch from '../../../db/models/studentBatch.model.js';
import Dropout from '../../../db/models/dropout.model.js';
import httpStatus from 'http-status';

setupTestDb();

describe('Student API - GET /api/v1/students', () => {
    let adminToken;
    let teacherToken;
    let studentToken;
    let university;
    let branch;
    let scheme;
    let semester;
    let division;
    let batch;
    let teacher;
    let student1;
    let student2;
    let student3;

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
            const teacherLoginRes = await request(app).
            post('/api/v1/auth/teachers/login').
            send({
                email: 'teacher@example.com',
                password: 'Teacher@123'
            });
            teacherToken = teacherLoginRes.body.data.accessToken;

            student1 = await Student.create({
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'student1@example.com',
                phoneNumber: '+919876543210',
                prn: 'STU001',
                password: 'Student@123',
                schemeId: scheme.id,
                branchId: branch.id,
                admissionYear: 2025,
                admissionType: 'FE',
                gender: 'Male'
            });
            student2 = await Student.create({
                firstName: 'Bob',
                lastName: 'Johnson',
                email: 'student2@example.com',
                phoneNumber: '+919876543211',
                prn: 'STU002',
                password: 'Student@123',
                schemeId: scheme.id,
                branchId: branch.id,
                admissionYear: 2025,
                admissionType: 'FE',
                gender: 'Male'
            });
            student3 = await Student.create({
                firstName: 'Alice',
                lastName: 'Brown',
                email: 'student3@example.com',
                phoneNumber: '+919876543212',
                prn: 'STU003',
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
                emailOrPRN: 'student1@example.com',
                password: 'Student@123'
            });
            studentToken = studentLoginRes.body.data.accessToken;

            await StudentSemester.create({
                studentId: student1.id,
                semesterId: semester.id
            });
            await StudentSemester.create({
                studentId: student2.id,
                semesterId: semester.id
            });
            await StudentSemester.create({
                studentId: student3.id,
                semesterId: semester.id
            });

            await StudentDivision.create({
                studentId: student1.id,
                divisionId: division.id,
                startDate: '2025-08-01'
            });
            await StudentDivision.create({
                studentId: student2.id,
                divisionId: division.id,
                startDate: '2025-08-01'
            });
            await StudentDivision.create({
                studentId: student3.id,
                divisionId: division.id,
                startDate: '2025-08-01'
            });

            await StudentBatch.create({
                studentId: student1.id,
                batchId: batch.id,
                startDate: '2025-08-01'
            });
            await StudentBatch.create({
                studentId: student2.id,
                batchId: batch.id,
                startDate: '2025-08-01'
            });
            await StudentBatch.create({
                studentId: student3.id,
                batchId: batch.id,
                startDate: '2025-08-01'
            });
        } catch (err) {
            console.error('beforeEach setup error:', err);
            throw err;
        }
    });

    describe('Authentication Tests', () => {
        test('should return 401 when no token is provided', async () => {
            const res = await request(app).
            get('/api/v1/students');
            expect(res.status).toBe(httpStatus.UNAUTHORIZED);
        });

        test('should return 401 when invalid token is provided', async () => {
            const res = await request(app).
            get('/api/v1/students').
            set('Authorization', 'Bearer invalidtoken');
            expect(res.status).toBe(httpStatus.UNAUTHORIZED);
        });

        test('should allow Admin to access students', async () => {
            const res = await request(app).
            get('/api/v1/students').
            set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(httpStatus.OK);
        });

        test('should allow Teacher to access students', async () => {
            const res = await request(app).
            get('/api/v1/students').
            set('Authorization', `Bearer ${teacherToken}`);
            expect(res.status).toBe(httpStatus.OK);
        });

        test('should allow Student to access students', async () => {
            const res = await request(app).
            get('/api/v1/students').
            set('Authorization', `Bearer ${studentToken}`);
            expect(res.status).toBe(httpStatus.OK);
        });
    });

    describe('Query Parameter Validation Tests', () => {
        test('should return 400 for invalid page parameter', async () => {
            const res = await request(app).
            get('/api/v1/students').
            query({
                page: 'invalid'
            }).
            set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
        });

        test('should return 400 for invalid limit parameter', async () => {
            const res = await request(app).
            get('/api/v1/students').
            query({
                limit: 'invalid'
            }).
            set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
        });

        test('should return 400 for invalid branchIds parameter', async () => {
            const res = await request(app).
            get('/api/v1/students').
            query({
                branchIds: 'invalid-uuid'
            }).
            set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
        });

        test('should return 400 for invalid schemeId parameter', async () => {
            const res = await request(app).
            get('/api/v1/students').
            query({
                schemeId: 'invalid-uuid'
            }).
            set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
        });

        test('should return 400 for invalid semesterId parameter', async () => {
            const res = await request(app).
            get('/api/v1/students').
            query({
                semesterId: 'invalid-uuid'
            }).
            set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
        });

        test('should return 400 for invalid divisionId parameter', async () => {
            const res = await request(app).
            get('/api/v1/students').
            query({
                divisionId: 'invalid-uuid'
            }).
            set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
        });

        test('should return 400 for invalid batchId parameter', async () => {
            const res = await request(app).
            get('/api/v1/students').
            query({
                batchId: 'invalid-uuid'
            }).
            set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
        });
    });

    describe('Filtering and Search Tests', () => {
        test('should filter students by searchQuery', async () => {
            const res = await request(app).
            get('/api/v1/students').
            query({
                searchQuery: 'Jane'
            }).
            set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(httpStatus.OK);
            expect(res.body.data.students).toHaveLength(1);
            expect(res.body.data.students[0].firstName).toBe('Jane');
        });

        test('should filter students by branch', async () => {
            const res = await request(app).
            get('/api/v1/students').
            query({
                branchIds: [branch.id]
            }).
            set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(httpStatus.OK);
            expect(res.body.data.students).toHaveLength(3);
        });

        test('should filter students by scheme', async () => {
            const res = await request(app).
            get('/api/v1/students').
            query({
                schemeId: scheme.id
            }).
            set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(httpStatus.OK);
            expect(res.body.data.students).toHaveLength(3);
        });

        test('should filter students by semester', async () => {
            const res = await request(app).
            get('/api/v1/students').
            query({
                semesterId: semester.id
            }).
            set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(httpStatus.OK);
            expect(res.body.data.students).toHaveLength(3);
        });

        test('should filter students by division', async () => {
            const res = await request(app).
            get('/api/v1/students').
            query({
                divisionId: division.id
            }).
            set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(httpStatus.OK);
            expect(res.body.data.students).toHaveLength(3);
        });

        test('should filter students by batch', async () => {
            const res = await request(app).
            get('/api/v1/students').
            query({
                batchId: batch.id
            }).
            set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(httpStatus.OK);
            expect(res.body.data.students).toHaveLength(3);
        });

        test('should filter students by admission year', async () => {
            const res = await request(app).
            get('/api/v1/students').
            query({
                admissionYear: 2025
            }).
            set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(httpStatus.OK);
            expect(res.body.data.students).toHaveLength(3);
        });

        test('should filter students by admission type', async () => {
            const res = await request(app).
            get('/api/v1/students').
            query({
                admissionTypes: 'FE'
            }).
            set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(httpStatus.OK);
            expect(res.body.data.students).toHaveLength(3);
        });
    });

    describe('Pagination Tests', () => {
        test('should paginate results with page and limit', async () => {
            const res = await request(app).
            get('/api/v1/students').
            query({
                page: 1,
                limit: 2
            }).
            set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(httpStatus.OK);
            expect(res.body.data.students).toHaveLength(2);
            expect(res.body.data.totalStudents).toBe(3);
        });

        test('should return all results when getAll=true', async () => {
            const res = await request(app).
            get('/api/v1/students').
            query({
                getAll: true
            }).
            set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(httpStatus.OK);
            expect(res.body.data.students).toHaveLength(3);
        });

        test('should handle empty results', async () => {
            const res = await request(app).
            get('/api/v1/students').
            query({
                searchQuery: 'NonExistentStudent'
            }).
            set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(httpStatus.OK);
            expect(res.body.data.students).toHaveLength(0);
            expect(res.body.data.totalStudents).toBe(0);
        });
    });

    describe('Include Relations Tests', () => {
        test('should include student semester information', async () => {
            const res = await request(app).
            get('/api/v1/students').
            set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(httpStatus.OK);
            expect(res.body.data.students[0]).toHaveProperty('StudentSemesters');
            expect(res.body.data.students[0].StudentSemesters).toHaveLength(1);
        });

        test('should include branch information', async () => {
            const res = await request(app).
            get('/api/v1/students').
            set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(httpStatus.OK);
            expect(res.body.data.students[0]).toHaveProperty('Branch');
            expect(res.body.data.students[0].Branch.name).toBe('Computer Science');
        });

        test('should include scheme information', async () => {
            const res = await request(app).
            get('/api/v1/students').
            set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(httpStatus.OK);
            expect(res.body.data.students[0]).toHaveProperty('Scheme');
            expect(res.body.data.students[0].Scheme.name).toBe('CS 2026 Scheme');
        });

        test('should include division information', async () => {
            const res = await request(app).
            get('/api/v1/students').
            set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(httpStatus.OK);
            expect(res.body.data.students[0]).toHaveProperty('StudentDivisions');
            expect(res.body.data.students[0].StudentDivisions).toHaveLength(1);
        });

        test('should include batch information', async () => {
            const res = await request(app).
            get('/api/v1/students').
            set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(httpStatus.OK);
            expect(res.body.data.students[0]).toHaveProperty('StudentBatches');
            expect(res.body.data.students[0].StudentBatches).toHaveLength(1);
        });
    });
});
