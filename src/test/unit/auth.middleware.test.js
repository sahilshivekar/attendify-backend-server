import {
    jest
} from '@jest/globals';

jest.unstable_mockModule("../../db/models/admin.model.js", () => ({
    default: {
        findByPk: jest.fn()
    }
}));

jest.unstable_mockModule("../../db/models/student.model.js", () => ({
    default: {
        findByPk: jest.fn()
    }
}));

jest.unstable_mockModule("../../db/models/teacher.model.js", () => ({
    default: {
        findByPk: jest.fn()
    }
}));

jest.unstable_mockModule("jsonwebtoken", () => ({
    default: {
        verify: jest.fn()
    },
    verify: jest.fn()
}));

const {
    verifyJWT
} = await import("../../middlewares/auth.middleware.js");
const {
    ROLES
} = await import("../../config/roles.js");
const {
    StatusCodes
} = await import("http-status-codes");
const httpMocks = (await import("node-mocks-http")).default;
const jwt = (await import("jsonwebtoken")).default;

const Admin = (await import("../../db/models/admin.model.js")).default;
const Student = (await import("../../db/models/student.model.js")).default;
const Teacher = (await import("../../db/models/teacher.model.js")).default;

describe("verifyJWT middleware", () => {
    let req, res, next;

    beforeEach(() => {
        req = httpMocks.createRequest();
        res = httpMocks.createResponse();
        next = jest.fn();

        jest.clearAllMocks();
        Admin.findByPk.mockReset();
        Student.findByPk.mockReset();
        Teacher.findByPk.mockReset();

        jwt.verify.mockReset();
    });

    it("rejects when allowedRoles is empty", async () => {
        await verifyJWT([])(req, res, next);
        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                message: "No roles provided"
            })
        );
    });

    it("rejects when no token in cookies or Authorization", async () => {
        await verifyJWT([ROLES.ADMIN])(req, res, next);
        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({
                statusCode: StatusCodes.UNAUTHORIZED,
                message: "Unauthorized request: No token provided"
            })
        );
    });

    it("rejects when jwt.verify throws (invalid/expired)", async () => {
        req.cookies.accessToken = "token";

        jwt.verify.mockImplementation(() => {
            throw new Error("jwt malformed");
        });
        await verifyJWT([ROLES.ADMIN])(req, res, next);
        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({
                statusCode: StatusCodes.UNAUTHORIZED,
                message: "Unauthorized request: Invalid token"
            })
        );
    });

    it("rejects when decoded.role not in allowedRoles", async () => {
        req.cookies.accessToken = "token";
        jest.spyOn(jwt, "verify").mockReturnValue({
            id: "u1",
            role: ROLES.STUDENT
        });
        await verifyJWT([ROLES.ADMIN])(req, res, next);
        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({
                statusCode: StatusCodes.FORBIDDEN,
                message: "Forbidden: Insufficient permissions"
            })
        );
    });

    it("rejects when UserModel.findByPk resolves null", async () => {
        req.cookies.accessToken = "token";
        jwt.verify.mockReturnValue({
            id: "u1",
            role: ROLES.ADMIN
        });
        Admin.findByPk.mockResolvedValue(null);

        const nextCalled = new Promise((resolve) => {
            next.mockImplementation((err) => resolve(err));
        });

        await verifyJWT([ROLES.ADMIN])(req, res, next);

        const err = await nextCalled;
        expect(err).toMatchObject({
            statusCode: StatusCodes.UNAUTHORIZED,
            message: "Invalid Access Token: User not found"
        });
    });

    const roleCases = [{
            role: ROLES.STUDENT,
            bodyKey: "studentId",
            queryKey: "studentId",
            userKey: "student"
        },
        {
            role: ROLES.TEACHER,
            bodyKey: "teacherId",
            queryKey: "teacherId",
            userKey: "teacher"
        },
        {
            role: ROLES.ADMIN,
            bodyKey: "adminId",
            queryKey: "adminId",
            userKey: "admin"
        }
    ];

    describe.each(roleCases)("passes for valid role %s", (c) => {
        it(`sets req.body.${c.bodyKey}, req.query.${c.queryKey}, req.${c.userKey} for non-GET`, async () => {
            req.cookies.accessToken = "token";
            req.method = "POST";
            jest.spyOn(jwt, "verify").mockReturnValue({
                id: "u42",
                role: c.role
            });

            if (c.role === ROLES.STUDENT) Student.findByPk.mockResolvedValue({
                id: "u42"
            });
            else
            if (c.role === ROLES.TEACHER) Teacher.findByPk.mockResolvedValue({
                id: "u42"
            });
            else
            if (c.role === ROLES.ADMIN) Admin.findByPk.mockResolvedValue({
                id: "u42"
            });

            await verifyJWT([c.role])(req, res, next);
            expect(req.body[c.bodyKey]).toBe("u42");
            expect(req.query[c.queryKey]).toBe("u42");
            expect(req[c.userKey]).toEqual({
                id: "u42"
            });
            expect(next).toHaveBeenCalledWith();
        });

        it(`sets only req.query.${c.queryKey}, req.${c.userKey} for GET`, async () => {
            req.cookies.accessToken = "token";
            req.method = "GET";
            jest.spyOn(jwt, "verify").mockReturnValue({
                id: "u99",
                role: c.role
            });

            if (c.role === ROLES.STUDENT) Student.findByPk.mockResolvedValue({
                id: "u99"
            });
            else
            if (c.role === ROLES.TEACHER) Teacher.findByPk.mockResolvedValue({
                id: "u99"
            });
            else
            if (c.role === ROLES.ADMIN) Admin.findByPk.mockResolvedValue({
                id: "u99"
            });

            await verifyJWT([c.role])(req, res, next);
            expect(req.body[c.bodyKey]).toBeUndefined();
            expect(req.query[c.queryKey]).toBe("u99");
            expect(req[c.userKey]).toEqual({
                id: "u99"
            });
            expect(next).toHaveBeenCalledWith();
        });
    });
});
