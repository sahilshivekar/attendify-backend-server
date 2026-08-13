import {
    Sequelize,
    Model,
    UUIDV4
} from 'sequelize';
import sequelize from '../../config/db.connection.js';
import Class from './class.model.js';

class Timetable extends Model {}

Timetable.init({
    id: {
        type: Sequelize.UUID,
        defaultValue: UUIDV4,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
        field: 'timetable_id'
    },
    divisionId: {
        type: Sequelize.UUID,
        allowNull: false,
        field: 'division_id',
        references: {
            model: 'divisions',
            key: 'division_id'
        },
        validate: {
            notNull: {
                msg: 'Division ID cannot be null'
            }
        },
        unique: {
            msg: 'Timetable already exists for this division'
        }
    },
    timetableVersion: {
        type: Sequelize.INTEGER,
        allowNull: false,
        field: 'timetable_version',
        defaultValue: 1,
        validate: {
            notNull: {
                msg: 'Timetable version cannot be null'
            },
            isInt: {
                msg: 'Timetable version must be an integer'
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
    modelName: 'Timetable',
    tableName: 'timetables'
});

Timetable.hasMany(Class, {
    sourceKey: 'id',
    foreignKey: 'timetableId'
});
Class.belongsTo(Timetable, {
    targetKey: 'id',
    foreignKey: 'timetableId'
});

export default Timetable;
