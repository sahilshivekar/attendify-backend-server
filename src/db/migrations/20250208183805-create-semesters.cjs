'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable(
            'semesters', {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true,
                    field: 'semester_id'
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
                semesterNumber: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    field: 'semester_number'
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
                schemeId: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    field: 'scheme_id',
                    references: {
                        model: 'schemes',
                        key: 'scheme_id'
                    },
                    onDelete: 'CASCADE'
                },
                startDate: {
                    type: Sequelize.DATEONLY,
                    allowNull: false,
                    field: 'start_date'
                },
                endDate: {
                    type: Sequelize.DATEONLY,
                    allowNull: false,
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
                freezeTableName: true,
                uniqueKeys: {
                    semester_unique: {
                        fields: ['branch_id', 'semester_number', 'academic_start_year', 'academic_end_year', 'scheme_id']
                    }
                }
            }
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('semesters');
    }
};
