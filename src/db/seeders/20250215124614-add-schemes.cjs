'use strict';

const {
    v4: uuidv4
} = require('uuid');

module.exports = {
    async up(queryInterface, Sequelize) {

        const universities = await queryInterface.sequelize.query(
            `SELECT university_id FROM universities WHERE university_name = 'University of Mumbai';`, {
                type: queryInterface.sequelize.QueryTypes.SELECT
            }
        );

        const universityOfMumbaiId = universities[0]?.university_id;

        if (!universityOfMumbaiId) {
            throw new Error('Could not find the University of Mumbai to link schemes to.');
        }

        await queryInterface.bulkInsert('schemes', [{
                scheme_id: uuidv4(),
                scheme_name: "REV-2019 'C' Scheme",
                university_id: universityOfMumbaiId,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                scheme_id: uuidv4(),
                scheme_name: "NEP-2020 Scheme",
                university_id: universityOfMumbaiId,
                created_at: new Date(),
                updated_at: new Date()
            }
        ]);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('schemes', {
            scheme_name: {
                [Sequelize.Op.in]: ["REV-2019 'C' Scheme", "NEP-2020 Scheme"]
            }
        });
    }
};
