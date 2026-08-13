import {
    Sequelize,
    Model,
    UUIDV4
} from 'sequelize';
import sequelize from '../../config/db.connection.js';
import StudentBatch from './studentBatch.model.js';
import Class from './class.model.js';

class Batch extends Model {}

Batch.init({
    id: {
        type: Sequelize.UUID,
        defaultValue: UUIDV4,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
        field: 'batch_id'
    },
    batchCode: {
        type: Sequelize.STRING(255),
        allowNull: false,
        field: 'batch_code',
        validate: {
            notEmpty: {
                msg: 'Batch code cannot be empty'
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
        },
        unique: {
            name: 'batch_unique',
            msg: 'Batch already exists'
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
    modelName: 'Batch',
    tableName: 'batches'
});

Batch.hasMany(StudentBatch, {
    sourceKey: "id",
    foreignKey: "batchId"
});
StudentBatch.belongsTo(Batch, {
    foreignKey: "batchId",
    targetKey: "id"
});

Batch.hasMany(Class, {
    sourceKey: "id",
    foreignKey: "batchId"
});
Class.belongsTo(Batch, {
    foreignKey: "batchId",
    targetKey: "id"
});

export default Batch;
