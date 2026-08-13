'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable(
            'divisions', {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true,
                    field: 'division_id'
                },
                divisionCode: {
                    type: Sequelize.STRING(255),
                    allowNull: false,
                    field: 'division_code'
                },
                semesterId: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    field: 'semester_id',
                    references: {
                        model: 'semesters',
                        key: 'semester_id'
                    },
                    onDelete: 'CASCADE'
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
                freezeTableName: true,
                uniqueKeys: {
                    division_unique: {
                        fields: ['semester_id', 'division_code']
                    }
                }
            }
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('divisions');
    }
};
