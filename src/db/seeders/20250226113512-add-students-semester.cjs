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
        const students = await queryInterface.sequelize.query(
            `SELECT student_id, first_name, last_name, admission_year FROM students;`, {
                type: queryInterface.sequelize.QueryTypes.SELECT
            }
        );
        const semesters = await queryInterface.sequelize.query(
            `SELECT semester_id, semester_number, branch_id FROM semesters;`, {
                type: queryInterface.sequelize.QueryTypes.SELECT
            }
        );

        const compBranchId = branches.find((b) => b.branch_name === 'Computer Engineering')?.branch_id;
        const civilBranchId = branches.find((b) => b.branch_name === 'Civil Engineering')?.branch_id;

        if (!compBranchId || !civilBranchId) {
            throw new Error("Comp or Civil branch ID not found!");
        }

        const getSemester = (firstName, lastName, admissionYear) => {
            let semesterNumber;
            let branchId;

            if (firstName[0] === 'F' && lastName[1] === 'o' && admissionYear === 2026) {
                semesterNumber = 1;
                branchId = compBranchId;
            } else if (firstName[0] === 'S' && lastName[1] === 'o' && admissionYear === 2025) {
                semesterNumber = 3;
                branchId = compBranchId;
            } else if (firstName[0] === 'T' && lastName[1] === 'o' && admissionYear === 2024) {
                semesterNumber = 5;
                branchId = compBranchId;
            } else if (firstName[0] === 'B' && lastName[1] === 'o' && admissionYear === 2023) {
                semesterNumber = 7;
                branchId = compBranchId;
            } else if (firstName[0] === 'F' && lastName[1] === 'i' && admissionYear === 2026) {
                semesterNumber = 1;
                branchId = civilBranchId;
            }

            if (semesterNumber && branchId) {
                return semesters.find((s) => s.semester_number === semesterNumber && s.branch_id === branchId);
            }
            return null;
        };

        const studentSemesters = students.
        map((student) => {
            const semester = getSemester(student.first_name, student.last_name, student.admission_year);
            if (semester) {
                return {
                    student_semester_id: uuidv4(),
                    student_id: student.student_id,
                    semester_id: semester.semester_id,
                    created_at: new Date(),
                    updated_at: new Date()
                };
            }
            return null;
        }).
        filter(Boolean);

        if (studentSemesters.length > 0) {
            await queryInterface.bulkInsert('students_semesters', studentSemesters, {});
        }
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('students_semesters', null, {});
    }
};
