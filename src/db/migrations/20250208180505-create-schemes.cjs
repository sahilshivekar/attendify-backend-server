'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable(
            'schemes', {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true,
                    field: "scheme_id"
                },
                name: {
                    type: Sequelize.STRING(255),
                    allowNull: false,
                    unique: true,
                    field: 'scheme_name'
                },
                universityId: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    references: {
                        model: 'universities',
                        key: 'university_id'
                    },
                    onDelete: 'CASCADE',
                    field: 'university_id'
                },
                createdAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    field: "created_at",
                    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
                },
                updatedAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    field: "updated_at",
                    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
                }
            }, {
                timestamps: true,
                freezeTableName: true
            }
        );
        await queryInterface.addIndex('schemes', ['university_id']);

    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('schemes');
    }
};
