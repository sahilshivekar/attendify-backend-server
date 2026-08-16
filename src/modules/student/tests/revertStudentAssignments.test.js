import {
    jest
} from '@jest/globals';
import request from 'supertest';
import httpStatus from 'http-status';
import app from '../../../app.js';
import setupTestDb from '../../../test/util/setupTestDb.js';
import Admin from '../../../db/models/admin.model.js';
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

setupTestDb();

describe('Student Controller - Revert assignments', () => {
    let adminToken;
    let university;
    let branch;
    let scheme;
    let semester;
    let division1;
    let division2;
    let batchA;
    let batchB;
    let student;

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
            startDate: '2026-01-01',
            endDate: '2026-12-31',
            schemeId: scheme.id
        });

        division1 = await Division.create({
            divisionCode: 'A',
            semesterId: semester.id
        });
        division2 = await Division.create({
            divisionCode: 'B',
            semesterId: semester.id
        });

        batchA = await Batch.create({
            batchCode: 'Batch A',
            divisionId: division1.id
        });
        batchB = await Batch.create({
            batchCode: 'Batch B',
            divisionId: division2.id
        });

        student = await Student.create({
            prn: 'PRN001',
            firstName: 'Alice',
            lastName: 'Smith',
            email: 'alice@example.com',
            phoneNumber: '+911234567890',
            gender: 'Female',
            schemeId: scheme.id,
            admissionYear: 2025,
            admissionType: 'FE',
            branchId: branch.id
        });

        await StudentSemester.create({
            studentId: student.id,
            semesterId: semester.id
        });
    });

    test('revert addStudentToDivision removes active division and active batch under it', async () => {
        const addDivRes = await request(app).
        post('/api/v1/students/division').
        set('Authorization', `Bearer ${adminToken}`).
        send({
            studentId: student.id,
            divisionId: division1.id
        });
        expect(addDivRes.status).toBe(httpStatus.OK);

        const sd = await StudentDivision.findOne({
            where: {
                studentId: student.id,
                divisionId: division1.id,
                endDate: null
            }
        });
        const addBatchRes = await request(app).
        post('/api/v1/students/batch').
        set('Authorization', `Bearer ${adminToken}`).
        send({
            studentId: student.id,
            batchId: batchA.id
        });
        expect(addBatchRes.status).toBe(httpStatus.OK);

        const sb = await StudentBatch.findOne({
            where: {
                studentId: student.id,
                batchId: batchA.id,
                endDate: null
            }
        });
        expect(sd).toBeTruthy();
        expect(sb).toBeTruthy();

        const revertRes = await request(app).
        delete('/api/v1/students/division/revert-add').
        set('Authorization', `Bearer ${adminToken}`).
        send({
            studentDivisionId: sd.id
        });
        expect(revertRes.status).toBe(httpStatus.OK);

        const sdAfter = await StudentDivision.findByPk(sd.id);
        const sbAfter = await StudentBatch.findByPk(sb.id);
        expect(sdAfter).toBeNull();
        expect(sbAfter).toBeNull();
    });

    test('revert changeStudentDivision restores previous division as active and deletes new', async () => {

        await request(app).
        post('/api/v1/students/division').
        set('Authorization', `Bearer ${adminToken}`).
        send({
            studentId: student.id,
            divisionId: division1.id
        });
        const prevDiv = await StudentDivision.findOne({
            where: {
                studentId: student.id,
                divisionId: division1.id,
                endDate: null
            }
        });

        const changeRes = await request(app).
        put('/api/v1/students/division').
        set('Authorization', `Bearer ${adminToken}`).
        send({
            studentDivisionId: prevDiv.id,
            divisionId: division2.id,
            newDivisionStartDate: '2026-03-01'
        });
        if (changeRes.status !== httpStatus.OK) {

            console.log('changeDivision error body:', changeRes.body);
        }
        expect(changeRes.status).toBe(httpStatus.OK);

        const newDiv = await StudentDivision.findOne({
            where: {
                studentId: student.id,
                divisionId: division2.id,
                endDate: null
            }
        });
        expect(newDiv).toBeTruthy();

        await request(app).
        post('/api/v1/students/batch').
        set('Authorization', `Bearer ${adminToken}`).
        send({
            studentId: student.id,
            batchId: batchB.id
        });
        const newBatch = await StudentBatch.findOne({
            where: {
                studentId: student.id,
                batchId: batchB.id,
                endDate: null
            }
        });
        expect(newBatch).toBeTruthy();

        const revertRes = await request(app).
        delete('/api/v1/students/division/revert-change').
        set('Authorization', `Bearer ${adminToken}`).
        send({
            newStudentDivisionId: newDiv.id
        });
        expect(revertRes.status).toBe(httpStatus.OK);

        const prevDivAfter = await StudentDivision.findByPk(prevDiv.id);
        const newDivAfter = await StudentDivision.findByPk(newDiv.id);
        expect(prevDivAfter.endDate).toBeNull();
        expect(newDivAfter).toBeNull();

        const batchCleanup = await StudentBatch.findByPk(newBatch.id);
        expect(batchCleanup).toBeNull();
    });

    test('revert addStudentToBatch deletes active batch', async () => {

        await request(app).
        post('/api/v1/students/division').
        set('Authorization', `Bearer ${adminToken}`).
        send({
            studentId: student.id,
            divisionId: division1.id
        });

        const addBatchRes = await request(app).
        post('/api/v1/students/batch').
        set('Authorization', `Bearer ${adminToken}`).
        send({
            studentId: student.id,
            batchId: batchA.id
        });
        expect(addBatchRes.status).toBe(httpStatus.OK);

        const sb = await StudentBatch.findOne({
            where: {
                studentId: student.id,
                batchId: batchA.id,
                endDate: null
            }
        });
        expect(sb).toBeTruthy();

        const revertRes = await request(app).
        delete('/api/v1/students/batch/revert-add').
        set('Authorization', `Bearer ${adminToken}`).
        send({
            studentBatchId: sb.id
        });
        expect(revertRes.status).toBe(httpStatus.OK);

        const sbAfter = await StudentBatch.findByPk(sb.id);
        expect(sbAfter).toBeNull();
    });

    test('revert changeStudentBatch restores previous batch as active and deletes new', async () => {

        await request(app).
        post('/api/v1/students/division').
        set('Authorization', `Bearer ${adminToken}`).
        send({
            studentId: student.id,
            divisionId: division1.id
        });
        await request(app).
        post('/api/v1/students/batch').
        set('Authorization', `Bearer ${adminToken}`).
        send({
            studentId: student.id,
            batchId: batchA.id
        });

        const prevBatch = await StudentBatch.findOne({
            where: {
                studentId: student.id,
                batchId: batchA.id,
                endDate: null
            }
        });

        const batchC = await Batch.create({
            batchCode: 'Batch C',
            divisionId: division1.id
        });

        const changeRes = await request(app).
        put('/api/v1/students/batch').
        set('Authorization', `Bearer ${adminToken}`).
        send({
            studentBatchId: prevBatch.id,
            batchId: batchC.id,
            newBatchStartDate: '2026-04-01'
        });
        expect(changeRes.status).toBe(httpStatus.OK);

        const newBatch = await StudentBatch.findOne({
            where: {
                studentId: student.id,
                batchId: batchC.id,
                endDate: null
            }
        });
        expect(newBatch).toBeTruthy();

        const revertRes = await request(app).
        delete('/api/v1/students/batch/revert-change').
        set('Authorization', `Bearer ${adminToken}`).
        send({
            newStudentBatchId: newBatch.id
        });
        expect(revertRes.status).toBe(httpStatus.OK);

        const prevBatchAfter = await StudentBatch.findByPk(prevBatch.id);
        const newBatchAfter = await StudentBatch.findByPk(newBatch.id);
        expect(prevBatchAfter.endDate).toBeNull();
        expect(newBatchAfter).toBeNull();
    });
});
