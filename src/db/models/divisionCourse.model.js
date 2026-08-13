import {
    Sequelize,
    Model,
    UUIDV4
} from 'sequelize';
import sequelize from '../../config/db.connection.js';
import Course from './course.model.js';
import Division from './division.model.js';

class DivisionCourse extends Model {}

DivisionCourse.init({
    id: {
        type: Sequelize.UUID,
        defaultValue: UUIDV4,
        primaryKey: true,
        allowNull: false,
        field: 'division_courses_id'
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
        }
    },
    courseId: {
        type: Sequelize.UUID,
        allowNull: false,
        field: 'course_id',
        references: {
            model: 'courses',
            key: 'course_id'
        },
        validate: {
            notNull: {
                msg: 'Course ID cannot be null'
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
    modelName: 'DivisionCourse',
    tableName: 'division_courses'
});

DivisionCourse.belongsTo(Course, {
    foreignKey: 'courseId',
    targetKey: 'id'
});
DivisionCourse.belongsTo(Division, {
    foreignKey: 'divisionId',
    targetKey: 'id'
});

export default DivisionCourse;
