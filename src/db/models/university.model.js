import {
    Sequelize,
    Model,
    UUIDV4
} from 'sequelize';
import sequelize from '../../config/db.connection.js';

class University extends Model {}

University.init({
    id: {
        type: Sequelize.UUID,
        defaultValue: UUIDV4,
        autoIncrement: true,
        primaryKey: true,
        field: 'university_id'
    },
    name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: {
            msg: 'This university name is already in use'
        },
        validate: {
            notEmpty: {
                msg: 'University name cannot be empty'
            }
        },
        field: "university_name"
    },
    abbreviation: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: {
            msg: 'This university abbreviation is already in use'
        },
        validate: {
            notEmpty: {
                msg: 'University abbreviation cannot be empty'
            }
        },
        field: 'university_abbreviation'
    },
    createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'created_at'
    },
    updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'updated_at'
    }
}, {
    sequelize,
    timestamps: true,
    modelName: 'University',
    tableName: 'universities'
});

export default University;
