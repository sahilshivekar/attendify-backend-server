'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('classes', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                field: 'class_id'
            },
            teacherId: {
                type: Sequelize.UUID,
                allowNull: false,
                field: 'teacher_id',
                references: {
                    model: 'teacher',
                    key: 'teacher_id'
                },
                onDelete: 'CASCADE'
            },
            startTime: {
                type: Sequelize.TIME,
                allowNull: false,
                field: 'start_time'
            },
            endTime: {
                type: Sequelize.TIME,
                allowNull: false,
                field: 'end_time'
            },
            dayOfWeek: {
                type: Sequelize.ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
                allowNull: false,
                field: 'day_of_week'
            },
            roomId: {
                type: Sequelize.UUID,
                allowNull: false,
                field: 'room_id',
                references: {
                    model: 'rooms',
                    key: 'room_id'
                },
                onDelete: 'CASCADE'
            },
            batchId: {
                type: Sequelize.UUID,
                allowNull: true,
                field: 'batch_id',
                references: {
                    model: 'batches',
                    key: 'batch_id'
                },
                onDelete: 'CASCADE'
            },
            activeFrom: {
                type: Sequelize.DATEONLY, // Or DATETIME if you need time as well
                allowNull: false,
                field: 'active_from'
            },
            activeTill: {
                type: Sequelize.DATEONLY, // Or DATETIME if you need time as well
                allowNull: true,
                field: 'active_till'
            },
            courseId: {
                type: Sequelize.UUID,
                allowNull: false,
                field: 'course_id',
                references: {
                    model: 'courses',
                    key: 'course_id'
                },
                onDelete: 'CASCADE'
            },
            timetableId: {
                type: Sequelize.UUID,
                allowNull: false,
                field: 'timetable_id',
                references: {
                    model: 'timetables',
                    key: 'timetable_id'
                },
                onDelete: 'CASCADE'
            },
            isExtraClass: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
                field: 'is_extra_class'
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

        await queryInterface.addIndex('classes', ['timetable_id']);
        await queryInterface.addIndex('classes', ['teacher_id']);
        await queryInterface.addIndex('classes', ['room_id']);
        await queryInterface.addIndex('classes', ['batch_id']);
        await queryInterface.addIndex('classes', ['course_id']);
        await queryInterface.addIndex('classes', ['day_of_week', 'start_time', 'end_time']);
        await queryInterface.addIndex('classes', ['active_from', 'active_till']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('classes');
    }
};