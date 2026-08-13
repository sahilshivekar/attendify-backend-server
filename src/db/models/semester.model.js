import {
    Sequelize,
    Model,
    UUIDV4
} from 'sequelize';
import sequelize from '../../config/db.connection.js';
import Division from './division.model.js';
import StudentSemester from './studentSemester.model.js';

class Semester extends Model {}

Semester.init({
    id: {
        type: Sequelize.UUID,
        defaultValue: UUIDV4,
        primaryKey: true,
        allowNull: false,
        field: 'semester_id'
    },
    branchId: {
        type: Sequelize.UUID,
        allowNull: false,
        field: 'branch_id',
        references: {
            model: 'branches',
            key: 'branch_id'
        },
        validate: {
            notNull: {
                msg: 'Branch ID cannot be null'
            }
        },
        unique: {
            name: 'semester_unique',
            msg: 'Semester already exists'
        }
    },
    semesterNumber: {
        type: Sequelize.INTEGER,
        allowNull: false,
        field: 'semester_number',
        validate: {
            notNull: {
                msg: 'Semester number cannot be null'
            },
            isInt: {
                msg: 'Semester number must be an integer'
            }
        },
        unique: {
            name: 'semester_unique',
            msg: 'Semester already exists'
        }
    },
    academicStartYear: {
        type: Sequelize.INTEGER,
        allowNull: false,
        field: 'academic_start_year',
        validate: {
            notNull: {
                msg: 'Academic start year cannot be null'
            },
            isInt: {
                msg: 'Academic start year must be an integer'
            }
        },
        unique: {
            name: 'semester_unique',
            msg: 'Semester already exists'
        }
    },
    academicEndYear: {
        type: Sequelize.INTEGER,
        allowNull: false,
        field: 'academic_end_year',
        validate: {
            notNull: {
                msg: 'Academic end year cannot be null'
            },
            isInt: {
                msg: 'Academic end year must be an integer'
            }
        },
        unique: {
            name: 'semester_unique',
            msg: 'Semester already exists'
        }
    },
    startDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        field: 'start_date',
        validate: {
            notNull: {
                msg: 'Start date is required'
            },
            isDate: {
                msg: 'Invalid date format for Start date'
            }
        }
    },
    endDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        field: 'end_date',
        validate: {
            notNull: {
                msg: 'end date is required'
            },
            isDate: {
                msg: 'Invalid date format for End date'
            }
        }
    },
    schemeId: {
        type: Sequelize.UUID,
        allowNull: false,
        field: 'scheme_id',
        references: {
            model: 'schemes',
            key: 'scheme_id'
        },
        validate: {
            notNull: {
                msg: 'Scheme ID cannot be null'
            }
        },
        unique: {
            name: 'semester_unique',
            msg: 'Semester already exists'
        }
    },
    createdAt: {
        type: Sequelize.DATE,
        field: 'created_at'
    },
    updatedAt: {
        type: Sequelize.DATE,
        field: 'updated_at'
    }
}, {
    sequelize,
    timestamps: true,
    modelName: 'Semester',
    tableName: 'semesters'
});

Semester.hasMany(Division, {
    sourceKey: "id",
    foreignKey: "semesterId"
});
Division.belongsTo(Semester, {
    foreignKey: "semesterId",
    targetKey: "id"
});

Semester.hasMany(StudentSemester, {
    sourceKey: "id",
    foreignKey: "semesterId"
});
StudentSemester.belongsTo(Semester, {
    foreignKey: "semesterId",
    targetKey: "id"
});

export default Semester;
