import Teacher from '../db/models/teacher.model.js';
import VerificationCode from '../db/models/verificationCode.model.js';
import {
    asyncHandler
} from '../utils/asyncHandler.js';
import {
    ApiResponse
} from '../utils/ApiResponse.js';
import {
    ApiError
} from '../utils/ApiError.js';
import {
    Op
} from 'sequelize';
import {
    sendVerificationCode
} from '../utils/email.js';
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

const generateAccessAndRefreshTokens = async (teacher) => {
    try {
        const newAccessToken = await teacher.generateAccessToken();
        const newRefreshToken = await teacher.generateRefreshToken();

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

    const actualRefreshToken = refreshToken.replace("Bearer ", "");

    let teacherId;
    jwt.verify(actualRefreshToken, process.env.JWT_REFRESH_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid refresh token");
        }
        teacherId = decoded.id;
    });

    const teacher = await Teacher.findByPk(teacherId);

    if (!teacher) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Teacher with this refresh token doesn't exist");
    }

    const {
        newAccessToken,
        newRefreshToken
    } = await generateAccessAndRefreshTokens(teacher);

    teacher.refreshToken = newRefreshToken;

    await teacher.save();

    res.
    status(httpStatus.OK).
    cookie("teacherAccessToken", newAccessToken, {
        ...options,
        maxAge: 86400000
    }).
    cookie("teacherRefreshToken", newRefreshToken, {
        ...options,
        maxAge: 1296000000
    }).
    json(
        new ApiResponse(
            httpStatus.OK,
            "Access token refreshed successfully", {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            })
    );

});

const loginTeacher = asyncHandler(async (req, res) => {
    const {
        email,
        password
    } = req.body;

    const teacher = await Teacher.findOne({
        where: {
            email: email.toLowerCase()
        }
    });

    if (!teacher) {
        throw new ApiError(httpStatus.BAD_REQUEST, "No teacher found with entered credentials");
    }

    const isPasswordMatching = await teacher.isPasswordMatching(password);

    if (!isPasswordMatching) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Password didn't match");
    }

    const {
        newAccessToken,
        newRefreshToken
    } = await generateAccessAndRefreshTokens(teacher);

    teacher.refreshToken = newRefreshToken;

    await teacher.save();

    delete teacher.dataValues.password;
    delete teacher.dataValues.refreshToken;

    res.
    status(httpStatus.OK).
    cookie("teacherAccessToken", newAccessToken, {
        ...options,
        maxAge: 86400000
    }).
    cookie("teacherRefreshToken", newRefreshToken, {
        ...options,
        maxAge: 1296000000
    }).
    json(
        new ApiResponse(
            httpStatus.OK,
            "Login Successful", {
                teacher: teacher,
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            }
        )
    );
});

const updateTeacherPassword = asyncHandler(async (req, res) => {
    const {
        password,
        confirmPassword
    } = req.body;

    const teacher = await Teacher.findByPk(req.teacher.id);

    if (!teacher) {
        throw new ApiError(httpStatus.NOT_FOUND, "Teacher not found");
    }

    const isPasswordMatching = await teacher.isPasswordMatching(password);

    if (isPasswordMatching) {
        throw new ApiError(httpStatus.BAD_REQUEST, "New password can't be same as old password.");
    }

    if (password !== confirmPassword) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Password and confirm password didn't match.");
    }

    teacher.password = password;

    await teacher.save();

    res.status(httpStatus.OK).json(
        new ApiResponse(
            httpStatus.OK,
            "Password updated successfully",
            null
        )
    );
});

const logout = asyncHandler(async (req, res) => {

    await Teacher.update({
        refreshToken: null
    }, {
        where: {
            id: req.teacher.id
        }
    });

    res.
    status(httpStatus.OK).
    clearCookie('teacherAccessToken').
    clearCookie('teacherRefreshToken').
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

    email = email.toLowerCase();

    const teacher = await Teacher.findOne({
        where: {
            email
        }
    });

    if (!teacher) {
        throw new ApiError(httpStatus.NOT_FOUND, "Teacher with this email doesn't exists");
    }

    const code = generateVerificationCode();

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const record = await VerificationCode.create({
        email: teacher.email,
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
            `Verification code sent on ${teacher.email}`, {
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

    const teacher = await Teacher.findOne({
        where: {
            email: email.toLowerCase()
        }
    });

    await VerificationCode.destroy({
        where: {
            email: email.toLowerCase()
        }
    });

    const {
        newAccessToken,
        newRefreshToken
    } = await generateAccessAndRefreshTokens(teacher);

    teacher.refreshToken = newRefreshToken;

    await teacher.save();

    delete teacher.dataValues.password;
    delete teacher.dataValues.refreshToken;

    res.
    status(httpStatus.OK).
    cookie("teacherAccessToken", newAccessToken, {
        ...options,
        maxAge: 86400000
    }).
    cookie("teacherRefreshToken", newRefreshToken, {
        ...options,
        maxAge: 1296000000
    }).
    json(
        new ApiResponse(
            httpStatus.OK,
            "Verification successful!", {
                teacher: teacher,
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            }
        )
    );
});

export {
    updateTeacherPassword,
    loginTeacher,
    sendVerificationCodeToEmail,
    verifyCode,
    refreshTokens,
    logout
};
