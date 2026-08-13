'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable(
            'branches', {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true,
                    field: 'branch_id'
                },
                name: {
                    type: Sequelize.STRING(255),
                    allowNull: false,
                    unique: true,
                    field: 'branch_name'
                },
                abbreviation: {
                    type: Sequelize.STRING(255),
                    allowNull: false,
                    unique: true,
                    field: 'branch_abbreviation'
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
        await queryInterface.dropTable('branches');
    }
};
