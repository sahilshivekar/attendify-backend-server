'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable(
            'batches', {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true,
                    field: 'batch_id'
                },
                batchCode: {
                    type: Sequelize.STRING(255),
                    allowNull: false,
                    field: 'batch_code'
                },
                divisionId: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    field: 'division_id',
                    references: {
                        model: 'divisions',
                        key: 'division_id'
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
                    batch_unique: {
                        fields: ['division_id', 'batch_code']
                    }
                }
            }
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('batches');
    }
};
