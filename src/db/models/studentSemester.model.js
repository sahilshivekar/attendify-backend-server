import {
    Sequelize,
    Model,
    UUIDV4
} from 'sequelize';
import sequelize from '../../config/db.connection.js';

class StudentSemester extends Model {}

StudentSemester.init({
    id: {
        type: Sequelize.UUID,
        defaultValue: UUIDV4,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
        field: 'student_semester_id'
    },
    studentId: {
        type: Sequelize.UUID,
        allowNull: false,
        field: 'student_id',
        references: {
            model: 'students',
            key: 'student_id'
        },
        validate: {
            notNull: {
                msg: 'Student ID cannot be null'
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
    modelName: 'StudentSemester',
    tableName: 'students_semesters'
});

export default StudentSemester;
