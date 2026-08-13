import {
    ApiError
} from "../utils/ApiError.js";
import {
    asyncHandler
} from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import Admin from "../db/models/admin.model.js";
import Student from "../db/models/student.model.js";
import Teacher from "../db/models/teacher.model.js";
import {
    ROLES
} from "../config/roles.js";
import {
    StatusCodes
} from "http-status-codes";
import {
    logger
} from "../config/logger.js";
const modelMap = {
    [ROLES.ADMIN]: Admin,
    [ROLES.TEACHER]: Teacher,
    [ROLES.STUDENT]: Student
};

const verifyJWT = (allowedRoles) =>
    asyncHandler(async (req, _, next) => {

        if (allowedRoles.length === 0) throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, "No roles provided");

        const token =
            req.cookies?.adminAccessToken ||
            req.cookies?.teacherAccessToken ||
            req.cookies?.studentAccessToken ||
            req.cookies?.accessToken ||
            req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {

            throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized request: No token provided");
        }

        let decodedToken;
        try {
            decodedToken = jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET);
        } catch (error) {
            logger.error(`JWT verification failed: ${error}`);
            throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized request: Invalid token");
        }

        if (!decodedToken || !decodedToken.id || !decodedToken.role) {

            throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid token");
        }

        if (!allowedRoles.includes(decodedToken.role)) {
            logger.warn(`Forbidden: User role ${decodedToken.role} not in allowed roles ${JSON.stringify(allowedRoles)}`);
            throw new ApiError(StatusCodes.FORBIDDEN, "Forbidden: Insufficient permissions");
        }

        const UserModel = modelMap[decodedToken.role];

        const user = await UserModel.findByPk(decodedToken.id, {
            attributes: {
                exclude: ["password", "refreshToken"]
            }
        });

        if (!user) {
            logger.error(`User not found for id: ${decodedToken.id}, role: ${decodedToken.role}`);
            throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid Access Token: User not found");
        } else {
            logger.info(`JWT verified for userId: ${decodedToken?.id}, role: ${decodedToken?.role}`);
        }

        if (req.method !== "GET") {
            if (decodedToken.role === ROLES.STUDENT) {
                req.body.studentId = user.id;
            } else if (decodedToken.role === ROLES.TEACHER) {
                req.body.teacherId = user.id;
            } else if (decodedToken.role === ROLES.ADMIN) {
                req.body.adminId = user.id;
            }
        }

        if (decodedToken.role === ROLES.STUDENT) {
            req.student = user;
        } else if (decodedToken.role === ROLES.TEACHER) {
            req.teacher = user;
        } else if (decodedToken.role === ROLES.ADMIN) {
            req.admin = user;
        }

        next();
    });

export {
    verifyJWT
};
