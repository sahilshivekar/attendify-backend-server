'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        if (queryInterface.sequelize.getDialect() !== 'postgres') return;

        await queryInterface.sequelize.query("ALTER TYPE \"enum_rooms_room_type\" ADD VALUE IF NOT EXISTS 'Classroom';");
        await queryInterface.sequelize.query("ALTER TYPE \"enum_rooms_room_type\" ADD VALUE IF NOT EXISTS 'Lab';");
        await queryInterface.sequelize.query("ALTER TYPE \"enum_rooms_room_type\" ADD VALUE IF NOT EXISTS 'Office';");
    },
    async down(queryInterface, Sequelize) {

    }
};
