import request from 'supertest';
import app from '../../../app.js';
import setupTestDb from '../../util/setupTestDb.js';
import Teacher from '../../../db/models/teacher.model.js';
import jwt from 'jsonwebtoken';
import httpStatus from 'http-status';
import {
    ROLES
} from '../../../config/roles.js';
import {
    faker
} from '@faker-js/faker';

setupTestDb();

describe('Teacher Auth API - refreshTokens', () => {
    let testTeacher;
    let validRefreshToken;
    let expiredRefreshToken;

    beforeEach(async () => {
        testTeacher = await Teacher.create({
            firstName: 'Jane',
            lastName: 'Doe',
            email: faker.internet.email().toLowerCase(),
            phoneNumber: '+911234567890',
            gender: 'Female',
            role: 'Teacher',
            password: 'TestPass123!'
        });

        validRefreshToken = jwt.sign({
                id: testTeacher.id,
                email: testTeacher.email,
                role: ROLES.TEACHER
            },
            process.env.JWT_REFRESH_TOKEN_SECRET, {
                expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRY || '15d'
            }
        );

        expiredRefreshToken = jwt.sign({
                id: testTeacher.id,
                email: testTeacher.email,
                role: ROLES.TEACHER
            },
            process.env.JWT_REFRESH_TOKEN_SECRET, {
                expiresIn: '1ms'
            }
        );

        testTeacher.refreshToken = validRefreshToken;
        await testTeacher.save();
    });

    describe('GET /api/v1/auth/teachers/access-token', () => {
        test('should refresh access token successfully', async () => {
            const res = await request(app).
            get('/api/v1/auth/teachers/access-token').
            send({
                refreshToken: `Bearer ${validRefreshToken}`
            }).
            expect(httpStatus.OK);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Access token refreshed successfully');
            expect(res.body.data).toHaveProperty('accessToken');
            expect(res.body.data).toHaveProperty('refreshToken');

            expect(res.headers['set-cookie']).toBeDefined();
            expect(res.headers['set-cookie'].some((cookie) => cookie.includes('teacherAccessToken'))).toBe(true);
            expect(res.headers['set-cookie'].some((cookie) => cookie.includes('teacherRefreshToken'))).toBe(true);

            const updated = await Teacher.findByPk(testTeacher.id);
            expect(updated.refreshToken).toBe(res.body.data.refreshToken);
        });

        test('should return 401 when token is invalid', async () => {
            const res = await request(app).
            get('/api/v1/auth/teachers/access-token').
            send({
                refreshToken: 'Bearer invalidtoken'
            }).
            expect(httpStatus.UNAUTHORIZED);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Invalid refresh token');
        });

        test('should return 401 when token is expired', async () => {
            await new Promise((r) => setTimeout(r, 10));
            const res = await request(app).
            get('/api/v1/auth/teachers/access-token').
            send({
                refreshToken: `Bearer ${expiredRefreshToken}`
            }).
            expect(httpStatus.UNAUTHORIZED);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Invalid refresh token');
        });

        test("should return 401 when teacher doesn't exist", async () => {
            const fakeToken = jwt.sign({
                    id: faker.string.uuid(),
                    email: 'fake@test.com',
                    role: ROLES.TEACHER
                },
                process.env.JWT_REFRESH_TOKEN_SECRET, {
                    expiresIn: '15d'
                }
            );
            const res = await request(app).
            get('/api/v1/auth/teachers/access-token').
            send({
                refreshToken: `Bearer ${fakeToken}`
            }).
            expect(httpStatus.UNAUTHORIZED);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe("Teacher with this refresh token doesn't exist");
        });

        test('should return 400 when refreshToken is missing', async () => {
            const res = await request(app).
            get('/api/v1/auth/teachers/access-token').
            send({}).
            expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Refresh token is required');
        });
    });
});
