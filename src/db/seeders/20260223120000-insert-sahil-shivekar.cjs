'use strict';

const bcrypt = require('bcrypt');
const {
    v4: uuidv4
} = require('uuid');

module.exports = {
    async up(queryInterface, Sequelize) {

        const branches = await queryInterface.sequelize.query(
            `SELECT branch_id, branch_name FROM branches;`, {
                type: queryInterface.sequelize.QueryTypes.SELECT
            }
        );
        const schemes = await queryInterface.sequelize.query(
            `SELECT scheme_id, scheme_name FROM schemes;`, {
                type: queryInterface.sequelize.QueryTypes.SELECT
            }
        );
        const semesters = await queryInterface.sequelize.query(
            `SELECT semester_id, branch_id, semester_number, academic_start_year, academic_end_year FROM semesters;`, {
                type: queryInterface.sequelize.QueryTypes.SELECT
            }
        );
        const divisions = await queryInterface.sequelize.query(
            `SELECT division_id, semester_id, division_code FROM divisions;`, {
                type: queryInterface.sequelize.QueryTypes.SELECT
            }
        );
        const batches = await queryInterface.sequelize.query(
            `SELECT batch_id, division_id, batch_code FROM batches;`, {
                type: queryInterface.sequelize.QueryTypes.SELECT
            }
        );

        const branchIdMap = branches.reduce((map, branch) => {
            map[branch.branch_name] = branch.branch_id;
            return map;
        }, {});

        const schemeIdMap = schemes.reduce((map, scheme) => {
            map[scheme.scheme_name] = scheme.scheme_id;
            return map;
        }, {});

        const revScheme = schemes.find((s) => s.scheme_name.includes('REV-2019') && s.scheme_name.includes('Scheme'));
        if (!branchIdMap['Computer Engineering'] || !revScheme) {
            throw new Error('Required branches or schemes not found for student seeding.');
        }

        const compBranchId = branchIdMap['Computer Engineering'];
        const semester = semesters.find((s) =>
            s.branch_id === compBranchId &&
            s.semester_number === 7 &&
            s.academic_start_year === 2026 &&
            s.academic_end_year === 2027
        );
        if (!semester) {
            throw new Error('Required semester not found.');
        }

        const division = divisions.find((d) =>
            d.semester_id === semester.semester_id &&
            d.division_code === 'B'
        );
        if (!division) {
            throw new Error('Required division not found.');
        }

        const batch = batches.find((b) =>
            b.division_id === division.division_id &&
            b.batch_code === 'BB1'
        );
        if (!batch) {
            throw new Error('Required batch not found.');
        }

        const password = await bcrypt.hash('Sahil@124', Number(process.env.BCRYPT_SALT));

        const studentId = uuidv4();
        const student = {
            student_id: studentId,
            student_prn: '2023016401760532',
            first_name: 'Sahil',
            last_name: 'Shivekar',
            middle_name: 'Nilesh',
            dob: '2004-02-01',
            gender: 'Male',
            email: 'sahilshivekar124@gmail.com',
            phone_number: '+919867009968',
            password: password,
            refresh_token: null,
            student_img_url: null,
            student_img_public_id: null,
            scheme_id: revScheme.scheme_id,
            branch_id: compBranchId,
            created_at: new Date(),
            updated_at: new Date(),
            admission_year: 2024,
            admission_type: 'DSE'
        };

        await queryInterface.bulkInsert('students', [student], {});

        await queryInterface.bulkInsert('students_semesters', [{
            student_semester_id: uuidv4(),
            student_id: studentId,
            semester_id: semester.semester_id,
            created_at: new Date(),
            updated_at: new Date()
        }], {});

        const semesterDivisions = divisions.filter((d) => d.semester_id === semester.semester_id);
        if (!semesterDivisions.length) {
            throw new Error('No divisions found for the target semester when assigning roll_no.');
        }

        const divisionIdListSql = semesterDivisions.
        map((d) => `'${d.division_id}'`).
        join(', ');

        const maxRollRows = await queryInterface.sequelize.query(
            `SELECT COALESCE(MAX(roll_no), 0) AS max_roll_no
             FROM students_divisions
             WHERE division_id IN (${divisionIdListSql});`, {
                type: queryInterface.sequelize.QueryTypes.SELECT
            }
        );

        const maxRollNo = maxRollRows?.[0]?.max_roll_no || 0;

        await queryInterface.bulkInsert('students_divisions', [{
            student_division_id: uuidv4(),
            student_id: studentId,
            division_id: division.division_id,
            roll_no: maxRollNo + 1,
            start_date: '2026-07-06',
            end_date: null,
            created_at: new Date(),
            updated_at: new Date()
        }], {});

        await queryInterface.bulkInsert('students_batches', [{
            student_batch_id: uuidv4(),
            student_id: studentId,
            batch_id: batch.batch_id,
            start_date: '2026-07-06',
            end_date: null,
            created_at: new Date(),
            updated_at: new Date()
        }], {});
    },

    async down(queryInterface, Sequelize) {

        const student = await queryInterface.sequelize.query(
            `SELECT student_id FROM students WHERE student_prn = '2023016401760532';`, {
                type: queryInterface.sequelize.QueryTypes.SELECT
            }
        );
        if (student.length > 0) {
            const studentId = student[0].student_id;
            await queryInterface.bulkDelete('students_batches', {
                student_id: studentId
            }, {});
            await queryInterface.bulkDelete('students_divisions', {
                student_id: studentId
            }, {});
            await queryInterface.bulkDelete('students_semesters', {
                student_id: studentId
            }, {});
        }
        await queryInterface.bulkDelete('students', {
            student_prn: '2023016401760532'
        }, {});
    }
};
