'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('cancelled_classes', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                field: 'cancelled_class_id'
            },
            classId: {
                type: Sequelize.UUID,
                allowNull: false,
                field: 'cancelled_class_class_id',
                references: {
                    model: 'classes',
                    key: "class_id"
                },
                onDelete: 'CASCADE'
            },
            date: {
                type: Sequelize.DATEONLY,
                allowNull: false,
                field: 'cancelled_class_date'
            },
            reason: {
                type: Sequelize.STRING,
                allowNull: true,
                field: 'cancelled_class_reason'
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
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('cancelled_classes');
    }
};
