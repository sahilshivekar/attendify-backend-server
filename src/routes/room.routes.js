import express from 'express';
import {
    addRoom,
    getRooms,
    getRoomById,
    getRoomShedule,
    updateRoom,
    removeRoom
} from '../controllers/room.controller.js';
import {
    verifyJWT
} from '../middlewares/auth.middleware.js';
import {
    ROLES
} from '../config/roles.js';
import validate from '../middlewares/validate.js';
import roomValidation from '../validators/room.validation.js';

const router = express.Router();

router.route('/').
get(
    validate(roomValidation.getRooms),
    verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
    getRooms
).
post(
    validate(roomValidation.addRoom),
    verifyJWT([ROLES.ADMIN]),
    addRoom
);

router.route('/:id').
get(
    validate(roomValidation.getRoomById),
    verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
    getRoomById
).
put(
    validate(roomValidation.updateRoom),
    verifyJWT([ROLES.ADMIN]),
    updateRoom
).
delete(
    validate(roomValidation.removeRoom),
    verifyJWT([ROLES.ADMIN]),
    removeRoom
);

router.route('/:id/schedule').
get(
    validate(roomValidation.getRoomShedule),
    verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
    getRoomShedule
);

export default router;
