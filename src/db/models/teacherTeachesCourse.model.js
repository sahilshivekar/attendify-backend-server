import {
    Sequelize,
    Model,
    UUIDV4
} from 'sequelize';
import sequelize from '../../config/db.connection.js';
import Teacher from './teacher.model.js';
import Course from './course.model.js';

class TeacherTeachesCourse extends Model {}

TeacherTeachesCourse.init({
    id: {
        type: Sequelize.UUID,
        defaultValue: UUIDV4,
        primaryKey: true,
        field: 'teacher_course_id',
        autoIncrement: true
    },
    teacherId: {
        type: Sequelize.UUID,
        allowNull: false,
        field: 'teacher_id',
        references: {
            model: 'teacher',
            key: 'teacher_id'
        },
        validate: {
            notNull: {
                msg: 'Teacher ID cannot be null'
            }
        },
        unique: {
            name: 'one_course_for_one_teacher_only_once',
            msg: 'Teacher already have this course in the teaching list'
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
        },
        unique: {
            name: 'one_course_for_one_teacher_only_once',
            msg: 'Teacher already have this course in the teaching list'
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
    modelName: 'TeacherTeachesCourse',
    tableName: 'teacher_teaches_course',
    indexes: [{
        fields: ['course_id']
    }]

});

export default TeacherTeachesCourse;
