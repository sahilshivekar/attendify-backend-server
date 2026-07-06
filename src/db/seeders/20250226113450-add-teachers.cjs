'use strict';

const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid'); // Import the uuid function

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {

        const password = await bcrypt.hash(
            'Teacher@123',
            Number(process.env.BCRYPT_SALT))

        let teacherCounter = 1;

        const teacherMembersDetails = [
            { firstName: "Avinash", lastName: "Gondal", gender: "Male", role: "Principal" },
            { firstName: "Dhananjay", lastName: "Wankhede", gender: "Male", role: "Head of Department" },
            { firstName: "Chaitali", lastName: "Godse", gender: "Female", role: "Teacher" },
            { firstName: "Padmaja", lastName: "Duvvuri", gender: "Female", role: "Teacher" },
            { firstName: "Kalpalata", lastName: "Sripada", gender: "Female", role: "Teacher" },
            { firstName: "Priyanka", lastName: "Shinde", gender: "Female", role: "Teacher" },
            { firstName: "Smita", lastName: "Badwe", gender: "Female", role: "Teacher" },
            { firstName: "Rahilah", lastName: "Shaikh", gender: "Female", role: "Teacher" },
            { firstName: "Chandrashekhar", lastName: "Chougule", gender: "Male", role: "Teacher" },
            { firstName: "Shrinivas", lastName: "Hulsure", gender: "Male", role: "Teacher" },
            { firstName: "Sandeep", lastName: "More", gender: "Male", role: "Teacher" },
            { firstName: "Nilesh", lastName: "Meheta", gender: "Male", role: "Teacher" },
            { firstName: "Renuka", lastName: "Sanga", gender: "Female", role: "Teacher" },
            { firstName: "Varsha", lastName: "Jogalekar", gender: "Female", role: "Teacher" },
            { firstName: "Ranjana", lastName: "Singh", gender: "Female", role: "Head of Department" },
            { firstName: "Rahul", lastName: "Jinturkar", gender: "Male", role: "Teacher" },
            { firstName: "Dhananjay", lastName: "Raut", gender: "Male", role: "Teacher" },
            { firstName: "Rucha", lastName: "Patwardhan", gender: "Female", role: "Teacher" },
        ];

        // The .map is synchronous here since bcrypt.hash is awaited beforehand
        const teacherMembers = teacherMembersDetails.map((teacher) => ({
            teacher_id: uuidv4(), // Generate a UUID for each teacher
            first_name: teacher.firstName,
            last_name: teacher.lastName,
            middle_name: null,
            teacher_email: `${teacher.firstName.toLowerCase()}${teacher.lastName.toLowerCase()}@gmail.com`,
            teacher_phone_number: `+91${9000000000 + teacherCounter++}`,
            teacher_gender: teacher.gender,
            teacher_highest_qualification: "M.Tech",
            teacher_role: teacher.role,
            teacher_password: password,
            is_active: true,
            teacher_image_url: null,
            teacher_image_public_id: null,
            refresh_token: null,
            created_at: new Date(),
            updated_at: new Date(),
        }));

        await queryInterface.bulkInsert("teacher", teacherMembers);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete("teacher", null, {})
    }
};