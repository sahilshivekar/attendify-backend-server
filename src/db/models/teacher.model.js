import { Sequelize, Model, UUIDV4 } from 'sequelize';
import sequelize from '../../config/db.connection.js';
import bcrypt from 'bcrypt';
import { ROLES } from '../../config/roles.js';
import TeacherTeachesCourse from './teacherTeachesCourse.model.js';
import Class from './class.model.js';
import Course from './course.model.js'
import jwt from 'jsonwebtoken'

class Teacher extends Model { }

Teacher.init(
    {
        id: {
            type: Sequelize.UUID,
            defaultValue: UUIDV4,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true,
            field: 'teacher_id'
        },
        firstName: {
            type: Sequelize.STRING(255),
            allowNull: false,
            field: 'first_name',
            validate: {
                notEmpty: {
                    msg: 'First name cannot be empty'
                }
            }
        },
        middleName: {
            type: Sequelize.STRING(255),
            allowNull: true,
            field: 'middle_name'
        },
        lastName: {
            type: Sequelize.STRING(255),
            allowNull: false,
            field: 'last_name',
            validate: {
                notEmpty: {
                    msg: 'Last name cannot be empty'
                }
            }
        },
        teacherImageUrl: {
            type: Sequelize.TEXT,
            allowNull: true,
            field: 'teacher_image_url'
        },
        teacherImagePublicId: {
            type: Sequelize.TEXT,
            allowNull: true,
            field: 'teacher_image_public_id'
        },
        email: {
            type: Sequelize.STRING(255),
            allowNull: false,
            field: 'teacher_email',
            unique: {
                name: 'teacher_email_unique',
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
            type: Sequelize.STRING(15),
            allowNull: false,
            field: 'teacher_phone_number',
            unique: {
                msg: 'Phone number already exists'
            },
            validate: {
                notEmpty: {
                    msg: 'Phone number cannot be empty'
                }
            }
        },
        gender: {
            type: Sequelize.ENUM('Male', 'Female', 'Other'),
            allowNull: false,
            field: 'teacher_gender',
            validate: {
                notEmpty: {
                    msg: 'Gender cannot be empty'
                },
                isIn: { // <-- Use isIn validator
                    args: [['Male', 'Female', 'Other']], // Array of allowed values
                    msg: 'Invalid gender value. Must be Male, Female, or Other'
                }
            }
        },
        highestQualification: {
            type: Sequelize.STRING(255),
            allowNull: true,
            field: 'teacher_highest_qualification'
        },
        role: {
            type: Sequelize.ENUM('Teacher', 'Head of Department', 'Principal'),
            allowNull: false,
            field: 'teacher_role',
            validate: {
                isIn: {
                    args: [['Teacher', 'Head of Department', 'Principal']], // Array of allowed values
                    msg: 'Invalid role value. Must be Teacher, Head of Department, or Principal'
                },
                notNull: {
                    msg: 'Role cannot be null'
                },
                notEmpty: {
                    msg: 'Role cannot be empty'
                }
            }
        },
        password: {
            type: Sequelize.STRING(255),
            allowNull: false,
            field: 'teacher_password',
            defaultValue: 'Teacher@123',
            validate: {
                notEmpty: {
                    msg: 'Password cannot be empty'
                },
                notNull: {
                    msg: 'Password cannot be null'
                },
                isStrongPassword(value) {
                    // Custom validation logic for password
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
                },
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
        isActive: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            field: 'is_active', // Corrected field name
            defaultValue: true
        },
        refreshToken: {
            type: Sequelize.TEXT,
            allowNull: true,
            field: 'refresh_token'
        },
    },
    {
        sequelize,
        timestamps: true,
        modelName: 'Teacher',
        tableName: 'teacher',
        indexes: [
            { fields: ['first_name', 'last_name'] },
            { fields: ['is_active'] }
        ]
    }
);

Teacher.hasMany(Class, { sourceKey: 'id', foreignKey: 'teacherId' });
Class.belongsTo(Teacher, { targetKey: 'id', foreignKey: 'teacherId' });


Course.hasMany(TeacherTeachesCourse, { sourceKey: 'id', foreignKey: 'courseId' });
TeacherTeachesCourse.belongsTo(Course, { foreignKey: 'courseId', targetKey: 'id' });

TeacherTeachesCourse.belongsTo(Teacher, { foreignKey: 'teacherId', targetKey: 'id' });
Teacher.hasMany(TeacherTeachesCourse, { sourceKey: 'id', foreignKey: 'teacherId' });

Teacher.prototype.isPasswordMatching = async function (password) {
    return await bcrypt.compare(password, this.password)
}

Teacher.beforeCreate(async (teacher) => {
    if (teacher?.password) {
        teacher.password = await bcrypt.hash(teacher.password, Number(process.env.BCRYPT_SALT))
    }
})

Teacher.beforeUpdate(async (teacher) => {
    if (teacher.changed('password') && teacher?.password) {
        teacher.password = await bcrypt.hash(teacher.password, Number(process.env.BCRYPT_SALT))
    }
    if (teacher.changed('email')) {
        teacher.email = teacher.email.toLowerCase();
        teacher.isVerified = false;
    }
})

Teacher.prototype.generateAccessToken = function () {
    return jwt.sign(
        {
            id: this.id,
            email: this.email,
            role: ROLES.TEACHER
        },
        process.env.JWT_ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRY,
        }
    )
}

Teacher.prototype.generateRefreshToken = function () {
    return jwt.sign(
        {
            id: this.id,
            email: this.email,
            role: ROLES.TEACHER
        },
        process.env.JWT_REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRY
        }
    )
}


export default Teacher;