'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable(
            'timetables', {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true,
                    field: 'timetable_id'
                },
                divisionId: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    field: 'division_id',
                    references: {
                        model: 'divisions',
                        key: 'division_id'
                    },
                    onDelete: 'CASCADE',
                    unique: true
                },
                timetableVersion: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    field: 'timetable_version',
                    defaultValue: 1
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
        await queryInterface.dropTable('timetables');
    }
};
