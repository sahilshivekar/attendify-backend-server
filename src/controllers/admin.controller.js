import Admin from '../db/models/admin.model.js';
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
import httpStatus from 'http-status';

const addAdmin = asyncHandler(async (req, res) => {

    const {
        email,
        username,
        password
    } = req.body;

    await Admin.create({
        email,
        username,
        password
    });

    const newAdmin = await Admin.findOne({
        where: {
            email
        }
    });

    if (!newAdmin) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Some issue occuered while adding admin");
    }

    res.
    status(httpStatus.CREATED).
    json(
        new ApiResponse(
            httpStatus.CREATED,
            'Admin added successfully',
            newAdmin
        )
    );

});

const updateAdminDetails = asyncHandler(async (req, res) => {

    const {
        email,
        username
    } = req.body;

    if (req.admin.username == username && req.admin.email == email) {
        throw new ApiError(httpStatus.BAD_REQUEST, "No changes detected. The username and email are the same as the current ones.");
    }

    const admin = await Admin.findByPk(req.admin.id);

    admin.username = username;
    admin.email = email.toLowerCase();
    await admin.save();

    res.
    status(httpStatus.OK).
    json(
        new ApiResponse(
            httpStatus.OK,
            "Admin details updated successfully",
            admin
        )
    );
});

const removeAdmin = asyncHandler(async (req, res) => {

    const admin = await Admin.findByPk(req.admin.id);

    if (!admin) {
        throw new ApiError(httpStatus.NOT_FOUND, "Admin not found");
    }

    await admin.destroy();

    res.
    status(httpStatus.OK).
    clearCookie("adminAccessToken").
    clearCookie("adminRefreshToken").
    json(
        new ApiResponse(
            httpStatus.OK,
            "Admin account deleted successfully",
            "If you are not accessing this api from a browser then you must manually remove the tokens stored"
        )
    );
});

const getAdmins = asyncHandler(async (req, res) => {
    const {
        searchQuery,
        sortBy,
        sortOrder,
        page,
        limit
    } = req.query;

    const offset = (page - 1) * limit;

    let whereClause = {};

    if (searchQuery) {
        whereClause = {
            [Op.or]: [{
                    email: {
                        [Op.like]: `%${searchQuery}%`
                    }
                },
                {
                    username: {
                        [Op.like]: `%${searchQuery}%`
                    }
                }
            ]

        };
    }

    const orderClause = [
        [sortBy, sortOrder]
    ];

    const admins = await Admin.findAll({
        where: whereClause,
        order: orderClause,
        offset: offset,
        limit: limit
    });

    res.
    status(httpStatus.OK).
    json(
        new ApiResponse(
            httpStatus.OK,
            "Admins retrieved successfully.",
            admins
        )
    );
});

const getAdminDetails = asyncHandler(async (req, res) => {

    const admin = await Admin.scope("withPassword").findByPk(req.admin.id);

    if (!admin) {
        throw new ApiError(httpStatus.NOT_FOUND, "Admin not found");
    }

    res.status(httpStatus.OK).json(
        new ApiResponse(
            httpStatus.OK,
            "Admin details retrieved successfully",
            admin
        )
    );
});

export {
    addAdmin,
    updateAdminDetails,
    removeAdmin,
    getAdmins,
    getAdminDetails
};
