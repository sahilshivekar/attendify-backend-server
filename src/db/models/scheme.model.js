import {
    Sequelize,
    Model,
    UUIDV4
} from 'sequelize';
import sequelize from '../../config/db.connection.js';
import University from './university.model.js';
import Semester from './semester.model.js';
import Student from './student.model.js';

class Scheme extends Model {}

Scheme.init({
    id: {
        type: Sequelize.UUID,
        defaultValue: UUIDV4,
        primaryKey: true,
        field: 'scheme_id'
    },
    name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        field: 'scheme_name',
        unique: {
            name: 'scheme_name_unique',
            msg: 'Scheme name already exists'
        },
        validate: {
            notEmpty: {
                msg: 'Scheme name cannot be empty'
            }
        }
    },
    universityId: {
        type: Sequelize.UUID,
        allowNull: false,
        field: 'university_id',
        references: {
            model: 'universities',
            key: 'university_id'
        },
        validate: {
            notNull: {
                msg: 'University ID cannot be null'
            }
        }
    },
    createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: "created_at",
        validate: {
            notNull: {
                msg: 'Created At cannot be null'
            }
        }
    },
    updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: "updated_at",
        validate: {
            notNull: {
                msg: 'Updated At cannot be null'
            }
        }
    }
}, {
    sequelize,
    timestamps: true,
    modelName: 'Scheme',
    tableName: 'schemes'
});

Scheme.belongsTo(University, {
    foreignKey: 'universityId',
    targetKey: 'id'
});
University.hasMany(Scheme, {
    sourceKey: 'id',
    foreignKey: 'universityId'
});

Scheme.hasMany(Semester, {
    sourceKey: 'id',
    foreignKey: 'schemeId'
});
Semester.belongsTo(Scheme, {
    targetKey: 'id',
    foreignKey: 'schemeId'
});

Scheme.hasMany(Student, {
    sourceKey: 'id',
    foreignKey: 'schemeId'
});
Student.belongsTo(Scheme, {
    targetKey: 'id',
    foreignKey: 'schemeId'
});

export default Scheme;
