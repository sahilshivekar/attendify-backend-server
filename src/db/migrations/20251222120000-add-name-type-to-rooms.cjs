'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {

        await queryInterface.addColumn('rooms', 'room_name', {
            type: Sequelize.STRING,
            allowNull: true
        });

        await queryInterface.addColumn('rooms', 'room_type', {
            type: Sequelize.ENUM('Classroom', 'Lab', 'Office'),
            allowNull: true
        });
    },

    async down(queryInterface, Sequelize) {

        await queryInterface.removeColumn('rooms', 'room_type');

        if (queryInterface.sequelize.getDialect() === 'postgres') {
            await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_rooms_room_type";');
        }

        await queryInterface.removeColumn('rooms', 'room_name');
    }
};
