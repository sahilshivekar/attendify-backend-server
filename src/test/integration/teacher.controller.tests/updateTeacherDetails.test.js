import request from 'supertest';
import httpStatus from 'http-status';
import app from '../../../app.js';
import setupTestDb from '../../util/setupTestDb.js';

import Admin from '../../../db/models/admin.model.js';
import Teacher from '../../../db/models/teacher.model.js';

setupTestDb();

describe('Teacher API - PUT /api/v1/teachers', () => {
  let adminToken;
  let teacherToken;
  let teacher;

  beforeEach(async () => {
    try {
      await Admin.create({ email: 'admin@example.com', username: 'adminuser', password: 'Admin@12345' });
      const adminLoginRes = await request(app).post('/api/v1/auth/admins/login').send({ emailOrUsername: 'admin@example.com', password: 'Admin@12345' });
      adminToken = adminLoginRes.body.data.accessToken;

      teacher = await Teacher.create({ firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com', phoneNumber: '+911234500000', password: 'Teacher@123', gender: 'Female', role: 'Teacher' });

      const tLogin = await request(app).post('/api/v1/auth/teachers/login').send({ email: 'jane@example.com', password: 'Teacher@123' });
      teacherToken = tLogin.body.data.accessToken;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('beforeEach setup error:', err);
      throw err;
    }
  });

  test('should return 401 when no token is provided', async () => {
    const res = await request(app).put(`/api/v1/teachers/${teacher.id}`).send({ id: teacher.id, firstName: 'New' });
    expect(res.status).toBe(httpStatus.UNAUTHORIZED);
  });

  test('should allow teacher to update details (role allowed)', async () => {
    // Reuse teacher token to simulate non-admin, should be allowed actually per routes (Admin or Teacher). So use student path? Skipping student creation; ensure teacher can update self though.
    // We'll test forbidden by using no token already; here verify teacher is allowed
    const res = await request(app).put(`/api/v1/teachers/${teacher.id}`).set('Authorization', `Bearer ${teacherToken}`).send({ id: teacher.id, firstName: 'NewName' });
    expect(res.status).toBe(httpStatus.OK);
    expect(res.body.data.firstName).toBe('NewName');
  });

  test('should return 400 for invalid id', async () => {
    const res = await request(app)
      .put(`/api/v1/teachers/${teacher.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ id: 'not-a-uuid', firstName: 'New' });
    expect(res.status).toBe(httpStatus.BAD_REQUEST);
    expect(res.body.message).toContain('Teacher ID must be a valid UUID');
  });

  test('should return 404 when teacher not found', async () => {
    const res = await request(app)
      .put('/api/v1/teachers/aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', firstName: 'New' });
    expect(res.status).toBe(httpStatus.NOT_FOUND);
    expect(res.body.message).toBe('Teacher not found');
  });

  test('should update teacher details as admin', async () => {
    const res = await request(app)
      .put(`/api/v1/teachers/${teacher.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ id: teacher.id, firstName: 'Updated', highestQualification: 'MCA', role: 'Head of Department' });
    expect(res.status).toBe(httpStatus.OK);
    expect(res.body.data).toHaveProperty('firstName', 'Updated');
    expect(res.body.data).toHaveProperty('highestQualification', 'MCA');
    expect(res.body.data).toHaveProperty('role', 'Head of Department');
  });

  test('should allow updating isActive to false', async () => {
    const res = await request(app)
      .put(`/api/v1/teachers/${teacher.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ id: teacher.id, isActive: false });

    expect(res.status).toBe(httpStatus.OK);
    expect(res.body.data).toHaveProperty('isActive', false);

    const updatedTeacher = await Teacher.findByPk(teacher.id);
    expect(updatedTeacher.isActive).toBe(false);
  });
});
