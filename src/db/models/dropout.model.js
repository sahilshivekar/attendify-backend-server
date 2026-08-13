import {
    Sequelize,
    Model,
    UUIDV4
} from "sequelize";
import sequelize from "../../config/db.connection.js";
import Student from "./student.model.js";

class Dropout extends Model {}

Dropout.init({
    id: {
        type: Sequelize.UUID,
        defaultValue: UUIDV4,
        primaryKey: true,
        autoIncrement: true,
        field: 'dropout_id'
    },
    studentId: {
        type: Sequelize.UUID,
        allowNull: false,
        field: 'dropout_student_id',
        references: {
            model: 'students',
            key: "student_id"
        },
        onDelete: 'CASCADE'
    },
    academicStartYear: {
        type: Sequelize.INTEGER,
        allowNull: false,
        field: 'academic_start_year',
        validate: {
            notNull: {
                msg: "Academic start year cannot be empty"
            },
            notEmpty: {
                msg: "Academic start year cannot be empty"
            }
        }
    },
    academicEndYear: {
        type: Sequelize.INTEGER,
        allowNull: false,
        field: 'academic_end_year',
        validate: {
            notNull: {
                msg: "Academic end year cannot be empty"
            },
            notEmpty: {
                msg: "Academic end year cannot be empty"
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
    sequelize,
    timestamps: true,
    modelName: 'Dropout',
    tableName: 'dropouts'
});

Student.hasMany(Dropout, {
    sourceKey: 'id',
    foreignKey: 'dropout_student_id'
});

Dropout.belongsTo(Student, {
    foreignKey: 'dropout_student_id',
    targetKey: 'id'
});

export default Dropout;
