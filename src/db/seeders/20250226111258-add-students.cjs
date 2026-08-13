'use strict';

const bcrypt = require('bcrypt');
const {
    v4: uuidv4
} = require('uuid');

module.exports = {
    async up(queryInterface, Sequelize) {

        const branches = await queryInterface.sequelize.query(
            `SELECT branch_id, branch_name FROM branches;`, {
                type: queryInterface.sequelize.QueryTypes.SELECT
            }
        );
        const schemes = await queryInterface.sequelize.query(
            `SELECT scheme_id, scheme_name FROM schemes;`, {
                type: queryInterface.sequelize.QueryTypes.SELECT
            }
        );

        const branchIdMap = branches.reduce((map, branch) => {
            map[branch.branch_name] = branch.branch_id;
            return map;
        }, {});

        const schemeIdMap = schemes.reduce((map, scheme) => {
            map[scheme.scheme_name] = scheme.scheme_id;
            return map;
        }, {});

        if (!branchIdMap['Computer Engineering'] || !branchIdMap['Civil Engineering'] || !schemeIdMap["REV-2019 'C' Scheme"] || !schemeIdMap['NEP-2020 Scheme']) {
            throw new Error('Required branches or schemes not found for student seeding.');
        }

        let studentCounter = 1;
        const password = await bcrypt.hash('Student@123', Number(process.env.BCRYPT_SALT));
        const students = [];

        const firstNames = {

            FE: [

                "Farhan", "Fatima", "Faizan", "Fiona", "Fahad", "Falguni", "Fardeen", "Felix", "Fiza", "Franz",

                "Foster", "Fanny", "Freddy", "Florence", "Fahima", "Francis", "Feroz", "Fabian", "Fannie", "Frederick",

                "Firas", "Faheem", "Filip", "Fenton", "Farah", "Finn", "Felicity", "Fletcher", "Flora", "Firdous",

                "Fadi", "Franklin", "Fawaz", "Fabienne", "Fariha", "Flavio", "Ferris", "Floyd", "Farzana", "Florian",

                "Firdos", "Fitzgerald", "Frederica", "Fabiola", "Farley", "Frances", "Fikret", "Faustino", "Fergus", "Fitz"
            ],

            SE: [

                "Sahil", "Sanya", "Sarthak", "Sonia", "Siddharth", "Sneha", "Sumit", "Swati", "Shubham", "Sonam",

                "Suresh", "Sabrina", "Saurabh", "Sameer", "Samiksha", "Soumya", "Sandeep", "Saima", "Sharad", "Subhash",

                "Shivani", "Simran", "Sikandar", "Satish", "Saloni", "Sanjay", "Shruti", "Suman", "Suraj", "Sakshi",

                "Sahilpreet", "Shanaya", "Saroj", "Sudhir", "Salman", "Sushmita", "Saanvi", "Sidhant", "Sargun", "Samar",

                "Shantanu", "Shekhar", "Siddique", "Sasha", "Shakti", "Siddhi", "Suresha", "Shreya", "Sparsh", "Sakina"
            ],

            TE: [

                "Tarun", "Tanvi", "Tushar", "Tanya", "Taran", "Tina", "Tariq", "Trisha", "Tejas", "Taimur",

                "Tirth", "Tasha", "Tanmay", "Trupti", "Tarak", "Tabassum", "Tulsi", "Tanisha", "Tushita", "Tenzing",

                "Tazim", "Tapasya", "Tavish", "Twinkle", "Tahir", "Tula", "Tayeb", "Tajinder", "Tiyasha", "Tufail",

                "Tanveer", "Torsha", "Tameem", "Tarushi", "Tasnim", "Taj", "Tavleen", "Tushant", "Tushali", "Tarisha",

                "Toshan", "Tamanna", "Tushika", "Tennyson", "Tajuddin", "Tirath", "Taniska", "Tigran", "Tiyasha", "Tarlan"
            ],

            BE: [

                "Bhavesh", "Bhavna", "Bharat", "Bhumika", "Brijesh", "Bina", "Bhaskar", "Benedict", "Bishal", "Beena",

                "Basant", "Bodhi", "Bobby", "Brinda", "Bilal", "Bhumit", "Bharathi", "Bonnie", "Brij", "Brendon",

                "Brijraj", "Benny", "Bela", "Brock", "Bhavya", "Bikram", "Bhakti", "Brijmohan", "Barton", "Bernard",

                "Bhrigu", "Bashir", "Bronson", "Brahm", "Baxter", "Bhram", "Badr", "Brett", "Barun", "Baxendra",

                "Blake", "Bryson", "Benazir", "Barindra", "Beatrix", "Benedetta", "Bertram", "Bram", "Bastian", "Bodhan"
            ]

        };

        const compLastNames = [

            "Cohen", "Coleman", "Collins", "Cooper", "Cowan", "Conner", "Corbin", "Cortez", "Compton", "Conway",

            "Cochran", "Costello", "Covington", "Colton", "Correa", "Colby", "Colbert", "Cornell", "Cotton", "Coulter",

            "Coffey", "Colson", "Combs", "Cobb", "Coker", "Coles", "Cormichael", "Cousins", "Connelly", "Colwell",

            "Cosgrove", "Cornish", "Covey", "Colt", "Coulson", "Couture", "Cooley", "Cothbert", "Copley", "Cordero",

            "Cowan", "Coombs", "Colangelo", "Corrigan", "Couch", "Corcoran", "Connors", "Covarrubias", "Coxwell", "Colebrook",

            "Cowas", "Cobs", "Colan", "Cor", "Couchen", "Corcor", "Connor", "Covarrubs", "Coxtell", "Colebros"
        ];

        const civilLastNames = [

            "Ciaramella", "Ciaravella", "Ciardi", "Ciarletta", "Ciarlo", "Ciavarella", "Cianci", "Ciano", "Ciarrocchi", "Ciccarelli",

            "Ciccone", "Cicero", "Ciceri", "Cichon", "Cicogna", "Cifarelli", "Cifelli", "Cignarale", "Cignetti", "Cillo",

            "Cimatti", "Cimino", "Cimini", "Cimperman", "Cincotta", "Cindrich", "Cingolani", "Cinotti", "Cioban", "Ciobanu",

            "Cioran", "Ciotola", "Ciotti", "Ciuffreda", "Ciulla", "Ciulini", "Ciummei", "Civitella", "Civitillo", "Civita",

            "Civitano", "Cizmar", "Cizik", "Cizinski", "Cizek", "Cizmarik", "Cizner", "Cizova", "Cizotti", "Cizuela",

            "Civis", "Cizmario", "Cizikan", "Cizins", "Cizekats", "Cizmaree", "Cizneran", "Cizovar", "Cizot", "Cizuej"
        ];

        const generateStudent = (index, year, admissionType, schemeId, branchId) => {
            const lastNames = branchId === branchIdMap['Computer Engineering'] ? compLastNames : civilLastNames;
            const firstName = firstNames[year][index % firstNames[year].length];
            const lastName = lastNames[index % lastNames.length];
            const branchCode = branchId === branchIdMap['Computer Engineering'] ? 'COMP' : 'CIVIL';

            return {
                student_id: uuidv4(),
                student_prn: `PRN${branchCode}${year}${index + 1}`,
                first_name: firstName,
                last_name: lastName,
                middle_name: null,
                dob: new Date(2000 + index % 5, 0, 1),
                gender: index % 2 === 0 ? 'Male' : 'Female',
                email: `${firstName.toLowerCase()}${lastName.toLowerCase()}@gmail.com`,
                phone_number: `+91${9000000000 + studentCounter++}`,
                password: password,
                refresh_token: null,
                student_img_url: null,
                student_img_public_id: null,
                scheme_id: schemeId,
                created_at: new Date(),
                updated_at: new Date(),
                admission_year: 2026 - (year === 'FE' ? 0 : year === 'SE' ? 1 : year === 'TE' ? 2 : 3),
                admission_type: admissionType,
                branch_id: branchId
            };
        };

        ['SE', 'TE', 'BE'].forEach((year) => {
            for (let i = 0; i < 60; i++) {
                students.push(generateStudent(i, year, 'FE', schemeIdMap["REV-2019 'C' Scheme"], branchIdMap['Computer Engineering']));
            }
        });

        ['FE'].forEach((year) => {
            for (let i = 0; i < 60; i++) {
                students.push(generateStudent(i, year, 'FE', schemeIdMap['NEP-2020 Scheme'], branchIdMap['Computer Engineering']));
            }
        });

        ['FE'].forEach((year) => {
            for (let i = 0; i < 60; i++) {
                students.push(generateStudent(i, year, 'FE', schemeIdMap['NEP-2020 Scheme'], branchIdMap['Civil Engineering']));
            }
        });

        await queryInterface.bulkInsert('students', students, {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('students', null, {});
    }
};
