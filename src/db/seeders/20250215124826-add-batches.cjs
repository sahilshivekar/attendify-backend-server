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
            `SELECT semester_id, branch_id, semester_number FROM semesters;`, {
                type: queryInterface.sequelize.QueryTypes.SELECT
            }
        );
        const divisions = await queryInterface.sequelize.query(
            `SELECT division_id, semester_id, division_code FROM divisions;`, {
                type: queryInterface.sequelize.QueryTypes.SELECT
            }
        );

        const compBranchId = branches.find((b) => b.branch_name === 'Computer Engineering')?.branch_id;
        const civilBranchId = branches.find((b) => b.branch_name === 'Civil Engineering')?.branch_id;

        if (!compBranchId || !civilBranchId) {
            throw new Error('Required branches not found.');
        }

        const getDivisionId = (branchId, semesterNumber, divisionCode) => {
            const semester = semesters.find((s) => s.branch_id === branchId && s.semester_number === semesterNumber);
            if (!semester) return null;
            const division = divisions.find((d) => d.semester_id === semester.semester_id && d.division_code === divisionCode);
            return division ? division.division_id : null;
        };

        const batchesData = [

            {
                batch_code: 'BA1',
                division_id: getDivisionId(compBranchId, 7, 'A')
            },
            {
                batch_code: 'BA2',
                division_id: getDivisionId(compBranchId, 7, 'A')
            },
            {
                batch_code: 'BB1',
                division_id: getDivisionId(compBranchId, 7, 'B')
            },
            {
                batch_code: 'BB2',
                division_id: getDivisionId(compBranchId, 7, 'B')
            },

            {
                batch_code: 'TA1',
                division_id: getDivisionId(compBranchId, 5, 'A')
            },
            {
                batch_code: 'TA2',
                division_id: getDivisionId(compBranchId, 5, 'A')
            },
            {
                batch_code: 'TB1',
                division_id: getDivisionId(compBranchId, 5, 'B')
            },
            {
                batch_code: 'TB2',
                division_id: getDivisionId(compBranchId, 5, 'B')
            },

            {
                batch_code: 'SA1',
                division_id: getDivisionId(compBranchId, 3, 'A')
            },
            {
                batch_code: 'SA2',
                division_id: getDivisionId(compBranchId, 3, 'A')
            },
            {
                batch_code: 'SB1',
                division_id: getDivisionId(compBranchId, 3, 'B')
            },
            {
                batch_code: 'SB2',
                division_id: getDivisionId(compBranchId, 3, 'B')
            },

            {
                batch_code: 'FA1',
                division_id: getDivisionId(compBranchId, 1, 'A')
            },
            {
                batch_code: 'FA2',
                division_id: getDivisionId(compBranchId, 1, 'A')
            },
            {
                batch_code: 'FB1',
                division_id: getDivisionId(compBranchId, 1, 'B')
            },
            {
                batch_code: 'FB2',
                division_id: getDivisionId(compBranchId, 1, 'B')
            },

            {
                batch_code: 'FA1',
                division_id: getDivisionId(civilBranchId, 1, 'A')
            },
            {
                batch_code: 'FA2',
                division_id: getDivisionId(civilBranchId, 1, 'A')
            },
            {
                batch_code: 'FB1',
                division_id: getDivisionId(civilBranchId, 1, 'B')
            },
            {
                batch_code: 'FB2',
                division_id: getDivisionId(civilBranchId, 1, 'B')
            }
        ];

        const batchesToInsert = batchesData.
        filter((batch) => batch.division_id).
        map((batch) => ({
            batch_id: uuidv4(),
            ...batch,
            created_at: new Date(),
            updated_at: new Date()
        }));

        await queryInterface.bulkInsert('batches', batchesToInsert, {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('batches', null, {});
    }
};
