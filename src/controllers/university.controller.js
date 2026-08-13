import University from '../db/models/university.model.js';
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

const getUniversities = asyncHandler(async (req, res) => {
    const universities = await University.findAll();

    res.
    status(httpStatus.OK).
    json(
        new ApiResponse(
            httpStatus.OK,
            "Universities retrieved successfully.",
            universities
        )
    );
});

const addUniversity = asyncHandler(async (req, res) => {
    const {
        name,
        abbreviation
    } = req.body;

    const university = await University.create({
        name,
        abbreviation: abbreviation || ""
    });

    res.
    status(httpStatus.CREATED).
    json(
        new ApiResponse(
            httpStatus.CREATED,
            'University added successfully',
            university
        )
    );
});

const updateUniversity = asyncHandler(async (req, res) => {
    const {
        id
    } = req.params;
    const {
        name,
        abbreviation
    } = req.body;

    const university = await University.findByPk(id);

    if (!university) {
        throw new ApiError(httpStatus.NOT_FOUND, "University not found");
    }

    if (name !== undefined) university.name = name;
    if (abbreviation !== undefined) university.abbreviation = abbreviation;

    await university.save();

    res.
    status(httpStatus.OK).
    json(
        new ApiResponse(
            httpStatus.OK,
            "University updated successfully",
            university
        )
    );
});

const removeUniversity = asyncHandler(async (req, res) => {
    const {
        id
    } = req.params;

    const university = await University.findByPk(id);

    if (!university) {
        throw new ApiError(httpStatus.NOT_FOUND, "University not found");
    }

    await university.destroy();

    res.
    status(httpStatus.OK).
    json(
        new ApiResponse(
            httpStatus.OK,
            "University deleted successfully",
            null
        )
    );
});

const getUniversityById = asyncHandler(async (req, res) => {
    const {
        id
    } = req.params;

    const university = await University.findByPk(id);

    if (!university) {
        throw new ApiError(httpStatus.NOT_FOUND, "University not found");
    }

    res.
    status(httpStatus.OK).
    json(
        new ApiResponse(
            httpStatus.OK,
            "University retrieved successfully",
            university
        )
    );
});

export {
    getUniversities,
    addUniversity,
    updateUniversity,
    removeUniversity,
    getUniversityById
};
