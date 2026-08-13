'use strict';

const bcrypt = require('bcrypt');
const {
    v4: uuidv4
} = require('uuid');

module.exports = {
    async up(queryInterface, Sequelize) {

        const password = await bcrypt.hash(
            process.env.ADMIN_PASSWORD,
            Number(process.env.BCRYPT_SALT));

        await queryInterface.bulkInsert(
            "admins",
            [{
                admin_id: uuidv4(),
                admin_email: process.env.ADMIN_EMAIL,
                admin_username: process.env.ADMIN_USERNAME,
                admin_password: password,
                created_at: new Date(),
                updated_at: new Date()
            }],

            {}
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete(
            "admins",
            null, {}
        );
    }
};
