'use strict';

/** @type {import('sequelize-cli').Migration} */
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
                    model: 'students', // Name of the students table
                    key: 'student_id' // Primary key of the students table
                },
                onDelete: 'CASCADE'
            },
            batchId: {
                type: Sequelize.UUID,  // Changed to INTEGER to match batches table
                allowNull: false,
                field: 'batch_id',
                references: {
                    model: 'batches', // Name of the batches table
                    key: 'batch_id' // Primary key of the batches table
                },
                onDelete: 'CASCADE'
            },
            startDate: {
                type: Sequelize.DATEONLY, // Or DATETIME if you need time as well
                allowNull: false,
                field: 'start_date',
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            endDate: {
                type: Sequelize.DATEONLY, // Or DATETIME if you need time as well
                allowNull: true, // Allow null as it might be ongoing
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