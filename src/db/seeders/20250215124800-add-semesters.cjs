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
        const schemes = await queryInterface.sequelize.query(
            `SELECT scheme_id, scheme_name FROM schemes;`, {
                type: queryInterface.sequelize.QueryTypes.SELECT
            }
        );

        const compBranchId = branches.find((b) => b.branch_name === 'Computer Engineering')?.branch_id;
        const civilBranchId = branches.find((b) => b.branch_name === 'Civil Engineering')?.branch_id;
        const rev2019SchemeId = schemes.find((s) => s.scheme_name === "REV-2019 'C' Scheme")?.scheme_id;
        const nep2020SchemeId = schemes.find((s) => s.scheme_name === 'NEP-2020 Scheme')?.scheme_id;

        if (!compBranchId || !civilBranchId || !rev2019SchemeId || !nep2020SchemeId) {
            throw new Error('Required branches or schemes not found.');
        }

        const semestersToInsert = [

            {
                id: uuidv4(),
                branch_id: compBranchId,
                semester_number: 1,
                scheme_id: nep2020SchemeId,
                academic_start_year: 2026,
                academic_end_year: 2027,
                start_date: '2026-07-06',
                end_date: '2026-12-31'
            },

            {
                id: uuidv4(),
                branch_id: civilBranchId,
                semester_number: 1,
                scheme_id: nep2020SchemeId,
                academic_start_year: 2026,
                academic_end_year: 2027,
                start_date: '2026-07-06',
                end_date: '2026-12-31'
            },

            {
                id: uuidv4(),
                branch_id: compBranchId,
                semester_number: 3,
                scheme_id: rev2019SchemeId,
                academic_start_year: 2026,
                academic_end_year: 2027,
                start_date: '2026-07-06',
                end_date: '2026-12-31'
            },

            {
                id: uuidv4(),
                branch_id: compBranchId,
                semester_number: 5,
                scheme_id: rev2019SchemeId,
                academic_start_year: 2026,
                academic_end_year: 2027,
                start_date: '2026-07-06',
                end_date: '2026-12-31'
            },

            {
                id: uuidv4(),
                branch_id: compBranchId,
                semester_number: 7,
                scheme_id: rev2019SchemeId,
                academic_start_year: 2026,
                academic_end_year: 2027,
                start_date: '2026-07-06',
                end_date: '2026-12-31'
            }
        ].

        map((s) => ({
            ...s,
            created_at: new Date(),
            updated_at: new Date()
        }));

        await queryInterface.bulkInsert('semesters', semestersToInsert.map(({
            id,
            ...rest
        }) => ({
            semester_id: id,
            ...rest
        })));

    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('semesters', null, {});
    }
};
