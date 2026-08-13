'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("dropouts", {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                field: 'dropout_id'
            },
            studentId: {
                type: Sequelize.UUID,
                allowNull: false,
                field: 'dropout_student_id',
                references: {
                    model: 'students',
                    key: "student_id"
                },
                onDelete: 'CASCADE'
            },
            academicStartYear: {
                type: Sequelize.INTEGER,
                allowNull: false,
                field: 'academic_start_year'
            },
            academicEndYear: {
                type: Sequelize.INTEGER,
                allowNull: false,
                field: 'academic_end_year'
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
        await queryInterface.dropTable('dropouts');
    }
};
