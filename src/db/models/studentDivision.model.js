import { Sequelize, Model, UUIDV4 } from 'sequelize';
import sequelize from '../../config/db.connection.js';

class StudentDivision extends Model { }

StudentDivision.init(
    {
        id: {
            type: Sequelize.UUID,
            defaultValue: UUIDV4,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true,
            field: 'student_division_id'
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
        rollNo: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'roll_no',
            validate: {
                notNull: {
                    msg: 'Roll number cannot be null'
                },
                min: {
                    args: [1],
                    msg: 'Roll number must be at least 1'
                }
            }
        },
        startDate: {
            type: Sequelize.DATEONLY,
            allowNull: false,
            field: 'start_date',
            validate: {
                notNull: {
                    msg: 'Start date cannot be null'
                },
                isDate: {
                    msg: 'Invalid date format for Start date'
                }
            }
        },
        endDate: {
            type: Sequelize.DATEONLY,
            allowNull: true,
            field: 'end_date',
            validate: {
                isDate: {
                    msg: 'Invalid date format for End date'
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
    },
    {
        sequelize,
        timestamps: true,
        modelName: 'StudentDivision', // Corrected model name
        tableName: 'students_divisions', // Corrected table name
        indexes: [
            { fields: ['student_id', 'division_id'] },
            { fields: ['student_id', 'end_date'] }
        ]
    }
);

export default StudentDivision;