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
        const compBranch = branches.find((b) => b.branch_name === 'Computer Engineering');
        const civilBranch = branches.find((b) => b.branch_name === 'Civil Engineering');

        if (!compBranch || !civilBranch) {
            throw new Error('Could not find Computer Engineering or Civil Engineering branches in the database.');
        }

        const courses = await queryInterface.sequelize.query(
            `SELECT course_id, course_code FROM courses;`, {
                type: queryInterface.sequelize.QueryTypes.SELECT
            }
        );
        const courseIdMap = courses.reduce((map, course) => {
            map[course.course_code] = course.course_id;
            return map;
        }, {});

        const branchCoursesData = [

            {
                branchName: 'Computer Engineering',
                semester: 1,
                codes: ['BSC101', 'BSC102', 'BSC103', 'ESC101', 'ESC102', 'BSL101', 'BSL102', 'ESL101', 'ESL102', 'AEC101', 'AEL101', 'SEC101', 'VSEC102', 'CC101']
            },
            {
                branchName: 'Computer Engineering',
                semester: 2,
                codes: ['BSC201', 'BSC202X', 'BSC203X', 'ESC201', 'PCC201X', 'BSL201X', 'BSL202X', 'ESL201', 'PCL201X', 'CC201', 'IKS201', 'VSEC201', 'VSEC202']
            },
            {
                branchName: 'Computer Engineering',
                semester: 3,
                codes: ['CSC301', 'CSC302', 'CSC303', 'CSC304', 'CSC305', 'CSL301', 'CSL302', 'CSL303', 'CSL304', 'CSM301']
            },
            {
                branchName: 'Computer Engineering',
                semester: 4,
                codes: ['CSC401', 'CSC402', 'CSC403', 'CSC404', 'CSC405', 'CSL401', 'CSL402', 'CSL403', 'CSL404', 'CSL405', 'CSM401']
            },
            {
                branchName: 'Computer Engineering',
                semester: 5,
                codes: ['CSC501', 'CSC502', 'CSC503', 'CSC504', 'CSDLO5011', 'CSDLO5012', 'CSDLO5013', 'CSL501', 'CSL502', 'CSL503', 'CSL504', 'CSM501']
            },
            {
                branchName: 'Computer Engineering',
                semester: 6,
                codes: ['CSC601', 'CSC602', 'CSC603', 'CSC604', 'CSDLO6011', 'CSDLO6012', 'CSDLO6013', 'CSL601', 'CSL602', 'CSL603', 'CSL604', 'CSL605', 'CSM601']
            },
            {
                branchName: 'Computer Engineering',
                semester: 7,
                codes: ['CSC701', 'CSC702', 'CSDC7011', 'CSDC7012', 'CSDC7013', 'CSDL7011', 'CSDL7012', 'CSDL7013', 'CSDC7021', 'CSDC7022', 'CSDC7023', 'CSDL7021', 'CSDL7022', 'CSDL7023', 'ILO7011', 'ILO7012', 'ILO7013', 'ILO7014', 'ILO7015', 'ILO7016', 'ILO7017', 'ILO7018', 'ILO7019', 'CSL701', 'CSL702', 'CSP701']
            },
            {
                branchName: 'Computer Engineering',
                semester: 8,
                codes: ['CSC801', 'CSL801', 'CSP801', 'CSDC8011', 'CSDC8012', 'CSDC8013', 'CSDL8011', 'CSDL8012', 'CSDL8013', 'CSDC8021', 'CSDC8022', 'CSDC8023', 'CSDL8021', 'CSDL8022', 'CSDL8023', 'ILO8021', 'ILO8022', 'ILO8023', 'ILO8024', 'ILO8025', 'ILO8026', 'ILO8027', 'ILO8028', 'ILO8029']
            },

            {
                branchName: 'Civil Engineering',
                semester: 1,
                codes: ['BSC101', 'BSC102', 'BSC103', 'ESC101', 'ESC102', 'BSL101', 'BSL102', 'ESL101', 'ESL102', 'AEC101', 'AEL101', 'SEC101', 'VSEC102', 'CC101']
            },
            {
                branchName: 'Civil Engineering',
                semester: 2,
                codes: ['BSC201', 'BSC202X', 'BSC203X', 'ESC201', 'PCC201X', 'BSL201X', 'BSL202X', 'ESL201', 'PCL201X', 'CC201', 'IKS201', 'VSEC201', 'VSEC202']
            },
            {
                branchName: 'Civil Engineering',
                semester: 3,
                codes: ['CEC301', 'CEC302', 'CEC303', 'CEC304', 'CEC305', 'CEL301', 'CEL302', 'CEL303', 'CEL304', 'CEL305', 'CEM301']
            },
            {
                branchName: 'Civil Engineering',
                semester: 4,
                codes: ['CEC401', 'CEC402', 'CEC403', 'CEC404', 'CEC405', 'CEL401', 'CEL402', 'CEL403', 'CEL404', 'CEL405', 'CEM401']
            },
            {
                branchName: 'Civil Engineering',
                semester: 5,
                codes: ['CEC501', 'CEC502', 'CEC503', 'CEC504', 'CEL501', 'CEL502', 'CEL503', 'CEL504', 'CEL505', 'CEM501', 'CEDLO5011', 'CEDLO5012', 'CEDLO5013', 'CEDLO5014', 'CEDLO5015', 'CEDLO5016', 'CEDLO5017']
            },
            {
                branchName: 'Civil Engineering',
                semester: 6,
                codes: ['CEC601', 'CEC602', 'CEC603', 'CEC604', 'CEL601', 'CEL602', 'CEL603', 'CEL604', 'CEL605', 'CEM601', 'CEDLO6011', 'CEDLO6012', 'CEDLO6013', 'CEDLO6014', 'CEDLO6015', 'CEDLO6016', 'CEDLO6017', 'CEDLO6018']
            },
            {
                branchName: 'Civil Engineering',
                semester: 7,
                codes: ['CEC701', 'CEC702', 'CEL701', 'CEL702', 'CEP701', 'CEDLO7011', 'CEDLO7012', 'CEDLO7013', 'CEDLO7014', 'CEDLO7015', 'CEDLO7016', 'CEDLO7021', 'CEDLO7022', 'CEDLO7023', 'CEDLO7024', 'CEDLO7025', 'CEDLO7026', 'CEDLO7027', 'ILO7011', 'ILO7012', 'ILO7013', 'ILO7014', 'ILO7015', 'ILO7016', 'ILO7017', 'ILO7018', 'ILO7019']
            },
            {
                branchName: 'Civil Engineering',
                semester: 8,
                codes: ['CEC801', 'CEL801', 'CEP801', 'CEDLO8011', 'CEDLO8012', 'CEDLO8013', 'CEDLO8014', 'CEDLO8015', 'CEDLO8016', 'CEDLO8021', 'CEDLO8022', 'CEDLO8023', 'CEDLO8024', 'CEDLO8025', 'CEDLO8026', 'ILO8021', 'ILO8022', 'ILO8023', 'ILO8024', 'ILO8025', 'ILO8026', 'ILO8027', 'ILO8028', 'ILO8029']
            }
        ];

        const branchCourseSemestersToInsert = [];

        branchCoursesData.forEach((data) => {
            const branchId = data.branchName === 'Computer Engineering' ? compBranch.branch_id : civilBranch.branch_id;

            data.codes.forEach((code) => {
                const courseId = courseIdMap[code];
                if (courseId && branchId) {
                    branchCourseSemestersToInsert.push({
                        branch_course_semester_id: uuidv4(),
                        branch_id: branchId,
                        course_id: courseId,
                        semester_number: data.semester,
                        created_at: new Date(),
                        updated_at: new Date()
                    });
                }
            });
        });

        await queryInterface.bulkInsert('branch_course_semesters', branchCourseSemestersToInsert, {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('branch_course_semesters', null, {});
    }
};
