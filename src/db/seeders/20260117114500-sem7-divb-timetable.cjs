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
            `SELECT semester_id, semester_number, branch_id, start_date, end_date
             FROM semesters
             WHERE branch_id = '${compBranchId}' AND semester_number = 7
               AND academic_start_year = 2026 AND academic_end_year = 2027;`, {
                type: queryInterface.sequelize.QueryTypes.SELECT
            }
        );
        const semester7 = semesters[0];
        if (!semester7) throw new Error('Semester 7 (Comp, 2026-27) not found.');

        const activeFrom = semester7.start_date;
        const activeTill = semester7.end_date;

        const divisions = await queryInterface.sequelize.query(
            `SELECT division_id, division_code FROM divisions WHERE semester_id = '${semester7.semester_id}';`, {
                type: queryInterface.sequelize.QueryTypes.SELECT
            }
        );

        const divisionB = divisions.find((d) => d.division_code === 'B');
        if (!divisionB) throw new Error('Division B of Semester 7 not found.');

        const batches = await queryInterface.sequelize.query(
            `SELECT batch_id, batch_code FROM batches WHERE division_id = '${divisionB.division_id}';`, {
                type: queryInterface.sequelize.QueryTypes.SELECT
            }
        );

        const bb1 = batches.find((b) => b.batch_code === 'BB1');
        const bb2 = batches.find((b) => b.batch_code === 'BB2');
        if (!bb1 || !bb2) throw new Error('Batches BB1 / BB2 not found for Division B.');

        const courseNames = [
            'Quantum Computing', 'Quantum Computing Lab',
            'Block Chain', 'Block Chain Lab', 'Cyber Security and Laws',
            'Big Data Analytics Lab', 'Machine Learning Lab', 'Big Data Analytics',
            'Machine Learning'
        ];

        const coursesRaw = await queryInterface.sequelize.query(
            `SELECT course_id, course_name FROM courses WHERE course_name IN (${courseNames.map((n) => `'${n}'`).join(', ')});`, {
                type: queryInterface.sequelize.QueryTypes.SELECT
            }
        );
        const courseMap = {};
        coursesRaw.forEach((c) => {
            courseMap[c.course_name] = c.course_id;
        });
        const missingCourses = courseNames.filter((n) => !courseMap[n]);
        if (missingCourses.length > 0) throw new Error(`Courses not found: ${missingCourses.join(', ')}`);

        const teacherRows = await queryInterface.sequelize.query(
            `SELECT teacher_id, first_name, last_name FROM teacher
             WHERE (first_name = 'Dhananjay'        AND last_name = 'Raut')
                OR (first_name = 'Rucha' AND last_name = 'Patwardhan')
                OR (first_name = 'Renuka'        AND last_name = 'Sanga')
                OR (first_name = 'Sandeep'       AND last_name = 'More');`, {
                type: queryInterface.sequelize.QueryTypes.SELECT
            }
        );

        const teacherByName = (firstName, lastName) => {
            const teacher = teacherRows.find(
                (t) => t.first_name === firstName && t.last_name === lastName
            );
            if (!teacher) {
                throw new Error(`Teacher not found: ${firstName} ${lastName}`);
            }
            return teacher.teacher_id;
        };

        const teacherMap = {
            'Machine Learning': teacherByName('Dhananjay', 'Raut'),
            'Machine Learning Lab': teacherByName('Dhananjay', 'Raut'),
            'Cyber Security and Laws': teacherByName('Rucha', 'Patwardhan'),
            'Block Chain': teacherByName('Renuka', 'Sanga'),
            'Block Chain Lab': teacherByName('Renuka', 'Sanga'),
            'Big Data Analytics': teacherByName('Sandeep', 'More'),
            'Big Data Analytics Lab': teacherByName('Sandeep', 'More'),
            'Quantum Computing': teacherByName('Rucha', 'Patwardhan'),
            'Quantum Computing Lab': teacherByName('Rucha', 'Patwardhan')
        };

        const existingAssignments = await queryInterface.sequelize.query(
            `SELECT teacher_id, course_id FROM teacher_teaches_course;`, {
                type: queryInterface.sequelize.QueryTypes.SELECT
            }
        );
        const assignmentSet = new Set(
            existingAssignments.map((r) => `${r.teacher_id}__${r.course_id}`)
        );

        const newAssignments = courseNames.
        map((name) => ({
            teacher_course_id: uuidv4(),
            teacher_id: teacherMap[name],
            course_id: courseMap[name],
            created_at: new Date(),
            updated_at: new Date()
        })).
        filter((r) => !assignmentSet.has(`${r.teacher_id}__${r.course_id}`));

        if (newAssignments.length > 0) {
            await queryInterface.bulkInsert('teacher_teaches_course', newAssignments);
        }

        const classroomsRaw = await queryInterface.sequelize.query(
            `SELECT room_id FROM rooms WHERE room_type = 'Classroom' AND room_number = '404' LIMIT 1;`, {
                type: queryInterface.sequelize.QueryTypes.SELECT
            }
        );
        const labRoomsRaw = await queryInterface.sequelize.query(
            `SELECT room_id, room_number FROM rooms 
             WHERE room_type = 'Lab' AND room_number IN ('702', '701', '501', '704');`, {
                type: queryInterface.sequelize.QueryTypes.SELECT
            }
        );
        if (classroomsRaw.length === 0) throw new Error('No Classroom room with number 404 found.');
        if (labRoomsRaw.length < 3) throw new Error('Not enough Lab rooms found (need 201, 108, 501).');

        const lectureRoomId = classroomsRaw[0].room_id;

        const getLabRoomId = (roomNumber) => {
            const room = labRoomsRaw.find((r) => r.room_number === roomNumber);
            if (!room) {
                throw new Error(`Lab room with number ${roomNumber} not found.`);
            }
            return room.room_id;
        };

        const labRoomMap = {
            'Quantum Computing Lab': getLabRoomId('501'),
            'Block Chain Lab': getLabRoomId('702'),
            'Machine Learning Lab': getLabRoomId('704'),
            'Big Data Analytics Lab': getLabRoomId('701')
        };

        const existingTimetables = await queryInterface.sequelize.query(
            `SELECT timetable_id FROM timetables WHERE division_id = '${divisionB.division_id}';`, {
                type: queryInterface.sequelize.QueryTypes.SELECT
            }
        );
        let timetableId;
        if (existingTimetables.length > 0) {
            timetableId = existingTimetables[0].timetable_id;
        } else {
            timetableId = uuidv4();
            await queryInterface.bulkInsert('timetables', [{
                timetable_id: timetableId,
                division_id: divisionB.division_id,
                timetable_version: 1,
                created_at: new Date(),
                updated_at: new Date()
            }]);
        }

        const classes = [];

        const lectures = [

            {
                day: "Monday",
                courseName: "Big Data Analytics",
                start: "10:00:00",
                end: "11:00:00"
            },
            {
                day: "Monday",
                courseName: "Cyber Security and Laws",
                start: "11:00:00",
                end: "12:00:00"
            },
            {
                day: "Monday",
                courseName: "Block Chain",
                start: "14:45:00",
                end: "15:45:00"
            },
            {
                day: "Monday",
                courseName: "Quantum Computing",
                start: "12:30:00",
                end: "13:30:00"
            },

            {
                day: "Tuesday",
                courseName: "Machine Learning",
                start: "10:00:00",
                end: "11:00:00"
            },
            {
                day: "Tuesday",
                courseName: "Cyber Security and Laws",
                start: "11:00:00",
                end: "12:00:00"
            },
            {
                day: "Tuesday",
                courseName: "Big Data Analytics",
                start: "12:30:00",
                end: "13:30:00"
            },
            {
                day: "Tuesday",
                courseName: "Block Chain",
                start: "14:45:00",
                end: "15:45:00"
            },
            {
                day: "Tuesday",
                courseName: "Quantum Computing",
                start: "13:30:00",
                end: "14:30:00"
            },

            {
                day: "Wednesday",
                courseName: "Big Data Analytics",
                start: "10:00:00",
                end: "11:00:00"
            },
            {
                day: "Wednesday",
                courseName: "Cyber Security and Laws",
                start: "11:00:00",
                end: "12:00:00"
            },
            {
                day: "Wednesday",
                courseName: "Block Chain",
                start: "14:45:00",
                end: "15:45:00"
            },

            {
                day: "Thursday",
                courseName: "Quantum Computing",
                start: "10:00:00",
                end: "11:00:00"
            },
            {
                day: "Thursday",
                courseName: "Machine Learning",
                start: "11:00:00",
                end: "12:00:00"
            },
            {
                day: "Thursday",
                courseName: "Block Chain",
                start: "14:45:00",
                end: "15:45:00"
            },

            {
                day: "Friday",
                courseName: "Machine Learning",
                start: "14:45:00",
                end: "15:45:00"
            }
        ];

        const labs = [

            {
                day: "Wednesday",
                courseName: "Quantum Computing Lab",
                batch: bb1.batch_id,
                start: "12:30:00",
                end: "14:30:00"
            },

            {
                day: "Thursday",
                courseName: "Machine Learning Lab",
                batch: bb1.batch_id,
                start: "12:30:00",
                end: "14:30:00"
            },
            {
                day: "Thursday",
                courseName: "Block Chain Lab",
                batch: bb2.batch_id,
                start: "12:30:00",
                end: "14:30:00"
            },

            {
                day: "Friday",
                courseName: "Big Data Analytics Lab",
                batch: bb2.batch_id,
                start: "10:00:00",
                end: "12:00:00"
            },
            {
                day: "Friday",
                courseName: "Machine Learning Lab",
                batch: bb2.batch_id,
                start: "12:30:00",
                end: "14:30:00"
            },
            {
                day: "Friday",
                courseName: "Block Chain Lab",
                batch: bb1.batch_id,
                start: "12:30:00",
                end: "14:30:00"
            }
        ];

        for (const lecture of lectures) {
            classes.push({
                class_id: uuidv4(),
                teacher_id: teacherMap[lecture.courseName],
                course_id: courseMap[lecture.courseName],
                room_id: lectureRoomId,
                timetable_id: timetableId,
                batch_id: null,
                day_of_week: lecture.day,
                start_time: lecture.start,
                end_time: lecture.end,
                is_extra_class: false,
                active_from: activeFrom,
                active_till: activeTill,
                created_at: new Date(),
                updated_at: new Date()
            });
        }

        for (const lab of labs) {
            classes.push({
                class_id: uuidv4(),
                teacher_id: teacherMap[lab.courseName],
                course_id: courseMap[lab.courseName],
                room_id: labRoomMap[lab.courseName],
                timetable_id: timetableId,
                batch_id: lab.batch,
                day_of_week: lab.day,
                start_time: lab.start,
                end_time: lab.end,
                is_extra_class: false,
                active_from: activeFrom,
                active_till: activeTill,
                created_at: new Date(),
                updated_at: new Date()
            });
        }

        await queryInterface.bulkInsert('classes', classes, {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('classes', null, {});
        await queryInterface.bulkDelete('timetables', null, {});
        await queryInterface.bulkDelete('teacher_teaches_course', null, {});
    }
};
