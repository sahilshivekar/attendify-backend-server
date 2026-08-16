import {
    Op
} from 'sequelize';
import Batch from '../../db/models/batch.model.js';
import Semester from '../../db/models/semester.model.js';
import {
    asyncHandler
} from '../../utils/asyncHandler.js';
import {
    ApiError
} from '../../utils/ApiError.js';
import {
    ApiResponse
} from '../../utils/ApiResponse.js';
import Branch from '../../db/models/branch.model.js';
import Scheme from '../../db/models/scheme.model.js';
import Division from '../../db/models/division.model.js';
import httpStatus from 'http-status';

const getBatches = asyncHandler(async (req, res) => {
    const {
        semesterNumber,
        branchId,
        divisionId,
        academicStartYear,
        academicEndYear,
        searchQuery,
        page,
        limit,
        getAll
    } = req.query;

    const searchClause = {};

    if (searchQuery) {
        searchClause.batchCode = {
            [Op.iLike]: `%${searchQuery}%`
        };
    }

    const semesterWhereClause = {};

    if (semesterNumber) {
        semesterWhereClause.semesterNumber = {
            [Op.eq]: semesterNumber
        };
    }

    if (branchId) {
        semesterWhereClause.branchId = {
            [Op.eq]: branchId
        };
    }

    if (academicStartYear) {
        semesterWhereClause.academicStartYear = {
            [Op.gte]: academicStartYear
        };
    }

    if (academicEndYear) {
        semesterWhereClause.academicEndYear = {
            [Op.lte]: academicEndYear
        };
    }

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const batches = await Batch.findAndCountAll({
        where: {
            [Op.and]: [
                searchClause,
                ...(divisionId ? [{
                    divisionId
                }] : [])
            ]

        },
        include: {
            model: Division,
            required: true,
            duplicating: false,
            include: [{
                model: Semester,
                required: true,
                duplicating: false,
                where: semesterWhereClause,
                include: [{
                        model: Branch,
                        required: true,
                        duplicating: false
                    },
                    {
                        model: Scheme,
                        required: true,
                        duplicating: false
                    }
                ]

            }]

        },
        ...(limit && getAll === false ? {
            offset: offset
        } : {}),
        ...(limit && getAll === false ? {
            limit
        } : {})
    });

    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, "Batches fetched successfully", {
        batches: batches.rows,
        totalCount: batches.count
    }));

});

const getBatchById = asyncHandler(async (req, res) => {
    const {
        id
    } = req.params;

    const batch = await Batch.findOne({
        where: {
            id: id
        },
        include: [{
            model: Division,
            required: true,
            include: [{
                model: Semester,
                required: true,
                include: [{
                        model: Branch,
                        required: true
                    },
                    {
                        model: Scheme,
                        required: true
                    }
                ]

            }]

        }]

    });

    if (!batch) {
        throw new ApiError(httpStatus.NOT_FOUND, "Batch not found");
    }

    res.
    status(httpStatus.OK).
    json(
        new ApiResponse(
            httpStatus.OK,
            "Batch retrieved successfully",
            batch
        )
    );
});

const addBatch = asyncHandler(async (req, res) => {
    const {
        batchCode,
        divisionId
    } = req.body;

    const division = await Division.findByPk(divisionId);
    if (!division) {
        throw new ApiError(httpStatus.NOT_FOUND, "Division not found");
    }

    const existingBatch = await Batch.findOne({
        where: {
            batchCode: batchCode,
            divisionId: divisionId
        }
    });
    if (existingBatch) {
        throw new ApiError(httpStatus.CONFLICT, "Batch with this code already exists in the division");
    }

    const batch = await Batch.create({
        batchCode: batchCode,
        divisionId: divisionId
    });

    if (!batch) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Some issue occured while adding batch");
    }

    res.status(httpStatus.CREATED).json(new ApiResponse(httpStatus.CREATED, "Batch added successfully", batch));
});

const updateBatch = asyncHandler(async (req, res) => {
    const {
        id
    } = req.params;
    const {
        batchCode
    } = req.body;

    const batch = await Batch.findByPk(id);

    if (!batch) {
        throw new ApiError(httpStatus.NOT_FOUND, "Batch not found");
    }

    if (batchCode && batchCode !== batch.batchCode) {
        const existingBatch = await Batch.findOne({
            where: {
                batchCode: batchCode,
                divisionId: batch.divisionId,
                id: {
                    [Op.ne]: id
                }
            }
        });
        if (existingBatch) {
            throw new ApiError(httpStatus.CONFLICT, "Batch with this code already exists in the division");
        }
    }

    batch.batchCode = batchCode;

    await batch.save();

    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, "Batch updated successfully", batch));
});

const removeBatch = asyncHandler(async (req, res) => {
    const {
        id
    } = req.params;

    const batch = await Batch.findByPk(id);

    if (!batch) {
        throw new ApiError(httpStatus.NOT_FOUND, "Batch not found");
    }

    await batch.destroy();

    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, "Batch deleted successfully", null));
});

export {
    getBatches,
    addBatch,
    updateBatch,
    removeBatch,
    getBatchById
};
