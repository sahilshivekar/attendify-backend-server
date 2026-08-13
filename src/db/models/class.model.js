import {
    Sequelize,
    Model,
    UUIDV4
} from 'sequelize';
import sequelize from '../../config/db.connection.js';
import {
    Attendance
} from './attendance.model.js';

class Class extends Model {}

Class.init({
    id: {
        type: Sequelize.UUID,
        defaultValue: UUIDV4,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
        field: 'class_id'
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
                msg: 'Teacher ID is required'
            }
        }
    },
    startTime: {
        type: Sequelize.TIME,
        allowNull: false,
        field: 'start_time',
        validate: {
            notNull: {
                msg: 'Start time is required'
            }
        }
    },
    endTime: {
        type: Sequelize.TIME,
        allowNull: false,
        field: 'end_time',
        validate: {
            notNull: {
                msg: 'End time is required'
            }
        }
    },
    dayOfWeek: {
        type: Sequelize.ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
        allowNull: false,
        field: 'day_of_week',
        validate: {
            notNull: {
                msg: 'Day of week is required'
            }
        }
    },
    roomId: {
        type: Sequelize.UUID,
        allowNull: false,
        field: 'room_id',
        references: {
            model: 'rooms',
            key: 'room_id'
        },
        validate: {
            notNull: {
                msg: 'Room ID is required'
            }
        }
    },
    batchId: {
        type: Sequelize.UUID,
        allowNull: true,
        field: 'batch_id',
        references: {
            model: 'batches',
            key: 'batch_id'
        }
    },
    activeFrom: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        field: 'active_from',
        validate: {
            notNull: {
                msg: 'Active from field is required'
            },
            isDate: {
                msg: 'Invalid date format for Is active from'
            }
        }
    },
    activeTill: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        field: 'active_till',
        validate: {
            notNull: {
                msg: 'Active till field is required'
            },
            isDate: {
                msg: 'Invalid date format for Active till'
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
                msg: 'Course ID is required'
            }
        }
    },
    createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'created_at',
        validate: {
            notNull: {
                msg: 'Created At is required'
            }
        }
    },
    updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'updated_at',
        validate: {
            notNull: {
                msg: 'Updated At is required'
            }
        }
    },
    timetableId: {
        type: Sequelize.UUID,
        allowNull: false,
        field: 'timetable_id',
        references: {
            model: 'timetables',
            key: 'timetable_id'
        },
        validate: {
            notNull: {
                msg: 'Timetable Id is required'
            }
        }
    },
    isExtraClass: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_extra_class'
    }
}, {
    sequelize,
    timestamps: true,
    modelName: 'Class',
    tableName: 'classes',
    indexes: [{
            fields: ['timetable_id']
        },
        {
            fields: ['teacher_id']
        },
        {
            fields: ['room_id']
        },
        {
            fields: ['batch_id']
        },
        {
            fields: ['course_id']
        },
        {
            fields: ['day_of_week', 'start_time', 'end_time']
        },
        {
            fields: ['active_from', 'active_till']
        }
    ]

});

export default Class;

Class.hasMany(Attendance, {
    sourceKey: 'id',
    foreignKey: 'classId'
});
Attendance.belongsTo(Class, {
    targetKey: 'id',
    foreignKey: 'classId'
});
