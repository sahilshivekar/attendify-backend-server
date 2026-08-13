'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('division_courses', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                field: 'division_courses_id'
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
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('division_courses');
    }
};
