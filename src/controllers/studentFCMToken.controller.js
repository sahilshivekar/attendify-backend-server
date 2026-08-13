import {
    Op
} from 'sequelize';
import {
    asyncHandler
} from '../utils/asyncHandler.js';
import Student from '../db/models/student.model.js';
import {
    ApiResponse
} from '../utils/ApiResponse.js';
import {
    ApiError
} from '../utils/ApiError.js';
import StudentFCMToken from '../db/models/studentFCMToken.model.js';
import httpStatus from 'http-status';

const upsertStudentFCMToken = asyncHandler(async (req, res) => {
    const {
        studentId,
        fcmToken,
        deviceId,
        deviceModel,
        osVersion,
        appVersion,
        deviceType
    } = req.body;

    const student = await Student.findByPk(studentId);

    if (!student) {
        throw new ApiError(httpStatus.NOT_FOUND, "Student not found");
    }

    const [studentFCMTokenEntry, created] = await StudentFCMToken.findOrCreate({
        where: {
            studentId: studentId,
            deviceId: deviceId
        },
        defaults: {
            studentId: studentId,
            deviceId: deviceId,
            fcmToken: fcmToken,
            deviceModel: deviceModel,
            osVersion: osVersion,
            appVersion: appVersion,
            deviceType: deviceType
        }
    });

    if (!created) {
        studentFCMTokenEntry.fcmToken = fcmToken;
        studentFCMTokenEntry.deviceModel = deviceModel;
        studentFCMTokenEntry.osVersion = osVersion;
        studentFCMTokenEntry.appVersion = appVersion;
        studentFCMTokenEntry.deviceType = deviceType;
        await studentFCMTokenEntry.save();
    }

    res.
    status(created ? httpStatus.CREATED : httpStatus.OK).
    json(
        new ApiResponse(
            created ? httpStatus.CREATED : httpStatus.OK,
            created ? "FCM token added successfully" : "FCM token updated successfully",
            studentFCMTokenEntry
        )
    );
});

const removeStudentFCMTokens = asyncHandler(async (req, res) => {
    const {
        studentId,
        deviceId
    } = req.query;

    const student = await Student.findByPk(studentId);

    if (!student) {
        throw new ApiError(httpStatus.NOT_FOUND, "Student not found");
    }

    const studentFCMToken = await StudentFCMToken.findOne({
        where: {
            studentId: studentId,
            deviceId: deviceId
        }
    });

    if (!studentFCMToken) {
        throw new ApiError(httpStatus.NOT_FOUND, "FCM token is not added for this device");
    }

    await studentFCMToken.destroy();

    res.
    status(httpStatus.OK).
    json(
        new ApiResponse(
            httpStatus.OK,
            "FCM token deleted successfully",
            null
        )
    );
});

export {
    upsertStudentFCMToken,
    removeStudentFCMTokens
};
