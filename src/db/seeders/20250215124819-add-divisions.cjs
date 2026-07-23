'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // 1. Fetch all necessary data to create relationships
        const branches = await queryInterface.sequelize.query(
            `SELECT branch_id, branch_name FROM branches;`,
            { type: queryInterface.sequelize.QueryTypes.SELECT }
        );
        const semesters = await queryInterface.sequelize.query(
            `SELECT semester_id, branch_id, semester_number FROM semesters;`,
            { type: queryInterface.sequelize.QueryTypes.SELECT }
        );

        const compBranchId = branches.find(b => b.branch_name === 'Computer Engineering')?.branch_id;
        const civilBranchId = branches.find(b => b.branch_name === 'Civil Engineering')?.branch_id;

        if (!compBranchId || !civilBranchId) {
            throw new Error('Required branches not found.');
        }

        // Helper function to find the correct semester UUID
        const getSemesterId = (branchId, semesterNumber) => {
            const semester = semesters.find(s => s.branch_id === branchId && s.semester_number === semesterNumber);
            return semester ? semester.semester_id : null;
        };

        // 2. Prepare the division data for insertion
        const divisionsToInsert = [
            // Comp Divisions
            { division_code: 'A', semester_id: getSemesterId(compBranchId, 7) },
            { division_code: 'B', semester_id: getSemesterId(compBranchId, 7) },
            { division_code: 'A', semester_id: getSemesterId(compBranchId, 5) },
            { division_code: 'B', semester_id: getSemesterId(compBranchId, 5) },
            { division_code: 'A', semester_id: getSemesterId(compBranchId, 3) },
            { division_code: 'B', semester_id: getSemesterId(compBranchId, 3) },
            { division_code: 'A', semester_id: getSemesterId(compBranchId, 1) },
            { division_code: 'B', semester_id: getSemesterId(compBranchId, 1) },
            // Civil Divisions
            { division_code: 'A', semester_id: getSemesterId(civilBranchId, 1) },
            { division_code: 'B', semester_id: getSemesterId(civilBranchId, 1) },
        ].map(div => ({
            division_id: uuidv4(),
            ...div,
            created_at: new Date(),
            updated_at: new Date()
        }));

        await queryInterface.bulkInsert('divisions', divisionsToInsert, {});

        // Seed optional courses for Comp Sem 7 divisions based on division code
        const courses = await queryInterface.sequelize.query(
            `SELECT course_id, course_name FROM courses;`,
            { type: queryInterface.sequelize.QueryTypes.SELECT }
        );

        const compSem7Divisions = divisionsToInsert.filter(
            d => d.semester_id === getSemesterId(compBranchId, 7)
        );

        const firstDivisionOptionalCourseNames = ['Natural Language Processing', 'Natural Language Processing Lab', 'Block Chain', 'Block Chain Lab', 'Cyber Security and Laws'];
        const lastDivisionOptionalCourseNames = ['Quantum Computing', 'Quantum Computing Lab', 'Block Chain', 'Block Chain Lab', 'Cyber Security and Laws'];

        const divisionCoursesToInsert = [];

        const addOptionalCoursesForDivision = (division, optionalCourseNames) => {
            if (!division) {
                return;
            }

            const optionalCourses = courses.filter(c => optionalCourseNames.includes(c.course_name));

            optionalCourses.forEach(course => {
                divisionCoursesToInsert.push({
                    division_courses_id: uuidv4(),
                    division_id: division.division_id,
                    course_id: course.course_id,
                    created_at: new Date(),
                    updated_at: new Date()
                });
            });
        };

        compSem7Divisions.forEach(division => {
            if (division.division_code === 'A') {
                addOptionalCoursesForDivision(division, firstDivisionOptionalCourseNames);
            }

            if (division.division_code === 'B') {
                addOptionalCoursesForDivision(division, lastDivisionOptionalCourseNames);
            }
        });

        if (divisionCoursesToInsert.length > 0) {
            await queryInterface.bulkInsert('division_courses', divisionCoursesToInsert, {});
        }
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('division_courses', null, {});
        await queryInterface.bulkDelete('divisions', null, {});
    }
};
