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
        const compBranchId = branches.find((b) => b.branch_name === 'Computer Engineering')?.branch_id;
        if (!compBranchId) throw new Error('Computer Engineering branch not found.');

        const semesters = await queryInterface.sequelize.query(
            `SELECT semester_id, start_date FROM semesters
                         WHERE branch_id = '${compBranchId}' AND semester_number = 7
                             AND academic_start_year = 2026 AND academic_end_year = 2027;`, {
                type: queryInterface.sequelize.QueryTypes.SELECT
            }
        );
        const semester7 = semesters[0];
        if (!semester7) throw new Error('Semester 7 (Comp, 2026-27) not found.');

        const divisions = await queryInterface.sequelize.query(
            `SELECT division_id FROM divisions
             WHERE semester_id = '${semester7.semester_id}' AND division_code = 'A';`, {
                type: queryInterface.sequelize.QueryTypes.SELECT
            }
        );
        const divisionA = divisions[0];
        if (!divisionA) throw new Error('Division A of Semester 7 not found.');

        const classes = await queryInterface.sequelize.query(
            `SELECT c.class_id, c.day_of_week, c.active_from, c.active_till, c.batch_id
             FROM classes c
             INNER JOIN timetables t ON c.timetable_id = t.timetable_id
             WHERE t.division_id = '${divisionA.division_id}';`, {
                type: queryInterface.sequelize.QueryTypes.SELECT
            }
        );
        if (classes.length === 0) throw new Error('No classes found for Division A. Run the classes seeder first.');

        const divStudents = await queryInterface.sequelize.query(
            `SELECT student_id FROM students_divisions WHERE division_id = '${divisionA.division_id}';`, {
                type: queryInterface.sequelize.QueryTypes.SELECT
            }
        );
        const divisionStudentIds = divStudents.map((s) => s.student_id);
        if (divisionStudentIds.length === 0) throw new Error('No students found in Division A.');

        const batches = await queryInterface.sequelize.query(
            `SELECT batch_id, batch_code FROM batches WHERE division_id = '${divisionA.division_id}';`, {
                type: queryInterface.sequelize.QueryTypes.SELECT
            }
        );

        const batchStudentMap = {};
        for (const batch of batches) {
            const batchStudents = await queryInterface.sequelize.query(
                `SELECT student_id FROM students_batches WHERE batch_id = '${batch.batch_id}';`, {
                    type: queryInterface.sequelize.QueryTypes.SELECT
                }
            );
            batchStudentMap[batch.batch_id] = batchStudents.map((s) => s.student_id);
        }

        const dayNameToNum = {
            Sunday: 0,
            Monday: 1,
            Tuesday: 2,
            Wednesday: 3,
            Thursday: 4,
            Friday: 5,
            Saturday: 6
        };

        const today = new Date();
        today.setHours(23, 59, 59, 999);

        const getMatchingDates = (dayOfWeek, activeFrom) => {
            const targetDay = dayNameToNum[dayOfWeek];
            const start = new Date(activeFrom);
            const end = today;
            const dates = [];

            const current = new Date(start);
            const diff = (targetDay - current.getDay() + 7) % 7;
            current.setDate(current.getDate() + diff);
            while (current <= end) {
                dates.push(current.toISOString().split('T')[0]);
                current.setDate(current.getDate() + 7);
            }
            return dates;
        };

        const attendanceRecords = [];
        const attendanceStudentRecords = [];

        for (const cls of classes) {
            const dates = getMatchingDates(cls.day_of_week, cls.active_from);

            const studentIds = cls.batch_id ?
                batchStudentMap[cls.batch_id] || [] :
                divisionStudentIds;

            if (studentIds.length === 0) continue;

            for (const date of dates) {
                const attendanceId = uuidv4();
                attendanceRecords.push({
                    attendance_id: attendanceId,
                    class_id: cls.class_id,
                    attendance_date: date,
                    created_at: new Date(),
                    updated_at: new Date()
                });

                for (const studentId of studentIds) {

                    const isPresent = Math.random() < 0.8;
                    attendanceStudentRecords.push({
                        attendance_student_id: uuidv4(),
                        attendance_id: attendanceId,
                        student_id: studentId,
                        attendance_status: isPresent,
                        created_at: new Date(),
                        updated_at: new Date()
                    });
                }
            }
        }

        const CHUNK_SIZE = 500;

        for (let i = 0; i < attendanceRecords.length; i += CHUNK_SIZE) {
            await queryInterface.bulkInsert('attendances', attendanceRecords.slice(i, i + CHUNK_SIZE));
        }

        for (let i = 0; i < attendanceStudentRecords.length; i += CHUNK_SIZE) {
            await queryInterface.bulkInsert('attendance_students', attendanceStudentRecords.slice(i, i + CHUNK_SIZE));
        }
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('attendance_students', null, {});
        await queryInterface.bulkDelete('attendances', null, {});
    }
};
