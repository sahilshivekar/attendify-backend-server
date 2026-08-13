'use strict';

const {
    v4: uuidv4
} = require('uuid');

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('universities', [{
            university_id: uuidv4(),
            university_name: 'University of Mumbai',
            university_abbreviation: 'UOM',
            created_at: new Date(),
            updated_at: new Date()
        }]);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('universities', {
            university_name: 'University of Mumbai'
        });
    }
};
