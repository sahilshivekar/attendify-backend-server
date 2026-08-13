import {
    Sequelize,
    Model,
    UUIDV4
} from 'sequelize';
import sequelize from '../../config/db.connection.js';
import Admin from './admin.model.js';

class VerificationCode extends Model {}

VerificationCode.init({
    id: {
        type: Sequelize.UUID,
        defaultValue: UUIDV4,
        autoIncrement: true,
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
        field: 'created_at'
    },
    updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'updated_at'
    }
}, {
    sequelize,
    modelName: 'VerificationCode',
    tableName: 'verification_codes'
});

VerificationCode.belongsTo(Admin, {
    foreignKey: 'email',
    targetKey: 'email'
});

export default VerificationCode;
