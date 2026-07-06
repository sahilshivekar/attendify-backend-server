'use strict';

const { v4: uuidv4 } = require('uuid'); // Import the uuid function

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const rooms = [];

        const getCapacity = (type) => {
            switch (type) {
                case 'Classroom': return 90;
                case 'Lab': return 30;
                default: return 0;
            }
        };

        const classroomNumbers = ['001', '002', '003', '402', '404', '301', '302', '304'];
        const labNumbers = ['501', '109', '108', '201', '704', '202', '105', '701', '702'];

        classroomNumbers.forEach((roomNumber) => {
            rooms.push({
                room_id: uuidv4(),
                room_number: roomNumber,
                room_type: 'Classroom',
                sitting_capacity: getCapacity('Classroom'),
                created_at: new Date(),
                updated_at: new Date()
            });
        });

        labNumbers.forEach((roomNumber) => {
            rooms.push({
                room_id: uuidv4(),
                room_number: roomNumber,
                room_type: 'Lab',
                sitting_capacity: getCapacity('Lab'),
                created_at: new Date(),
                updated_at: new Date()
            });
        });

        await queryInterface.bulkInsert('rooms', rooms, {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('rooms', null, {});
    }
};