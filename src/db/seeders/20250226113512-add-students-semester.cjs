'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // 1. Fetch all necessary data to build relationships
        const branches = await queryInterface.sequelize.query(
            `SELECT branch_id, branch_name FROM branches;`,
            { type: queryInterface.sequelize.QueryTypes.SELECT }
        );
        const students = await queryInterface.sequelize.query(
            `SELECT student_id, first_name, last_name, admission_year FROM students;`,
            { type: queryInterface.sequelize.QueryTypes.SELECT }
        );
        const semesters = await queryInterface.sequelize.query(
            `SELECT semester_id, semester_number, branch_id FROM semesters;`,
            { type: queryInterface.sequelize.QueryTypes.SELECT }
        );

        const compBranchId = branches.find(b => b.branch_name === 'Computer Engineering')?.branch_id;
        const civilBranchId = branches.find(b => b.branch_name === 'Civil Engineering')?.branch_id;

        if (!compBranchId || !civilBranchId) {
            throw new Error("Comp or Civil branch ID not found!");
        }

        // 2. Helper function to find the correct semester UUID based on student info
        const getSemester = (firstName, lastName, admissionYear) => {
            let semesterNumber;
            let branchId;

            // Determine semester and branch based on student naming convention
            if (firstName[0] === 'F' && lastName[1] === 'o' && admissionYear === 2026) { // FE Comp
                semesterNumber = 1;
                branchId = compBranchId;
            } else if (firstName[0] === 'S' && lastName[1] === 'o' && admissionYear === 2025) { // SE Comp
                semesterNumber = 3;
                branchId = compBranchId;
            } else if (firstName[0] === 'T' && lastName[1] === 'o' && admissionYear === 2024) { // TE Comp
                semesterNumber = 5;
                branchId = compBranchId;
            } else if (firstName[0] === 'B' && lastName[1] === 'o' && admissionYear === 2023) { // BE Comp
                semesterNumber = 7;
                branchId = compBranchId;
            } else if (firstName[0] === 'F' && lastName[1] === 'i' && admissionYear === 2026) { // FE Civil
                semesterNumber = 1;
                branchId = civilBranchId;
            }

            if (semesterNumber && branchId) {
                return semesters.find(s => s.semester_number === semesterNumber && s.branch_id === branchId);
            }
            return null; // Return null if no match is found
        };

        // 3. Create the join table records
        const studentSemesters = students
            .map(student => {
                const semester = getSemester(student.first_name, student.last_name, student.admission_year);
                if (semester) {
                    return {
                        student_semester_id: uuidv4(),
                        student_id: student.student_id,
                        semester_id: semester.semester_id,
                        created_at: new Date(),
                        updated_at: new Date(),
                    };
                }
                return null; // Exclude students who don't match the criteria
            })
            .filter(Boolean); // Filter out any null entries

        if (studentSemesters.length > 0) {
            await queryInterface.bulkInsert('students_semesters', studentSemesters, {});
        }
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('students_semesters', null, {});
    }
};