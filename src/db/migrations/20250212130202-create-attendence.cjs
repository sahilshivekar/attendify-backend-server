'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('attendances', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                field: 'attendance_id'
            },
            classId: {
                type: Sequelize.UUID,
                allowNull: false,
                field: 'class_id',
                references: {
                    model: 'classes',
                    key: 'class_id'
                },
                onDelete: 'CASCADE'
            },
            date: {
                type: Sequelize.DATEONLY,
                allowNull: false,
                field: 'attendance_date'
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                field: 'created_at'
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
                field: 'updated_at'
            }
        }, {
            timestamps: true,
            freezeTableName: true
        });

        await queryInterface.addIndex('attendances', ['class_id', 'attendance_date']);
        await queryInterface.addIndex('attendances', ['attendance_date']);

        // Create the join table for students and attendance
        await queryInterface.createTable('attendance_students', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                field: 'attendance_student_id'
            },
            attendanceId: {
                type: Sequelize.UUID,
                allowNull: false,
                field: 'attendance_id',
                references: {
                    model: 'attendances',
                    key: 'attendance_id'
                },

                onDelete: 'CASCADE'
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
            attendanceStatus: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                field: 'attendance_status'
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

        await queryInterface.addIndex('attendance_students', ['attendance_id', 'student_id']);
        await queryInterface.addIndex('attendance_students', ['student_id']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('attendance_students'); // Drop the join table first
        await queryInterface.dropTable('attendances');
    }
};