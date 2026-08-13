import Branch from '../db/models/branch.model.js';
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

const getBranches = asyncHandler(async (req, res) => {

    const {
        searchQuery
    } = req.query;

    const whereClause = {};

    if (searchQuery) {
        whereClause.name = {
            [Op.iLike]: `%${searchQuery}%`
        };
    }

    const branches = await Branch.findAll({
        where: whereClause
    });

    res.
    status(httpStatus.OK).
    json(
        new ApiResponse(
            httpStatus.OK,
            "Branches retrieved successfully.",
            branches
        )
    );
});

const addBranch = asyncHandler(async (req, res) => {

    const {
        name,
        abbreviation
    } = req.body;

    const branch = await Branch.create({
        name,
        abbreviation
    });

    res.
    status(httpStatus.CREATED).
    json(
        new ApiResponse(
            httpStatus.CREATED,
            'Branch added successfully',
            branch
        )
    );

});

const updateBranch = asyncHandler(async (req, res) => {

    const {
        id
    } = req.params;
    const {
        name,
        abbreviation
    } = req.body;

    const branch = await Branch.findByPk(id);

    if (!branch) {
        throw new ApiError(httpStatus.NOT_FOUND, "Branch not found");
    }

    branch.name = name || branch.name;
    branch.abbreviation = abbreviation || branch.abbreviation;

    await branch.save();

    res.
    status(httpStatus.OK).
    json(
        new ApiResponse(
            httpStatus.OK,
            "Branch updated successfully",
            branch
        )
    );
});

const removeBranch = asyncHandler(async (req, res) => {

    const {
        id
    } = req.params;

    const branch = await Branch.findByPk(id);

    if (!branch) {
        throw new ApiError(httpStatus.NOT_FOUND, "Branch not found");
    }

    await branch.destroy();

    res.
    status(httpStatus.OK).
    json(
        new ApiResponse(
            httpStatus.OK,
            "Branch deleted successfully",
            null
        )
    );
});

const getBranchById = asyncHandler(async (req, res) => {
    const {
        id
    } = req.params;

    const branch = await Branch.findByPk(id);

    if (!branch) {
        throw new ApiError(httpStatus.NOT_FOUND, "Branch not found");
    }

    res.
    status(httpStatus.OK).
    json(
        new ApiResponse(
            httpStatus.OK,
            "Branch retrieved successfully",
            branch
        )
    );
});

export {
    getBranches,
    addBranch,
    updateBranch,
    removeBranch,
    getBranchById
};
