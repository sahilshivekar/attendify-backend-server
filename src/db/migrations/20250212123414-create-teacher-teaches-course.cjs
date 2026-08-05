'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable(
            'teacher_teaches_course',
            {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true,
                    field: 'teacher_course_id',
                },
                teacherId: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    field: 'teacher_id',
                    references: {
                        model: 'teacher',
                        key: 'teacher_id',
                    },
                    onDelete: 'CASCADE',
                },
                courseId: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    field: 'course_id',
                    references: {
                        model: 'courses', // Adjust based on actual course table name
                        key: 'course_id',
                    },
                    onDelete: 'CASCADE',
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
                },
            },
            {
                timestamps: true,
                freezeTableName: true,
                uniqueKeys: {
                    one_course_for_one_teacher_only_once: {
                        fields: ['teacher_id', 'course_id'],
                    }
                }
            }
        );

        await queryInterface.addIndex('teacher_teaches_course', ['course_id']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('teacher_teaches_course');
    },
};
