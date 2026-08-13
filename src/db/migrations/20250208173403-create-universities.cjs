'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable(
            'universities', {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true,
                    field: 'university_id'
                },
                universityName: {
                    type: Sequelize.STRING(255),
                    allowNull: false,
                    unique: true,
                    field: "university_name"
                },
                universityAbbreviation: {
                    type: Sequelize.STRING(255),
                    allowNull: false,
                    unique: true,
                    field: 'university_abbreviation'
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
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('universities');
    }
};
