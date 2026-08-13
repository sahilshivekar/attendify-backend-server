import {
    Sequelize,
    Model,
    UUIDV4
} from 'sequelize';
import sequelize from '../../config/db.connection.js';
import Student from './student.model.js';

class StudentFCMToken extends Model {}

StudentFCMToken.init({
    id: {
        type: Sequelize.UUID,
        defaultValue: UUIDV4,
        primaryKey: true,
        autoIncrement: true,
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
        onDelete: 'CASCADE',
        validate: {
            notNull: {
                msg: 'StudentId is not provided'
            },
            notEmpty: {
                msg: 'StudentId cannot be empty'
            }
        }
    },
    deviceId: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'device_id',
        validate: {
            notNull: {
                msg: 'DeviceId is not provided'
            },
            notEmpty: {
                msg: 'DeviceId cannot be empty'
            }
        }
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
        field: 'device_type',
        validate: {
            notNull: {
                msg: 'DeviceType is not provided'
            },
            isIn: {
                args: [
                    ['ANDROID', 'IOS']
                ],
                msg: 'DeviceType must be either ANDROID or IOS'
            }
        }
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
    modelName: 'StudentFCMToken',
    tableName: 'student_fcm_tokens',
    sequelize,
    timestamps: false,
    indexes: [{
        unique: true,
        fields: ['student_id', 'device_id']
    }]

});

Student.hasOne(StudentFCMToken, {
    sourceKey: 'id',
    foreignKey: 'studentId'
});
StudentFCMToken.belongsTo(Student, {
    targetKey: 'id',
    foreignKey: 'studentId'
});

export default StudentFCMToken;
