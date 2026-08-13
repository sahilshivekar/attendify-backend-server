import {
    Sequelize,
    Model,
    UUIDV4
} from 'sequelize';
import sequelize from '../../config/db.connection.js';
import bcrypt from 'bcrypt';
import StudentDivision from './studentDivision.model.js';
import StudentBatch from './studentBatch.model.js';
import StudentSemester from './studentSemester.model.js';
import {
    AttendanceStudent
} from './attendance.model.js';
import jwt from 'jsonwebtoken';
import {
    ROLES
} from '../../config/roles.js';

class Student extends Model {}

Student.init({
    id: {
        type: Sequelize.UUID,
        defaultValue: UUIDV4,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
        field: 'student_id'
    },
    prn: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: {
            name: 'student_prn_unique',
            msg: 'PRN already exists'
        },
        field: 'student_prn',
        validate: {
            notEmpty: {
                msg: 'PRN cannot be empty'
            }
        }
    },
    firstName: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'first_name',
        validate: {
            notEmpty: {
                msg: 'First name cannot be empty'
            }
        }
    },
    lastName: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'last_name',
        validate: {
            notEmpty: {
                msg: 'Last name cannot be empty'
            }
        }
    },
    middleName: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'middle_name'
    },
    dob: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        field: 'dob',
        validate: {
            isDate: {
                msg: 'Invalid date format for Date of birth'
            }
        }
    },
    gender: {
        type: Sequelize.ENUM('Male', 'Female', 'Other'),
        allowNull: false,
        field: 'gender',
        validate: {
            notEmpty: {
                msg: 'Gender cannot be empty'
            },
            isIn: {
                args: [
                    ['Male', 'Female', 'Other']
                ],
                msg: 'Invalid gender value. Must be Male, Female, or Other'
            }
        }
    },
    email: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'email',
        unique: {
            name: 'student_email_unique',
            msg: 'Email already exists'
        },
        validate: {
            notEmpty: {
                msg: 'Email cannot be empty'
            },
            isEmail: {
                msg: 'Invalid email format'
            }
        }
    },
    phoneNumber: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'phone_number',
        unique: {
            name: 'student_phone_number_unique',
            msg: 'Phone number already exists'
        },
        validate: {
            notEmpty: {
                msg: 'Phone number cannot be empty'
            }
        }
    },
    parentEmail: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: false,
        defaultValue: null,
        field: 'parent_email',
        validate: {
            notEmpty: {
                msg: 'Email cannot be empty'
            },
            isEmail: {
                msg: 'Invalid email format'
            }
        }
    },
    password: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'password',
        defaultValue: 'Student@123',
        validate: {
            notEmpty: {
                msg: 'Password cannot be empty'
            },
            notNull: {
                msg: 'Password cannot be null'
            },
            isStrongPassword(value) {

                if (!/[A-Z]/.test(value)) {
                    throw new Error('Password must contain at least one uppercase letter');
                }
                if (!/\d/.test(value)) {
                    throw new Error('Password must contain at least one number');
                }
                if (!/[^\w]/.test(value)) {
                    throw new Error('Password must contain at least one special character');
                }
                if (/\s/.test(value)) {
                    throw new Error('Password cannot contain spaces');
                }
                if (value.length < 8) {
                    throw new Error('Password must be at least 8 characters long');
                }
            }
        }
    },
    refreshToken: {
        type: Sequelize.TEXT,
        allowNull: true,
        field: 'refresh_token'
    },
    studentImgUrl: {
        type: Sequelize.TEXT,
        allowNull: true,
        field: 'student_img_url'
    },
    studentImgPublicId: {
        type: Sequelize.TEXT,
        allowNull: true,
        field: 'student_img_public_id'
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
        }
    },
    branchId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
            model: 'branches',
            key: 'branch_id'
        },
        field: 'branch_id',
        validate: {
            notNull: {
                msg: 'Branch ID is required'
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
    },
    admissionYear: {
        type: Sequelize.INTEGER,
        allowNull: false,
        field: 'admission_year',
        validate: {
            notEmpty: {
                msg: 'Admission Year cannot be empty'
            },
            notNull: {
                msg: 'Admission Year cannot be null'
            }
        }
    },
    admissionType: {
        type: Sequelize.ENUM("DSE", "FE"),
        allowNull: false,
        field: 'admission_type',
        validate: {
            notEmpty: {
                msg: 'Admission Type cannot be empty'
            },
            notNull: {
                msg: 'Admission Type cannot be null'
            },
            isIn: {
                args: [
                    ['DSE', 'FE']
                ],
                msg: 'Invalid admission type, Must be DSE or FE'
            }
        }
    },
    faceDescriptor: {
        type: Sequelize.ARRAY(Sequelize.FLOAT),
        allowNull: true,
        field: 'face_descriptor',
        validate: {
            isValidLength(value) {
                if (value && value.length !== 128) {
                    throw new Error('Face descriptor must be exactly 128 dimensions');
                }
            }
        }
    },
    biometricVerificationStatus: {
        type: Sequelize.ENUM('Not Submitted', 'Pending Review', 'Approved', 'Rejected'),
        allowNull: false,
        defaultValue: 'Not Submitted',
        field: 'biometric_verification_status'
    },
    faceImageKeys: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        allowNull: true,
        defaultValue: [],
        field: 'face_image_keys'
    }
}, {
    sequelize,
    timestamps: true,
    modelName: 'Student',
    tableName: 'students',
    indexes: [{
            fields: ['first_name', 'last_name']
        },
        {
            fields: ['admission_year']
        },
        {
            fields: ['admission_type']
        },
        {
            fields: ['branch_id']
        },
        {
            fields: ['scheme_id']
        },
        {
            fields: ['biometric_verification_status']
        }
    ]

});

Student.hasMany(StudentSemester, {
    sourceKey: 'id',
    foreignKey: 'studentId'
});
Student.hasMany(StudentDivision, {
    sourceKey: 'id',
    foreignKey: 'studentId'
});
Student.hasMany(StudentBatch, {
    sourceKey: 'id',
    foreignKey: 'studentId'
});
Student.hasMany(AttendanceStudent, {
    sourceKey: 'id',
    foreignKey: 'studentId'
});

StudentSemester.belongsTo(Student, {
    targetKey: 'id',
    foreignKey: 'studentId'
});
StudentDivision.belongsTo(Student, {
    targetKey: 'id',
    foreignKey: 'studentId'
});
StudentBatch.belongsTo(Student, {
    targetKey: 'id',
    foreignKey: 'studentId'
});
AttendanceStudent.belongsTo(Student, {
    targetKey: 'id',
    foreignKey: 'studentId'
});

Student.prototype.isPasswordMatching = async function (password) {
    return await bcrypt.compare(password, this.password);
};

Student.beforeCreate(async (student) => {
    if (student?.password) {
        student.password = await bcrypt.hash(student.password, Number(process.env.BCRYPT_SALT));
    }
});

Student.beforeUpdate(async (student) => {
    if (student.changed('password') && student?.password) {
        student.password = await bcrypt.hash(student.password, Number(process.env.BCRYPT_SALT));
    }
    if (student.changed('email')) {
        student.email = student.email.toLowerCase();
        student.isVerified = false;
    }
});

Student.prototype.generateAccessToken = function () {
    return jwt.sign({
            id: this.id,
            email: this.email,
            role: ROLES.STUDENT
        },
        process.env.JWT_ACCESS_TOKEN_SECRET, {
            expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRY
        }
    );
};

Student.prototype.generateRefreshToken = function () {
    return jwt.sign({
            id: this.id,
            email: this.email,
            role: ROLES.STUDENT
        },
        process.env.JWT_REFRESH_TOKEN_SECRET, {
            expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRY
        }
    );
};

export default Student;
