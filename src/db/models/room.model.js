import {
    Sequelize,
    Model,
    UUIDV4
} from 'sequelize';
import sequelize from '../../config/db.connection.js';
import Class from './class.model.js';

class Room extends Model {}

Room.init({
    id: {
        type: Sequelize.UUID,
        defaultValue: UUIDV4,
        primaryKey: true,
        allowNull: false,
        field: 'room_id'
    },
    roomNumber: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'room_number',
        unique: {
            name: 'room_number_unique',
            msg: 'Room number already exists'
        },
        validate: {
            notNull: {
                msg: 'Room number cannot be null'
            }
        }
    },
    name: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
        field: 'room_name'
    },
    type: {
        type: Sequelize.ENUM('Classroom', 'Lab', 'Office'),
        allowNull: true,
        defaultValue: null,
        field: 'room_type'
    },
    sittingCapacity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        field: 'sitting_capacity',
        validate: {
            notNull: {
                msg: 'Sitting capacity cannot be null'
            },
            isInt: {
                msg: 'Sitting capacity must be a number'
            }
        }
    },
    createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'created_at',
        validate: {
            notNull: {
                msg: 'Created At cannot be null'
            }
        }
    },
    updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'updated_at',
        validate: {
            notNull: {
                msg: 'Updated At cannot be null'
            }
        }
    }
}, {
    sequelize,
    timestamps: true,
    modelName: 'Room',
    tableName: 'rooms'
});

Room.hasMany(Class, {
    sourceKey: 'id',
    foreignKey: 'roomId'
});
Class.belongsTo(Room, {
    targetKey: 'id',
    foreignKey: 'roomId'
});

export default Room;
