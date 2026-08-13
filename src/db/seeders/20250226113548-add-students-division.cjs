'use strict';

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
        const semesters = await queryInterface.sequelize.query(
            `SELECT semester_id, semester_number, branch_id FROM semesters;`, {
                type: queryInterface.sequelize.QueryTypes.SELECT
            }
        );
        const divisions = await queryInterface.sequelize.query(
            `SELECT division_id, semester_id, division_code FROM divisions;`, {
                type: queryInterface.sequelize.QueryTypes.SELECT
            }
        );
        const students = await queryInterface.sequelize.query(
            `SELECT student_id, branch_id FROM students;`, {
                type: queryInterface.sequelize.QueryTypes.SELECT
            }
        );
        const studentSemesters = await queryInterface.sequelize.query(
            `SELECT student_id, semester_id FROM students_semesters;`, {
                type: queryInterface.sequelize.QueryTypes.SELECT
            }
        );

        const compBranchId = branches.find((b) => b.branch_name === 'Computer Engineering')?.branch_id;
        const civilBranchId = branches.find((b) => b.branch_name === 'Civil Engineering')?.branch_id;

        if (!compBranchId || !civilBranchId) {
            throw new Error("Required branches not found.");
        }

        const allEntries = [];

        const processStudentsForSemester = (semesterNumber, branchId) => {
            const semester = semesters.find((s) => s.semester_number === semesterNumber && s.branch_id === branchId);
            if (!semester) return;

            const semesterDivisions = divisions.filter((d) => d.semester_id === semester.semester_id).sort((a, b) => a.division_code.localeCompare(b.division_code));
            if (semesterDivisions.length < 2) return;

            const divisionA_Id = semesterDivisions[0].division_id;
            const divisionB_Id = semesterDivisions[1].division_id;

            const studentsInSemester = studentSemesters.
            filter((ss) => ss.semester_id === semester.semester_id).
            map((ss) => students.find((s) => s.student_id === ss.student_id)).
            filter(Boolean);
            studentsInSemester.forEach((student, index) => {
                allEntries.push({
                    student_division_id: uuidv4(),
                    student_id: student.student_id,
                    division_id: index < 30 ? divisionA_Id : divisionB_Id,
                    roll_no: index + 1,
                    start_date: '2026-07-06',
                    created_at: new Date(),
                    updated_at: new Date()
                });
            });
        };

        processStudentsForSemester(1, compBranchId);
        processStudentsForSemester(3, compBranchId);
        processStudentsForSemester(5, compBranchId);
        processStudentsForSemester(7, compBranchId);
        processStudentsForSemester(1, civilBranchId);

        if (allEntries.length > 0) {
            await queryInterface.bulkInsert("students_divisions", allEntries, {});
        }
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('students_divisions', null, {});
    }
};
