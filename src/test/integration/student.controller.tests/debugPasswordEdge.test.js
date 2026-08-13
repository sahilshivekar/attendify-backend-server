import {
    jest
} from '@jest/globals';
import request from 'supertest';
import app from '../../../app.js';
import setupTestDb from '../../util/setupTestDb.js';
import Admin from '../../../db/models/admin.model.js';
import Student from '../../../db/models/student.model.js';
import University from '../../../db/models/university.model.js';
import Branch from '../../../db/models/branch.model.js';
import Scheme from '../../../db/models/scheme.model.js';
import httpStatus from 'http-status';

setupTestDb();

describe('Debug updateStudentPassword edge cases', () => {
    let adminToken;
    let university;
    let branch;
    let scheme;
    let student;

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

            student = await Student.create({
                firstName: 'John',
                lastName: 'Doe',
                email: 'student@example.com',
                phoneNumber: '+919876543210',
                prn: 'STU001',
                password: 'Student@123',
                schemeId: scheme.id,
                branchId: branch.id,
                admissionYear: 2025,
                admissionType: 'FE',
                gender: 'Male'
            });
        } catch (err) {
            console.error('beforeEach setup error:', err);
            throw err;
        }
    });

    test('should debug minimum password length', async () => {
        const minPassword = '12345678';
        console.log('Min password length:', minPassword.length);

        const res = await request(app).
        put('/api/v1/students/password').
        set('Authorization', `Bearer ${adminToken}`).
        send({
            id: student.id,
            password: minPassword,
            confirmPassword: minPassword
        });

        console.log('Min password - Response status:', res.status);
        console.log('Min password - Response body:', JSON.stringify(res.body, null, 2));
    });

    test('should debug maximum password length', async () => {
        const maxPassword = 'a'.repeat(128);
        console.log('Max password length:', maxPassword.length);

        const res = await request(app).
        put('/api/v1/students/password').
        set('Authorization', `Bearer ${adminToken}`).
        send({
            id: student.id,
            password: maxPassword,
            confirmPassword: maxPassword
        });

        console.log('Max password - Response status:', res.status);
        console.log('Max password - Response body:', JSON.stringify(res.body, null, 2));
    });
});
