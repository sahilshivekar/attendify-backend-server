'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('student_fcm_tokens', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                field: 'student_fcm_token_id'
            },
            fcmToken: {
                type: Sequelize.TEXT,
                allowNull: false,
                field: 'student_fcm_token',
                unique: {
                    msg: 'This token is already in use'
                },
                validate: {
                    notNull: {
                        msg: 'Token is not provided'
                    },
                    notEmpty: {
                        msg: 'Token cannot be empty'
                    }
                }
            },
            studentId: {
                type: Sequelize.UUID,
                allowNull: false,
                field: 'student_id',
                references: {
                    model: 'students',
                    key: "student_id"
                },

                onDelete: 'CASCADE'
            },
            deviceId: {
                type: Sequelize.STRING,
                allowNull: false,
                field: 'device_id'
            },
            deviceModel: {
                type: Sequelize.STRING,
                allowNull: true,
                field: 'device_model'
            },
            osVersion: {
                type: Sequelize.STRING,
                allowNull: true,
                field: 'os_version'
            },
            appVersion: {
                type: Sequelize.STRING,
                allowNull: true,
                field: 'app_version'
            },
            deviceType: {
                type: Sequelize.ENUM('ANDROID', 'IOS'),
                allowNull: false,
                field: 'device_type'
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
            indexes: [{
                unique: true,
                fields: ['student_id', 'device_id']
            }]

        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('student_fcm_tokens');
    }
};
