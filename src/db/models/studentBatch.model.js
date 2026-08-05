import { Sequelize, Model, UUIDV4 } from 'sequelize';
import sequelize from '../../config/db.connection.js';

class StudentBatch extends Model { }

StudentBatch.init(
    {
        id: {
            type: Sequelize.UUID,
            defaultValue: UUIDV4,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true,
            field: 'student_batch_id'
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
        batchId: {
            type: Sequelize.UUID,
            allowNull: false,
            field: 'batch_id',
            references: {
                model: 'batches',
                key: 'batch_id'
            },
            validate: {
                notNull: {
                    msg: 'Batch ID cannot be null'
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
        modelName: 'StudentBatch',
        tableName: 'students_batches',
        indexes: [
            { fields: ['student_id', 'batch_id'] },
            { fields: ['student_id', 'end_date'] }
        ]
    }
);

export default StudentBatch;