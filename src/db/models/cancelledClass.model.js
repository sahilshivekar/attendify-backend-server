import {
    Sequelize,
    Model,
    UUIDV4
} from 'sequelize';
import sequelize from '../../config/db.connection.js';
import Class from './class.model.js';

class CancelledClass extends Model {}

CancelledClass.init({
    id: {
        type: Sequelize.UUID,
        defaultValue: UUIDV4,
        autoIncrement: true,
        primaryKey: true,
        field: 'cancelled_class_id'
    },
    classId: {
        type: Sequelize.UUID,
        allowNull: false,
        field: 'cancelled_class_class_id',
        references: {
            model: 'classes',
            key: "class_id"
        },
        onDelete: 'CASCADE'
    },
    date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        field: 'cancelled_class_date'
    },
    reason: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'cancelled_class_reason'
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
    sequelize,
    timestamps: true,
    modelName: 'CancelledClass',
    tableName: 'cancelled_classes'
});

CancelledClass.belongsTo(Class, {
    targetKey: 'id',
    foreignKey: 'classId'
});
Class.hasMany(CancelledClass, {
    sourceKey: 'id',
    foreignKey: 'classId'
});

export default CancelledClass;
