import {
    Sequelize,
    Model,
    UUIDV4
} from 'sequelize';
import sequelize from '../../config/db.connection.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {
    ROLES
} from '../../config/roles.js';

class Admin extends Model {}

Admin.init({
    id: {
        type: Sequelize.UUID,
        defaultValue: UUIDV4,
        autoIncrement: true,
        primaryKey: true,
        field: 'admin_id'
    },
    email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: {
            msg: 'This email is already in use'
        },
        validate: {
            notEmpty: {
                msg: 'Email cannot be empty'
            },
            isEmail: {
                msg: 'Enter a valid email address'
            }
        },
        field: 'admin_email'
    },
    username: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: {
            msg: 'This username is already in use'
        },
        validate: {
            notEmpty: {
                msg: 'Username cannot be empty'
            },
            notContains: {
                args: ' ',
                msg: 'Username cannot contain spaces'
            },
            isLowercase(value) {
                if (value !== value.toLowerCase()) {
                    throw new Error('Username must be in lowercase');
                }
            }
        },
        field: 'admin_username'
    },
    password: {
        type: Sequelize.STRING(255),
        allowNull: false,
        validate: {
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
        },
        field: 'admin_password'
    },
    refreshToken: {
        type: Sequelize.TEXT,
        allowNull: true,
        field: 'refresh_token'
    },
    isVerified: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_verified'
    },
    createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'created_at'
    },
    updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'updated_at'
    }
}, {
    sequelize,
    timestamps: true,
    modelName: 'Admin',
    tableName: 'admins',
    defaultScope: {
        attributes: {
            exclude: ['refreshToken', 'password']
        }
    },
    scopes: {
        withPassword: {
            attributes: {
                exclude: ['refreshToken']
            }
        },
        withRefreshToken: {
            attributes: {
                exclude: ['password']
            }
        },
        withAll: {
            attributes: {
                exclude: []
            }
        }
    }
});

Admin.prototype.isPasswordMatching = async function (password) {
    return await bcrypt.compare(password, this.password);
};

Admin.beforeCreate(async (admin) => {
    if (admin?.password) {
        const saltRounds = process.env.NODE_ENV === 'test' ? 4 : Number(process.env.BCRYPT_SALT);
        admin.password = await bcrypt.hash(admin.password, saltRounds);
    }
});

Admin.beforeUpdate(async (admin) => {
    if (admin.changed('password') && admin?.password) {
        const saltRounds = process.env.NODE_ENV === 'test' ? 4 : Number(process.env.BCRYPT_SALT);
        admin.password = await bcrypt.hash(admin.password, saltRounds);
    }
    if (admin.changed('email')) {
        admin.email = admin.email.toLowerCase();
        admin.isVerified = false;
    }
});

Admin.prototype.generateAccessToken = function () {
    return jwt.sign({
            id: this.id,
            username: this.username,
            role: ROLES.ADMIN,
        },
        process.env.JWT_ACCESS_TOKEN_SECRET, {
            expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRY
        }
    );
};

Admin.prototype.generateRefreshToken = function () {
    return jwt.sign({
            id: this.id,
            username: this.username,
            role: ROLES.ADMIN,
        },
        process.env.JWT_REFRESH_TOKEN_SECRET, {
            expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRY
        }
    );
};

export default Admin;
