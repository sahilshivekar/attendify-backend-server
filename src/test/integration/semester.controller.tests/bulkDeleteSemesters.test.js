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
import Division from '../../../db/models/division.model.js';
import StudentSemester from '../../../db/models/studentSemester.model.js';
import Student from '../../../db/models/student.model.js';
import Admin from '../../../db/models/admin.model.js';
import jwt from 'jsonwebtoken';
import {
    config
} from '../../../config/config.js';
import {
    randomUUID
} from 'crypto';

setupTestDb();

describe('DELETE /api/v1/semesters/bulk/delete', () => {
    let validUniversity;
    let validBranch;
    let validScheme;
    let testSemester1;
    let testSemester2;
    let adminToken;

    beforeEach(async () => {
        try {

            const admin = await Admin.create({
                email: 'testadmin@test.com',
                username: 'testadmin',
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
                name: 'Computer Science Engineering',
                abbreviation: 'CSE'
            });

            validScheme = await Scheme.create({
                name: 'CS 2026 Scheme',
                universityId: validUniversity.id
            });

            testSemester1 = await Semester.create({
                branchId: validBranch.id,
                semesterNumber: 1,
                academicStartYear: 2025,
                academicEndYear: 2026,
                startDate: '2025-08-01',
                endDate: '2025-12-31',
                schemeId: validScheme.id
            });

            testSemester2 = await Semester.create({
                branchId: validBranch.id,
                semesterNumber: 2,
                academicStartYear: 2025,
                academicEndYear: 2026,
                startDate: '2026-01-01',
                endDate: '2026-05-31',
                schemeId: validScheme.id
            });
        } catch (error) {
            console.error('Setup error:', error);
            throw error;
        }
    });

    describe('Authentication Tests', () => {
        test('should return 401 without token', async () => {
            const response = await request(app).
            delete('/api/v1/semesters/bulk/delete').
            send({
                semesterIds: [testSemester1.id]
            });

            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Unauthorized request: No token provided');
        });

        test('should return 401 with invalid token', async () => {
            const response = await request(app).
            delete('/api/v1/semesters/bulk/delete').
            set('Authorization', 'Bearer invalid-token').
            send({
                semesterIds: [testSemester1.id]
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
        test('should return 400 when semesterIds array is missing', async () => {
            const response = await request(app).
            delete('/api/v1/semesters/bulk/delete').
            set('Authorization', `Bearer ${adminToken}`).
            send({});

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Semester IDs array is required');
        });

        test('should return 400 when semesterIds array is empty', async () => {
            const response = await request(app).
            delete('/api/v1/semesters/bulk/delete').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                semesterIds: []
            });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('does not contain 1 required value(s)');
        });

        test('should return 400 when semesterIds array exceeds maximum limit', async () => {

            const validId = testSemester1.id || randomUUID();
            const semesterIds = Array(51).fill(validId);

            const response = await request(app).
            delete('/api/v1/semesters/bulk/delete').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                semesterIds
            });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Cannot delete more than 50 semesters at once');
        });

        test('should return 400 when semesterIds contain invalid UUIDs', async () => {
            const response = await request(app).
            delete('/api/v1/semesters/bulk/delete').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                semesterIds: ['invalid-uuid']
            });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Each semester ID must be a valid UUID');
        });

        test('should return 400 when semesterIds contain null values', async () => {
            const response = await request(app).
            delete('/api/v1/semesters/bulk/delete').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                semesterIds: [null]
            });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('must be a string');
        });

        test('should return 400 when semesterIds contain empty strings', async () => {
            const response = await request(app).
            delete('/api/v1/semesters/bulk/delete').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                semesterIds: ['']
            });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('is not allowed to be empty');
        });

        test('should return 413 when request payload is too large', async () => {
            const largeSemesterIds = Array(100).fill().map(() => '12345678-1234-1234-1234-123456789012');

            const response = await request(app).
            delete('/api/v1/semesters/bulk/delete').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                semesterIds: largeSemesterIds,

                largeField: 'x'.repeat(10000)
            });

            expect([413, 400]).toContain(response.status);
        });
    });

    describe('Business Logic Tests', () => {
        test('should return 404 when trying to delete non-existent semesters', async () => {
            const response = await request(app).
            delete('/api/v1/semesters/bulk/delete').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                semesterIds: [randomUUID()]
            });

            expect(response.status).toBe(404);
            expect(response.body.message).toContain('Some semesters not found');
        });

        test('should return 409 when trying to delete semester with dependent divisions', async () => {

            await Division.create({
                divisionCode: 'A',
                semesterId: testSemester1.id
            });

            const response = await request(app).
            delete('/api/v1/semesters/bulk/delete').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                semesterIds: [testSemester1.id]
            });

            expect(response.status).toBe(409);
            expect(response.body.message).toContain('Cannot delete semester');
            expect(response.body.message).toContain('dependent records');
        });

        test('should return 409 when trying to delete semester with dependent student semesters', async () => {

            const testStudent = await Student.create({
                firstName: 'Test',
                lastName: 'Student',
                email: 'teststudent@example.com',
                phoneNumber: '+919876543213',
                prn: 'STU999',
                password: 'Student@123',
                schemeId: validScheme.id,
                branchId: validBranch.id,
                admissionYear: 2025,
                admissionType: 'FE',
                gender: 'Male'
            });

            await StudentSemester.create({
                studentId: testStudent.id,
                semesterId: testSemester1.id
            });

            const response = await request(app).
            delete('/api/v1/semesters/bulk/delete').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                semesterIds: [testSemester1.id]
            });

            expect(response.status).toBe(409);
            expect(response.body.message).toContain('Cannot delete semester');
            expect(response.body.message).toContain('dependent records');
        });

        test('should handle mixed valid and invalid semester IDs', async () => {
            const response = await request(app).
            delete('/api/v1/semesters/bulk/delete').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                semesterIds: [
                    testSemester1.id,
                    randomUUID()
                ]

            });

            expect(response.status).toBe(404);
            expect(response.body.message).toContain('Some semesters not found');
        });

        test('should handle duplicate semester IDs in request', async () => {
            const response = await request(app).
            delete('/api/v1/semesters/bulk/delete').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                semesterIds: [
                    testSemester1.id,
                    testSemester1.id
                ]

            });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.deletedCount).toBe(1);
        });
    });

    describe('Success Tests', () => {
        test('should successfully delete single semester', async () => {
            const response = await request(app).
            delete('/api/v1/semesters/bulk/delete').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                semesterIds: [testSemester1.id]
            });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('1 semesters deleted successfully');
            expect(response.body.data).toHaveProperty('deletedCount');
            expect(response.body.data.deletedCount).toBe(1);

            const deletedSemester = await Semester.findByPk(testSemester1.id);
            expect(deletedSemester).toBe(null);
        });

        test('should successfully delete multiple semesters', async () => {
            const response = await request(app).
            delete('/api/v1/semesters/bulk/delete').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                semesterIds: [testSemester1.id, testSemester2.id]
            });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('2 semesters deleted successfully');
            expect(response.body.data.deletedCount).toBe(2);

            const deletedSemester1 = await Semester.findByPk(testSemester1.id);
            const deletedSemester2 = await Semester.findByPk(testSemester2.id);
            expect(deletedSemester1).toBe(null);
            expect(deletedSemester2).toBe(null);
        });

        test('should return correct response structure', async () => {
            const response = await request(app).
            delete('/api/v1/semesters/bulk/delete').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                semesterIds: [testSemester1.id]
            });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success');
            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('data');
            expect(response.body.data).toHaveProperty('deletedCount');
            expect(typeof response.body.data.deletedCount).toBe('number');
        });

        test('should handle deletion when some semesters are already deleted', async () => {

            await Semester.destroy({
                where: {
                    id: testSemester1.id
                }
            });

            const response = await request(app).
            delete('/api/v1/semesters/bulk/delete').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                semesterIds: [testSemester1.id, testSemester2.id]
            });

            expect(response.status).toBe(404);
            expect(response.body.message).toContain('Some semesters not found');
        });

        test('should successfully delete when no dependent records exist', async () => {

            const divisionCount = await Division.count({
                where: {
                    semesterId: testSemester1.id
                }
            });
            const studentSemesterCount = await StudentSemester.count({
                where: {
                    semesterId: testSemester1.id
                }
            });

            expect(divisionCount).toBe(0);
            expect(studentSemesterCount).toBe(0);

            const response = await request(app).
            delete('/api/v1/semesters/bulk/delete').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                semesterIds: [testSemester1.id]
            });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.deletedCount).toBe(1);
        });
    });
});
