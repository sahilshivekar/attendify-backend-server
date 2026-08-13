'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable(
            'courses', {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true,
                    field: 'course_id'
                },
                schemeId: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    references: {
                        model: 'schemes',
                        key: 'scheme_id'
                    },
                    onDelete: 'CASCADE',
                    field: 'scheme_id'
                },
                courseCode: {
                    type: Sequelize.STRING(255),
                    allowNull: false,
                    unique: true,
                    field: 'course_code'
                },
                courseName: {
                    type: Sequelize.STRING(255),
                    allowNull: false,
                    field: 'course_name'
                },
                courseType: {
                    type: Sequelize.ENUM('Lecture', 'Practical'),
                    allowNull: false,
                    field: 'course_type'
                },
                optionalCourse: {
                    type: Sequelize.STRING(255),
                    allowNull: true,
                    field: 'course_optional_course'
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
            }
        );

        await queryInterface.addIndex('courses', ['course_name']);
        await queryInterface.addIndex('courses', ['scheme_id']);
        await queryInterface.addIndex('courses', ['course_optional_course']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('courses');
    }
};
