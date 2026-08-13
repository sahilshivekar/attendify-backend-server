'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable(
            'teacher', {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true,
                    field: 'teacher_id'
                },
                firstName: {
                    type: Sequelize.STRING(255),
                    allowNull: false,
                    field: 'first_name'
                },
                middleName: {
                    type: Sequelize.STRING(255),
                    allowNull: true,
                    field: 'middle_name'
                },
                lastName: {
                    type: Sequelize.STRING(255),
                    allowNull: false,
                    field: 'last_name'
                },
                teacherImageUrl: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                    field: 'teacher_image_url'
                },
                teacherImagePublicId: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                    field: 'teacher_image_public_id'
                },
                email: {
                    type: Sequelize.STRING(255),
                    allowNull: false,
                    unique: true,
                    field: 'teacher_email'
                },
                phoneNumber: {
                    type: Sequelize.STRING(15),
                    allowNull: false,
                    field: 'teacher_phone_number',
                    unique: true
                },
                gender: {
                    type: Sequelize.ENUM('Male', 'Female', 'Other'),
                    allowNull: false,
                    field: 'teacher_gender'
                },
                highestQualification: {
                    type: Sequelize.STRING(255),
                    allowNull: true,
                    field: 'teacher_highest_qualification'
                },
                role: {
                    type: Sequelize.ENUM('Teacher', 'Head of Department', 'Principal'),
                    allowNull: true,
                    field: 'teacher_role'
                },
                password: {
                    type: Sequelize.STRING(255),
                    allowNull: false,
                    field: 'teacher_password',
                    defaultValue: 'Teacher@123'
                },
                refreshToken: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                    field: 'refresh_token'
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
                isActive: {
                    type: Sequelize.BOOLEAN,
                    allowNull: false,
                    field: 'is_active',
                    defaultValue: true
                }
            }, {
                timestamps: true,
                freezeTableName: true
            }
        );

        await queryInterface.addIndex('teacher', ['first_name', 'last_name']);
        await queryInterface.addIndex('teacher', ['is_active']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('teacher');
    }
};
