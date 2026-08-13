'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable(
            'verification_codes', {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true,
                    field: 'verification_code_id'
                },
                email: {
                    type: Sequelize.STRING,
                    allowNull: false,
                    validate: {
                        notEmpty: {
                            msg: 'Email cannot be empty'
                        },
                        isEmail: {
                            msg: 'Must be a valid email address'
                        }
                    },
                    field: 'email'
                },
                code: {
                    type: Sequelize.STRING,
                    allowNull: false,
                    validate: {
                        notEmpty: {
                            msg: 'Code cannot be empty'
                        }
                    }
                },
                expiresAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    field: 'expires_at'
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
                freezeTableName: true
            }
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('verification_codes');
    }
};
