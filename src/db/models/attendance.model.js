import {
    Sequelize,
    Model,
    UUIDV4
} from 'sequelize';
import sequelize from '../../config/db.connection.js';

class Attendance extends Model {}

Attendance.init({
    id: {
        type: Sequelize.UUID,
        defaultValue: UUIDV4,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
        field: 'attendance_id'
    },
    classId: {
        type: Sequelize.UUID,
        allowNull: false,
        field: 'class_id',
        references: {
            model: 'classes',
            key: 'class_id'
        },
        validate: {
            notNull: {
                msg: 'Class ID cannot be null'
            }
        }
    },
    date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        field: 'attendance_date',
        validate: {
            notNull: {
                msg: 'Date cannot be null'
            },
            isDate: {
                msg: 'Invalid date format'
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
    modelName: 'Attendance',
    tableName: 'attendances',
    indexes: [{
            fields: ['class_id', 'attendance_date']
        },
        {
            fields: ['attendance_date']
        }
    ]

});

class AttendanceStudent extends Model {}

AttendanceStudent.init({
    id: {
        type: Sequelize.UUID,
        defaultValue: UUIDV4,
        primaryKey: true,
        allowNull: false,
        field: 'attendance_student_id'
    },
    attendanceId: {
        type: Sequelize.UUID,
        allowNull: false,
        field: 'attendance_id',
        references: {
            model: 'attendances',
            key: 'attendance_id'
        },
        validate: {
            notNull: {
                msg: 'Attendance ID cannot be null'
            }
        }
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
    attendanceStatus: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        field: 'attendance_status',
        validate: {
            notNull: {
                msg: 'Attendance status is required'
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
    modelName: 'AttendanceStudent',
    tableName: 'attendance_students',
    indexes: [{
            fields: ['attendance_id', 'student_id']
        },
        {
            fields: ['student_id']
        }
    ]

});

export {
    Attendance,
    AttendanceStudent
};

Attendance.hasMany(AttendanceStudent, {
    sourceKey: 'id',
    foreignKey: 'attendanceId'
});
AttendanceStudent.belongsTo(Attendance, {
    targetKey: 'id',
    foreignKey: 'attendanceId'
});
