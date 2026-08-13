'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('students_divisions', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                field: 'student_division_id'
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
            rollNo: {
                type: Sequelize.INTEGER,
                allowNull: false,
                field: 'roll_no'
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

        await queryInterface.addIndex('students_divisions', ['student_id', 'division_id']);
        await queryInterface.addIndex('students_divisions', ['student_id', 'end_date']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('students_divisions');
    }
};
