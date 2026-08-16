import Admin from '../../db/models/admin.model.js';
import VerificationCode from '../../db/models/verificationCode.model.js';
import {
    asyncHandler
} from '../../utils/asyncHandler.js';
import {
    ApiResponse
} from '../../utils/ApiResponse.js';
import {
    ApiError
} from '../../utils/ApiError.js';
import {
    Op
} from 'sequelize';
import {
    sendVerificationCode
} from '../../utils/email.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import {
    type
} from 'os';
import httpStatus from 'http-status';

const generateVerificationCode = (length = 6) => {
    let code = '';
    for (let i = 0; i < length; i++) {
        code += crypto.randomInt(0, 10).toString();
    }
    return code;
};

const options = {
    httpOnly: true,
    secure: true
};

const generateAccessAndRefreshTokens = async (admin) => {
    try {
        const newAccessToken = await admin.generateAccessToken();
        const newRefreshToken = await admin.generateRefreshToken();

        return {
            newAccessToken,
            newRefreshToken
        };
    } catch (err) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Something went wrong while generating tokens");
    }
};

const refreshTokens = asyncHandler(async (req, res) => {

    const {
        refreshToken
    } = req.body;

    let decoded;
    try {
        decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_TOKEN_SECRET);
    } catch (err) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid refresh token");
    }

    const admin = await Admin.findByPk(decoded.id);

    if (!admin) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid refresh token");
    }

    const {
        newAccessToken,
        newRefreshToken
    } = await generateAccessAndRefreshTokens(admin);

    admin.refreshToken = newRefreshToken;

    await admin.save();

    res.
    status(httpStatus.OK).
    cookie("adminAccessToken", newAccessToken, {
        ...options,
        maxAge: 86400000
    }).
    cookie("adminRefreshToken", newRefreshToken, {
        ...options,
        maxAge: 1296000000
    }).
    json(
        new ApiResponse(
            httpStatus.OK,
            "Access token refreshed successfully", {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            }
        )
    );
});

const login = asyncHandler(async (req, res) => {

    const {
        emailOrUsername,
        password
    } = req.body;

    const admin = await Admin.scope('withPassword').findOne({
        where: {
            [Op.or]: {
                email: emailOrUsername.toLowerCase(),
                username: emailOrUsername
            }
        }
    });

    if (!admin) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Invalid email or username");
    }

    const isPasswordMatching = await admin.isPasswordMatching(password);

    if (!isPasswordMatching) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Invalid password");
    }

    const {
        newAccessToken,
        newRefreshToken
    } = await generateAccessAndRefreshTokens(admin);

    admin.refreshToken = newRefreshToken;
    await admin.save();

    delete admin.password;
    delete admin.refreshToken;

    res.
    status(httpStatus.OK).
    cookie("adminAccessToken", newAccessToken, {
        ...options,
        maxAge: 86400000
    }).
    cookie("adminRefreshToken", newRefreshToken, {
        ...options,
        maxAge: 1296000000
    }).
    json(
        new ApiResponse(
            httpStatus.OK,
            "Login Successful", {
                admin: admin,
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            }
        )
    );
});

const verifyPassword = asyncHandler(async (req, res) => {

    const {
        password
    } = req.body;

    const admin = await Admin.scope('withPassword').findByPk(req.admin.id);

    if (!admin) {
        throw new ApiError(httpStatus.NOT_FOUND, "Admin not found");
    }

    const isPasswordMatching = await admin.isPasswordMatching(password);

    if (!isPasswordMatching) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Password is incorrect");
    }

    res.status(httpStatus.OK).json(
        new ApiResponse(
            httpStatus.OK,
            "Password is correct",
            null
        )
    );
});

const updateAdminPassword = asyncHandler(async (req, res) => {
    const {
        password,
        confirmPassword
    } = req.body;

    const admin = await Admin.scope('withPassword').findByPk(req.admin.id);

    if (!admin) {
        throw new ApiError(httpStatus.NOT_FOUND, "Admin not found");
    }

    const isPasswordMatching = await admin.isPasswordMatching(password);

    if (isPasswordMatching) {
        throw new ApiError(httpStatus.BAD_REQUEST, "New password can't be same as old password.");
    }

    admin.password = password;

    await admin.save();

    res.status(httpStatus.OK).json(
        new ApiResponse(
            httpStatus.OK,
            "Password updated successfully",
            null
        )
    );
});

const logout = asyncHandler(async (req, res) => {

    await Admin.update({
        refreshToken: null
    }, {
        where: {
            id: req.admin.id
        }
    });

    res.
    status(httpStatus.OK).
    clearCookie('adminAccessToken').
    clearCookie('adminRefreshToken').
    json(
        new ApiResponse(
            httpStatus.OK,
            "Logged out successfully",
            null
        )
    );
});

const sendVerificationCodeToEmail = asyncHandler(async (req, res) => {

    let {
        email
    } = req.body;

    if (!email && !req?.admin?.email) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Email is required");
    }

    if (req?.admin?.email) {
        email = req?.admin?.email.toLowerCase();
    }

    const admin = await Admin.findOne({
        where: {
            email
        }
    });

    if (!admin) {
        throw new ApiError(httpStatus.NOT_FOUND, "Admin with this email doesn't exists");
    }

    const code = generateVerificationCode();

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const record = await VerificationCode.create({
        email: admin.email,
        code,
        expiresAt
    });

    if (!record) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Some issue occured while generating code");
    }

    const emailSent = await sendVerificationCode(email, code);

    if (!emailSent) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Error sending verification email");
    }

    setTimeout(
        async () => {
                await VerificationCode.destroy({
                    where: {
                        [Op.and]: [{
                            email
                        }, {
                            code
                        }]
                    }
                });
            },
            5 * 60 * 1000
    );

    res.
    status(httpStatus.OK).
    json(
        new ApiResponse(
            httpStatus.OK,
            `Verification code sent on ${admin.email}`, {
                expiresAt
            }
        )
    );
});

const verifyCode = asyncHandler(async (req, res) => {

    const {
        email,
        code
    } = req.body;

    const codeRecord = await VerificationCode.findOne({
        where: {
            [Op.and]: [{
                email: email.toLowerCase()
            }, {
                code
            }]
        }
    });

    if (!codeRecord) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Invalid verification code");
    }

    const admin = await Admin.scope('withPassword').findOne({
        where: {
            email: email.toLowerCase()
        }
    });

    if (!admin.isVerified) {
        admin.isVerified = true;
        await admin.save();
    }

    await VerificationCode.destroy({
        where: {
            email: email.toLowerCase()
        }
    });

    const {
        newAccessToken,
        newRefreshToken
    } = await generateAccessAndRefreshTokens(admin);

    admin.refreshToken = newRefreshToken;

    await admin.save();

    delete admin.dataValues.password;
    delete admin.dataValues.refreshToken;

    res.
    status(httpStatus.OK).
    cookie("adminAccessToken", newAccessToken, {
        ...options,
        maxAge: 86400000
    }).
    cookie("adminRefreshToken", newRefreshToken, {
        ...options,
        maxAge: 1296000000
    }).
    json(
        new ApiResponse(
            httpStatus.OK,
            "Verification successful!", {
                admin: admin,
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            }
        )
    );
});

export {
    updateAdminPassword,
    verifyPassword,
    verifyCode,
    login,
    sendVerificationCodeToEmail,
    refreshTokens,
    logout
};
