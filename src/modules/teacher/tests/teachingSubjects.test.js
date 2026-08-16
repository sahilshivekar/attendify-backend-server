import request from 'supertest';
import httpStatus from 'http-status';
import app from '../../../app.js';
import setupTestDb from '../../../test/util/setupTestDb.js';

import Admin from '../../../db/models/admin.model.js';
import Teacher from '../../../db/models/teacher.model.js';
import University from '../../../db/models/university.model.js';
import Scheme from '../../../db/models/scheme.model.js';
import Course from '../../../db/models/course.model.js';
import TeacherTeachesCourse from '../../../db/models/teacherTeachesCourse.model.js';

setupTestDb();

describe('Teacher API - Teaching Courses', () => {
    let adminToken;
    let teacherToken;
    let teacher;
    let course;

    beforeEach(async () => {
        try {
            await Admin.create({
                email: 'admin@example.com',
                username: 'adminuser',
                password: 'Admin@12345'
            });
            const adminLoginRes = await request(app).post('/api/v1/auth/admins/login').send({
                emailOrUsername: 'admin@example.com',
                password: 'Admin@12345'
            });
            adminToken = adminLoginRes.body.data.accessToken;

            teacher = await Teacher.create({
                firstName: 'Sub',
                lastName: 'Jects',
                email: 'subj@example.com',
                phoneNumber: '+911234588888',
                password: 'Teacher@123',
                gender: 'Male',
                role: 'Teacher'
            });
            const teacherLoginRes = await request(app).post('/api/v1/auth/teachers/login').send({
                email: 'subj@example.com',
                password: 'Teacher@123'
            });
            teacherToken = teacherLoginRes.body.data.accessToken;
            const university = await University.create({
                name: 'Tech University',
                abbreviation: 'TU'
            });
            const scheme = await Scheme.create({
                name: 'CS 2026',
                universityId: university.id
            });
            course = await Course.create({
                name: 'Networks',
                code: 'CS203',
                schemeId: scheme.id,
                optionalCourse: null
            });
        } catch (err) {

            console.error('beforeEach setup error:', err);
            throw err;
        }
    });

    test('POST /courses - admin only, validation, 404s, duplicate, success', async () => {

        let res = await request(app).post('/api/v1/teachers/courses').send({
            teacherId: teacher.id,
            courseId: course.id
        });
        expect(res.status).toBe(httpStatus.UNAUTHORIZED);

        res = await request(app).
        post('/api/v1/teachers/courses').
        set('Authorization', `Bearer ${teacherToken}`).
        send({
            teacherId: teacher.id,
            courseId: course.id
        });
        expect(res.status).toBe(httpStatus.FORBIDDEN);

        res = await request(app).post('/api/v1/teachers/courses').set('Authorization', `Bearer ${adminToken}`).send({
            teacherId: 'not-a-uuid',
            courseId: 'also-not'
        });
        expect(res.status).toBe(httpStatus.BAD_REQUEST);

        res = await request(app).post('/api/v1/teachers/courses').set('Authorization', `Bearer ${adminToken}`).send({
            teacherId: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
            courseId: course.id
        });
        expect(res.status).toBe(httpStatus.NOT_FOUND);
        expect(res.body.message).toBe('Teacher not found');

        res = await request(app).post('/api/v1/teachers/courses').set('Authorization', `Bearer ${adminToken}`).send({
            teacherId: teacher.id,
            courseId: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa'
        });
        expect(res.status).toBe(httpStatus.NOT_FOUND);
        expect(res.body.message).toBe('Course not found');

        res = await request(app).post('/api/v1/teachers/courses').set('Authorization', `Bearer ${adminToken}`).send({
            teacherId: teacher.id,
            courseId: course.id
        });
        expect(res.status).toBe(httpStatus.CREATED);
        const ttc = await TeacherTeachesCourse.findOne({
            where: {
                teacherId: teacher.id,
                courseId: course.id
            }
        });
        expect(ttc).not.toBeNull();

        res = await request(app).post('/api/v1/teachers/courses').set('Authorization', `Bearer ${adminToken}`).send({
            teacherId: teacher.id,
            courseId: course.id
        });
        expect(res.status).toBe(httpStatus.BAD_REQUEST);
        expect(res.body.message).toBe('Course is already assigned to this teacher member');
    });

    test('GET /courses - includes Course->Scheme', async () => {

        await TeacherTeachesCourse.create({
            teacherId: teacher.id,
            courseId: course.id
        });
        const adminLoginRes = await request(app).post('/api/v1/auth/admins/login').send({
            emailOrUsername: 'admin@example.com',
            password: 'Admin@12345'
        });
        const token = adminLoginRes.body.data.accessToken;

        let res = await request(app).get('/api/v1/teachers/courses').query({
            teacherId: teacher.id
        });
        expect(res.status).toBe(httpStatus.UNAUTHORIZED);

        res = await request(app).get('/api/v1/teachers/courses').set('Authorization', `Bearer ${token}`).query({
            teacherId: 'not-a-uuid'
        });
        expect(res.status).toBe(httpStatus.BAD_REQUEST);

        res = await request(app).get('/api/v1/teachers/courses').set('Authorization', `Bearer ${token}`).query({
            teacherId: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa'
        });
        expect(res.status).toBe(httpStatus.NOT_FOUND);
        expect(res.body.message).toBe('Teacher not found');

        res = await request(app).get('/api/v1/teachers/courses').set('Authorization', `Bearer ${token}`).query({
            teacherId: teacher.id
        });
        expect(res.status).toBe(httpStatus.OK);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data[0]).toHaveProperty('Course');
        expect(res.body.data[0].Course).toHaveProperty('Scheme');
    });

    test('DELETE /courses/:teacherTeachesCourseId - admin only, 404 not found, 200 success', async () => {

        const entry = await TeacherTeachesCourse.create({
            teacherId: teacher.id,
            courseId: course.id
        });

        let res = await request(app).delete(`/api/v1/teachers/courses/${entry.id}`);
        expect(res.status).toBe(httpStatus.UNAUTHORIZED);

        res = await request(app).
        delete(`/api/v1/teachers/courses/${entry.id}`).
        set('Authorization', `Bearer ${teacherToken}`);
        expect(res.status).toBe(httpStatus.FORBIDDEN);

        res = await request(app).delete('/api/v1/teachers/courses/not-a-uuid').set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(httpStatus.BAD_REQUEST);
        expect(res.body.message).toContain('valid UUID');

        res = await request(app).delete('/api/v1/teachers/courses/aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa').set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(httpStatus.NOT_FOUND);
        expect(res.body.message).toBe('Teacher course not found');

        res = await request(app).delete(`/api/v1/teachers/courses/${entry.id}`).set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(httpStatus.OK);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toContain('deleted successfully');
        const found = await TeacherTeachesCourse.findByPk(entry.id);
        expect(found).toBeNull();
    });
});
