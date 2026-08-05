'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // await queryInterface.sequelize.query(`
        //     CREATE TYPE public.enum_students_admission_type AS ENUM ('DSE', 'FE');
        //   `);
        // Create the ENUM type for biometric verification status
        await queryInterface.sequelize.query(`
            CREATE TYPE "enum_students_biometric_verification_status" AS ENUM ('Not Submitted', 'Pending Review', 'Approved', 'Rejected');
        `);

        await queryInterface.createTable(
            'students',
            {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true,
                    field: 'student_id',
                },
                prn: {
                    type: Sequelize.STRING,
                    allowNull: false,
                    unique: true,
                    field: 'student_prn',
                },
                firstName: {
                    type: Sequelize.STRING,
                    allowNull: false,
                    field: 'first_name',
                },
                lastName: {
                    type: Sequelize.STRING,
                    allowNull: false,
                    field: 'last_name',
                },
                middleName: {
                    type: Sequelize.STRING,
                    allowNull: true,
                    field: 'middle_name',
                },
                dob: {
                    type: Sequelize.DATEONLY,
                    allowNull: true,
                    field: 'dob',
                },
                gender: {
                    type: Sequelize.STRING,
                    allowNull: false,
                    field: 'gender',
                },
                email: {
                    type: Sequelize.STRING,
                    allowNull: false,
                    unique: true,
                    field: 'email',
                },
                phoneNumber: {
                    type: Sequelize.STRING,
                    allowNull: false,
                    unique: true,
                    field: 'phone_number',
                },
                parentEmail: {
                    type: Sequelize.STRING,
                    allowNull: true,
                    unique: false,
                    field: 'parent_email',
                },
                admissionYear: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    field: 'admission_year',
                },
                admissionType: {
                    type: Sequelize.ENUM('DSE', 'FE'),
                    allowNull: false,
                    field: 'admission_type',
                },
                password: {
                    type: Sequelize.STRING,
                    allowNull: false,
                    field: 'password',
                    defaultValue: 'Student@123'
                },
                refreshToken: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                    field: 'refresh_token'
                },
                studentImgUrl: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                    field: 'student_img_url',
                },
                studentImgPublicId: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                    field: 'student_img_public_id',
                },
                schemeId: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    references: {
                        model: 'schemes', // Ensure 'schemes' table exists
                        key: 'scheme_id',
                    }, onDelete: 'CASCADE',
                    field: 'scheme_id',
                },
                branchId: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    references: {
                        model: 'branches', // Ensure 'branches' table exists
                        key: 'branch_id',
                    },
                    onDelete: 'CASCADE',
                    field: 'branch_id',
                },
                faceDescriptor: {
                    type: Sequelize.ARRAY(Sequelize.FLOAT),
                    allowNull: true,
                    field: 'face_descriptor',
                },
                biometricVerificationStatus: {
                    type: Sequelize.ENUM('Not Submitted', 'Pending Review', 'Approved', 'Rejected'),
                    allowNull: false,
                    defaultValue: 'Not Submitted',
                    field: 'biometric_verification_status',
                },
                faceImageKeys: {
                    type: Sequelize.ARRAY(Sequelize.TEXT),
                    allowNull: true,
                    defaultValue: [],
                    field: 'face_image_keys',
                },
                createdAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    field: 'created_at',
                    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
                },
                updatedAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    field: 'updated_at',
                    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
                }
            },
            {
                timestamps: true, // Enables automatic 'createdAt' and 'updatedAt'
                freezeTableName: true,
            }
        );

        await queryInterface.addIndex('students', ['first_name', 'last_name']);
        await queryInterface.addIndex('students', ['admission_year']);
        await queryInterface.addIndex('students', ['admission_type']);
        await queryInterface.addIndex('students', ['branch_id']);
        await queryInterface.addIndex('students', ['scheme_id']);
        await queryInterface.addIndex('students', ['biometric_verification_status']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('students');

        // Drop the ENUM type
        await queryInterface.sequelize.query(`
            DROP TYPE IF EXISTS "enum_students_biometric_verification_status";
        `);
    },
};
