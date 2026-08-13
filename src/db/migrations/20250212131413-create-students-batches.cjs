'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('students_batches', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                field: 'student_batch_id'
            },
            studentId: {
                type: Sequelize.UUID,
                allowNull: false,
                field: 'student_id',
                references: {
                    model: 'students',
                    key: 'student_id'
                },
                onDelete: 'CASCADE'
            },
            batchId: {
                type: Sequelize.UUID,
                allowNull: false,
                field: 'batch_id',
                references: {
                    model: 'batches',
                    key: 'batch_id'
                },
                onDelete: 'CASCADE'
            },
            startDate: {
                type: Sequelize.DATEONLY,
                allowNull: false,
                field: 'start_date',
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            endDate: {
                type: Sequelize.DATEONLY,
                allowNull: true,
                field: 'end_date'
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
        });

        await queryInterface.addIndex('students_batches', ['student_id', 'batch_id']);
        await queryInterface.addIndex('students_batches', ['student_id', 'end_date']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('students_batches');
    }
};
