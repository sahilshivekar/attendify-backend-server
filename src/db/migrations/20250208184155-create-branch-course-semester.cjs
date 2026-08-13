'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable(
            'branch_course_semesters', {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true,
                    field: 'branch_course_semester_id'
                },
                branchId: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    references: {
                        model: 'branches',
                        key: 'branch_id'
                    },
                    onDelete: 'CASCADE',
                    field: 'branch_id'
                },
                courseId: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    references: {
                        model: 'courses',
                        key: 'course_id'
                    },
                    onDelete: 'CASCADE',
                    field: 'course_id'
                },
                semesterNumber: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    field: 'semester_number'
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

        await queryInterface.addIndex('branch_course_semesters', ['branch_id', 'semester_number']);
        await queryInterface.addIndex('branch_course_semesters', ['course_id']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('branch_course_semesters');
    }
};
