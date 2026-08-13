'use strict';

const {
    v4: uuidv4
} = require('uuid');

module.exports = {
    async up(queryInterface, Sequelize) {

        const branches = await queryInterface.sequelize.query(`SELECT branch_id, branch_name FROM branches;`, {
            type: queryInterface.sequelize.QueryTypes.SELECT
        });
        const semesters = await queryInterface.sequelize.query(`SELECT semester_id, semester_number, branch_id FROM semesters;`, {
            type: queryInterface.sequelize.QueryTypes.SELECT
        });
        const divisions = await queryInterface.sequelize.query(`SELECT division_id, semester_id, division_code FROM divisions;`, {
            type: queryInterface.sequelize.QueryTypes.SELECT
        });
        const batches = await queryInterface.sequelize.query(`SELECT batch_id, division_id, batch_code FROM batches;`, {
            type: queryInterface.sequelize.QueryTypes.SELECT
        });
        const studentsDivisions = await queryInterface.sequelize.query(`SELECT student_id, division_id FROM students_divisions;`, {
            type: queryInterface.sequelize.QueryTypes.SELECT
        });

        const compBranchId = branches.find((b) => b.branch_name === 'Computer Engineering')?.branch_id;
        const civilBranchId = branches.find((b) => b.branch_name === 'Civil Engineering')?.branch_id;

        if (!compBranchId || !civilBranchId) {
            throw new Error("Required branches not found.");
        }

        const getGroupData = (semesterNumber, branchId, divisionCode) => {
            const semester = semesters.find((s) => s.semester_number === semesterNumber && s.branch_id === branchId);
            if (!semester) return {
                students: [],
                batches: []
            };

            const division = divisions.find((d) => d.semester_id === semester.semester_id && d.division_code === divisionCode);
            if (!division) return {
                students: [],
                batches: []
            };

            const groupStudents = studentsDivisions.
            filter((sd) => sd.division_id === division.division_id).
            map((sd) => sd.student_id);

            const groupBatches = batches.
            filter((b) => b.division_id === division.division_id).
            sort((a, b) => a.batch_code.localeCompare(b.batch_code));

            return {
                students: groupStudents,
                batches: groupBatches.map((b) => b.batch_id)
            };
        };

        const groups = [{
                semesterNumber: 1,
                branchId: compBranchId,
                divisionCode: 'A'
            },
            {
                semesterNumber: 1,
                branchId: compBranchId,
                divisionCode: 'B'
            },
            {
                semesterNumber: 3,
                branchId: compBranchId,
                divisionCode: 'A'
            },
            {
                semesterNumber: 3,
                branchId: compBranchId,
                divisionCode: 'B'
            },
            {
                semesterNumber: 5,
                branchId: compBranchId,
                divisionCode: 'A'
            },
            {
                semesterNumber: 5,
                branchId: compBranchId,
                divisionCode: 'B'
            },
            {
                semesterNumber: 7,
                branchId: compBranchId,
                divisionCode: 'A'
            },
            {
                semesterNumber: 7,
                branchId: compBranchId,
                divisionCode: 'B'
            },
            {
                semesterNumber: 1,
                branchId: civilBranchId,
                divisionCode: 'A'
            },
            {
                semesterNumber: 1,
                branchId: civilBranchId,
                divisionCode: 'B'
            }
        ];

        const allStudentBatchEntries = [];

        groups.forEach((group) => {
            const {
                students,
                batches
            } = getGroupData(group.semesterNumber, group.branchId, group.divisionCode);

            if (students.length >= 30 && batches.length >= 2) {
                for (let i = 0; i < 30; i++) {
                    allStudentBatchEntries.push({
                        student_batch_id: uuidv4(),
                        student_id: students[i],
                        batch_id: i < 15 ? batches[0] : batches[1],
                        start_date: '2026-07-06',
                        created_at: new Date(),
                        updated_at: new Date()
                    });
                }
            }
        });

        if (allStudentBatchEntries.length > 0) {
            await queryInterface.bulkInsert('students_batches', allStudentBatchEntries, {});
        }
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('students_batches', null, {});
    }
};
