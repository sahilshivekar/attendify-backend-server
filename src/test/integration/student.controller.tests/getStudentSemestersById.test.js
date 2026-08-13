import httpStatus from 'http-status';
import request from 'supertest';
import app from '../../../app.js';
import setupTestDb from '../../util/setupTestDb.js';
import University from '../../../db/models/university.model.js';
import Branch from '../../../db/models/branch.model.js';
import Scheme from '../../../db/models/scheme.model.js';
import Student from '../../../db/models/student.model.js';
import Admin from '../../../db/models/admin.model.js';
import Semester from '../../../db/models/semester.model.js';
import StudentSemester from '../../../db/models/studentSemester.model.js';

setupTestDb();

describe('Student API - GET /api/v1/students/:id/semesters', () => {
    let adminToken;
    let studentToken;
    let student;
    let semester1, semester2;

    beforeEach(async () => {
        try {

            const adminData = {
                username: 'admin',
                firstName: 'Admin',
                lastName: 'User',
                email: 'admin@test.com',
                password: 'Admin@12345',
                role: 'Admin',
                university: {
                    universityName: 'Test University',
                    password: 'Admin@12345'
                }
            };

            await Admin.create(adminData);

            const adminLoginRes = await request(app).
            post('/api/v1/auth/admins/login').
            send({
                emailOrUsername: 'admin@test.com',
                password: 'Admin@12345'
            });

            adminToken = adminLoginRes.body.data.accessToken;

            const university = await University.create({
                name: 'Test University',
                abbreviation: 'TU',
                address: 'Test Address',
                contactEmail: 'test@university.com',
                contactPhone: '1234567890',
                establishedYear: 2000,
                websiteUrl: 'https://testuniversity.com'
            });

            const branch = await Branch.create({
                name: 'Computer Science',
                abbreviation: 'CS',
                branchCode: 'CS101',
                branchName: 'Computer Engineering',
                universityId: university.id,
                isActive: true
            });

            const scheme = await Scheme.create({
                name: 'Test Scheme 2025',
                schemeCode: 'TS2025',
                schemeName: 'Test Scheme',
                academicStartYear: 2025,
                academicEndYear: 2028,
                duration: 4,
                branchId: branch.id,
                universityId: university.id,
                isActive: true
            });

            student = await Student.create({
                prn: 'TEST123456',
                firstName: 'John',
                lastName: 'Doe',
                middleName: 'M',
                email: 'john.doe@test.com',
                phoneNumber: '1234567890',
                gender: 'Male',
                password: 'Student@123',
                admissionYear: 2023,
                admissionType: 'FE',
                schemeId: scheme.id,
                branchId: branch.id
            });

            const studentLoginRes = await request(app).
            post('/api/v1/auth/students/login').
            send({
                emailOrPRN: 'john.doe@test.com',
                password: 'Student@123'
            });

            studentToken = studentLoginRes.body.data.accessToken;

            semester1 = await Semester.create({
                semesterNumber: 1,
                branchId: branch.id,
                schemeId: scheme.id,
                academicStartYear: 2025,
                academicEndYear: 2026,
                startDate: '2025-08-01',
                endDate: '2026-01-01'
            });

            semester2 = await Semester.create({
                semesterNumber: 2,
                branchId: branch.id,
                schemeId: scheme.id,
                academicStartYear: 2025,
                academicEndYear: 2026,
                startDate: '2026-01-15',
                endDate: '2026-06-01'
            });

            await StudentSemester.create({
                studentId: student.id,
                semesterId: semester1.id
            });

            await StudentSemester.create({
                studentId: student.id,
                semesterId: semester2.id
            });
        } catch (error) {
            console.error('Setup error:', error);
            throw error;
        }
    });

    describe('Authentication Tests', () => {
        test('should return 401 without token', async () => {
            const res = await request(app).
            get(`/api/v1/students/${student.id}/semesters`).
            expect(httpStatus.UNAUTHORIZED);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Unauthorized request: No token provided');
        });

        test('should return 401 with invalid token', async () => {
            const res = await request(app).
            get(`/api/v1/students/${student.id}/semesters`).
            set('Authorization', 'Bearer invalidtoken').
            expect(httpStatus.UNAUTHORIZED);

            expect(res.body.success).toBe(false);
        });

        test('should allow Admin to access student semesters', async () => {
            const res = await request(app).
            get(`/api/v1/students/${student.id}/semesters`).
            set('Authorization', `Bearer ${adminToken}`).
            expect(httpStatus.OK);

            expect(res.body.success).toBe(true);
        });

        test('should allow Student to access their own semesters', async () => {
            const res = await request(app).
            get(`/api/v1/students/${student.id}/semesters`).
            set('Authorization', `Bearer ${studentToken}`).
            expect(httpStatus.OK);

            expect(res.body.success).toBe(true);
        });
    });

    describe('Validation Tests', () => {
        test('should return 400 for invalid UUID format', async () => {
            const res = await request(app).
            get('/api/v1/students/invalid-uuid/semesters').
            set('Authorization', `Bearer ${adminToken}`).
            expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Student ID must be a valid UUID');
        });
    });

    describe('Business Logic Tests', () => {
        test('should return 404 for non-existent student', async () => {
            const nonExistentId = 'b84c9e52-c8b4-4a19-8b1d-123456789abc';

            const res = await request(app).
            get(`/api/v1/students/${nonExistentId}/semesters`).
            set('Authorization', `Bearer ${adminToken}`).
            expect(httpStatus.NOT_FOUND);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Student not found');
        });

        test('should return empty array for student with no semesters', async () => {

            const studentWithoutSemesters = await Student.create({
                prn: 'TEST999999',
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'jane.smith@test.com',
                phoneNumber: '9876543210',
                gender: 'Female',
                password: 'Student@123',
                admissionYear: 2023,
                admissionType: 'FE',
                schemeId: student.schemeId,
                branchId: student.branchId
            });

            const res = await request(app).
            get(`/api/v1/students/${studentWithoutSemesters.id}/semesters`).
            set('Authorization', `Bearer ${adminToken}`).
            expect(httpStatus.OK);

            expect(res.body.success).toBe(true);
            expect(res.body.data).toEqual([]);
        });
    });

    describe('Success Tests', () => {
        test('should return student semesters with associations', async () => {
            const res = await request(app).
            get(`/api/v1/students/${student.id}/semesters`).
            set('Authorization', `Bearer ${adminToken}`).
            expect(httpStatus.OK);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Student semesters fetched successfully');
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data).toHaveLength(2);

            expect(res.body.data[0]).toHaveProperty('studentId', student.id);
            expect(res.body.data[0]).toHaveProperty('semesterId');
            expect(res.body.data[0]).toHaveProperty('Semester');
            expect(res.body.data[0].Semester).toHaveProperty('semesterNumber');
            expect(res.body.data[0].Semester).toHaveProperty('academicStartYear');
        });

        test('should return correct semester data', async () => {
            const res = await request(app).
            get(`/api/v1/students/${student.id}/semesters`).
            set('Authorization', `Bearer ${adminToken}`).
            expect(httpStatus.OK);

            expect(res.body.success).toBe(true);

            const semesterNumbers = res.body.data.map((ss) => ss.Semester.semesterNumber).sort();
            expect(semesterNumbers).toEqual([1, 2]);

            const academicYears = res.body.data.map((ss) => ss.Semester.academicStartYear).sort();
            expect(academicYears).toEqual([2025, 2025]);
        });

        test('should return proper API response structure', async () => {
            const res = await request(app).
            get(`/api/v1/students/${student.id}/semesters`).
            set('Authorization', `Bearer ${adminToken}`).
            expect(httpStatus.OK);

            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('message', 'Student semesters fetched successfully');
            expect(res.body).toHaveProperty('data');
            expect(Array.isArray(res.body.data)).toBe(true);
        });

        test('should maintain data consistency across calls', async () => {
            const res1 = await request(app).
            get(`/api/v1/students/${student.id}/semesters`).
            set('Authorization', `Bearer ${adminToken}`).
            expect(httpStatus.OK);

            const res2 = await request(app).
            get(`/api/v1/students/${student.id}/semesters`).
            set('Authorization', `Bearer ${adminToken}`).
            expect(httpStatus.OK);

            expect(res1.body.data).toEqual(res2.body.data);
        });
    });
});
