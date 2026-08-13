import {
    Sequelize,
    Model,
    UUIDV4
} from 'sequelize';
import sequelize from '../../config/db.connection.js';
import Batch from './batch.model.js';
import StudentDivision from './studentDivision.model.js';
import Timetable from './timetable.model.js';
class Division extends Model {}

Division.init({
    id: {
        type: Sequelize.UUID,
        defaultValue: UUIDV4,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
        field: 'division_id'
    },
    divisionCode: {
        type: Sequelize.STRING(255),
        allowNull: false,
        field: 'division_code',
        validate: {
            notEmpty: {
                msg: 'Division code cannot be empty'
            }
        }
    },
    semesterId: {
        type: Sequelize.UUID,
        allowNull: false,
        field: 'semester_id',
        references: {
            model: 'semesters',
            key: 'semester_id'
        },
        validate: {
            notNull: {
                msg: 'Semester ID cannot be null'
            }
        },
        unique: {
            name: 'division_unique',
            msg: 'Division already exists'
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
    modelName: 'Division',
    tableName: 'divisions'
});

Division.hasMany(Batch, {
    sourceKey: "id",
    foreignKey: "divisionId"
});
Batch.belongsTo(Division, {
    foreignKey: "divisionId",
    targetKey: "id"
});

Division.hasMany(StudentDivision, {
    sourceKey: "id",
    foreignKey: "divisionId"
});
StudentDivision.belongsTo(Division, {
    foreignKey: "divisionId",
    targetKey: "id"
});

Division.hasOne(Timetable, {
    sourceKey: "id",
    foreignKey: "divisionId"
});
Timetable.belongsTo(Division, {
    foreignKey: "divisionId",
    targetKey: "id"
});

export default Division;
