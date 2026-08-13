'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable(
            'rooms', {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true,
                    field: 'room_id'
                },
                roomNumber: {
                    type: Sequelize.STRING,
                    allowNull: false,
                    field: 'room_number',
                    unique: true
                },
                sittingCapacity: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    field: 'sitting_capacity'
                },
                createdAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    field: 'created_at',
                    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
                },
                updatedAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    field: 'updated_at',
                    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
                }
            }, {
                timestamps: true,
                freezeTableName: true
            }
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('rooms');
    }
};
