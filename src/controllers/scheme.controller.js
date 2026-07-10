import Scheme from '../db/models/scheme.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'
import { Op } from 'sequelize'
import University from '../db/models/university.model.js';
import httpStatus from 'http-status';

//* get all the schemes
const getSchemes = asyncHandler(async (req, res) => {
    const { searchQuery } = req.query;

    let searchClause = {};

    if (searchQuery) {
        searchClause = {
            name: {
                [Op.iLike]: `%${searchQuery}%`
            }
        };
    }

    const schemes = await Scheme.findAll({
        where: searchClause,
        include: [
            {
                model: University,
                duplicating: false
            },
        ]
    });

    res
        .status(httpStatus.OK)
        .json(
            new ApiResponse(
                httpStatus.OK,
                "Schemes retrieved successfully.",
                schemes
            )
        );
});

//* add scheme
const addScheme = asyncHandler(async (req, res) => {
    const { name, universityId } = req.body;

    const university = await University.findByPk(universityId);

    if (!university) {
        throw new ApiError(httpStatus.NOT_FOUND, "University not found");
    }

    const scheme = await Scheme.create({
        name: name || "",
        universityId: universityId || null
    });

    res
        .status(httpStatus.CREATED)
        .json(
            new ApiResponse(
                httpStatus.CREATED,
                'Scheme added successfully',
                scheme
            )
        )
});

//* update scheme
const updateScheme = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    // Input validation is handled by @scheme.validation.js

    const scheme = await Scheme.findByPk(id);

    if (!scheme) {
        throw new ApiError(httpStatus.NOT_FOUND, "Scheme not found");
    }

    scheme.name = name || scheme.name;

    await scheme.save();

    res
        .status(httpStatus.OK)
        .json(
            new ApiResponse(
                httpStatus.OK,
                "Scheme updated successfully",
                scheme
            )
        );
});

//* remove scheme
const removeScheme = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Input validation is handled by @scheme.validation.js

    const scheme = await Scheme.findByPk(id);

    if (!scheme) {
        throw new ApiError(httpStatus.NOT_FOUND, "Scheme not found");
    }

    await scheme.destroy();

    res
        .status(httpStatus.OK)
        .json(
            new ApiResponse(
                httpStatus.OK,
                "Scheme deleted successfully",
                null
            )
        );
});

const getSchemeById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Input validation is handled by @scheme.validation.js

    const scheme = await Scheme.findOne({
        where: { id: id },
        include: [
            {
                model: University,
                required: true,
            }
        ]
    });

    if (!scheme) {
        throw new ApiError(httpStatus.NOT_FOUND, "Scheme not found");
    }

    res
        .status(httpStatus.OK)
        .json(
            new ApiResponse(
                httpStatus.OK,
                "Scheme retrieved successfully",
                scheme
            )
        );
});

export {
    getSchemes,
    addScheme,
    updateScheme,
    removeScheme,
    getSchemeById
};