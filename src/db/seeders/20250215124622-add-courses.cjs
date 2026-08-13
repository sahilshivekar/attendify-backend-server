'use strict';

const {
    v4: uuidv4
} = require('uuid');

module.exports = {
    async up(queryInterface, Sequelize) {

        const schemes = await queryInterface.sequelize.query(
            `SELECT scheme_id, scheme_name FROM schemes WHERE scheme_name IN ('REV-2019 ''C'' Scheme', 'NEP-2020 Scheme');`, {
                type: queryInterface.sequelize.QueryTypes.SELECT
            }
        );

        const rev2019SchemeId = schemes.find((s) => s.scheme_name === "REV-2019 'C' Scheme")?.scheme_id;
        const nep2020SchemeId = schemes.find((s) => s.scheme_name === "NEP-2020 Scheme")?.scheme_id;

        if (!rev2019SchemeId || !nep2020SchemeId) {
            throw new Error('Could not find the required schemes to link courses to.');
        }

        const courses = [

            {
                course_code: 'BSC101',
                course_name: 'Applied Mathematics - I',
                scheme_id: nep2020SchemeId,
                course_type: 'Lecture'
            },
            {
                course_code: 'BSC102',
                course_name: 'Applied Physics',
                scheme_id: nep2020SchemeId,
                course_type: 'Lecture'
            },
            {
                course_code: 'BSC103',
                course_name: 'Applied Chemistry',
                scheme_id: nep2020SchemeId,
                course_type: 'Lecture'
            },
            {
                course_code: 'ESC101',
                course_name: 'Engineering Mechanics',
                scheme_id: nep2020SchemeId,
                course_type: 'Lecture'
            },
            {
                course_code: 'ESC102',
                course_name: 'Basic Electrical & Electronics Engineering',
                scheme_id: nep2020SchemeId,
                course_type: 'Lecture'
            },
            {
                course_code: 'BSL101',
                course_name: 'Applied Physics Lab',
                scheme_id: nep2020SchemeId,
                course_type: 'Practical'
            },
            {
                course_code: 'BSL102',
                course_name: 'Applied Chemistry Lab',
                scheme_id: nep2020SchemeId,
                course_type: 'Practical'
            },
            {
                course_code: 'ESL101',
                course_name: 'Engineering Mechanics Lab',
                scheme_id: nep2020SchemeId,
                course_type: 'Practical'
            },
            {
                course_code: 'ESL102',
                course_name: 'Basic Electrical & Electronics Engineering Lab',
                scheme_id: nep2020SchemeId,
                course_type: 'Practical'
            },
            {
                course_code: 'AEC101',
                course_name: 'Professional and Communication Ethics',
                scheme_id: nep2020SchemeId,
                course_type: 'Lecture'
            },
            {
                course_code: 'AEL101',
                course_name: 'Professional and Communication Ethics Lab',
                scheme_id: nep2020SchemeId,
                course_type: 'Practical'
            },
            {
                course_code: 'SEC101',
                course_name: 'Engineering Workshop-I',
                scheme_id: nep2020SchemeId,
                course_type: 'Practical'
            },
            {
                course_code: 'VSEC102',
                course_name: 'C Programming',
                scheme_id: nep2020SchemeId,
                course_type: 'Lecture'
            },
            {
                course_code: 'CC101',
                course_name: 'Induction cum Universal Human Values',
                scheme_id: nep2020SchemeId,
                course_type: 'Lecture'
            },
            {
                course_code: 'BSC201',
                course_name: 'Applied Mathematics - II',
                scheme_id: nep2020SchemeId,
                course_type: 'Lecture'
            },
            {
                course_code: 'BSC202X',
                course_name: 'Elective Physics',
                scheme_id: nep2020SchemeId,
                course_type: 'Lecture'
            },
            {
                course_code: 'BSC203X',
                course_name: 'Elective Chemistry',
                scheme_id: nep2020SchemeId,
                course_type: 'Lecture'
            },
            {
                course_code: 'ESC201',
                course_name: 'Engineering Graphics',
                scheme_id: nep2020SchemeId,
                course_type: 'Lecture'
            },
            {
                course_code: 'PCC201X',
                course_name: 'Program Core Course',
                scheme_id: nep2020SchemeId,
                course_type: 'Lecture'
            },
            {
                course_code: 'BSL201X',
                course_name: 'Elective Physics Lab',
                scheme_id: nep2020SchemeId,
                course_type: 'Practical'
            },
            {
                course_code: 'BSL202X',
                course_name: 'Elective Chemistry Lab',
                scheme_id: nep2020SchemeId,
                course_type: 'Practical'
            },
            {
                course_code: 'ESL201',
                course_name: 'Engineering Graphics Lab',
                scheme_id: nep2020SchemeId,
                course_type: 'Practical'
            },
            {
                course_code: 'PCL201X',
                course_name: 'Program Core Lab',
                scheme_id: nep2020SchemeId,
                course_type: 'Practical'
            },
            {
                course_code: 'CC201',
                course_name: 'Social Science & Community Services',
                scheme_id: nep2020SchemeId,
                course_type: 'Lecture'
            },
            {
                course_code: 'IKS201',
                course_name: 'Indian knowledge System',
                scheme_id: nep2020SchemeId,
                course_type: 'Lecture'
            },
            {
                course_code: 'VSEC201',
                course_name: 'Engineering Workshop-II',
                scheme_id: nep2020SchemeId,
                course_type: 'Practical'
            },
            {
                course_code: 'VSEC202',
                course_name: 'Python Programming',
                scheme_id: nep2020SchemeId,
                course_type: 'Lecture'
            },

            {
                course_code: 'CSC301',
                course_name: 'Engineering Mathematics-III',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture'
            },
            {
                course_code: 'CSC302',
                course_name: 'Discrete Structures and Graph Theory',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture'
            },
            {
                course_code: 'CSC303',
                course_name: 'Data Structure',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture'
            },
            {
                course_code: 'CSC304',
                course_name: 'Digital Logic & Computer Architecture',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture'
            },
            {
                course_code: 'CSC305',
                course_name: 'Computer Graphics',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture'
            },
            {
                course_code: 'CSL301',
                course_name: 'Data Structure Lab',
                scheme_id: rev2019SchemeId,
                course_type: 'Practical'
            },
            {
                course_code: 'CSL302',
                course_name: 'Digital Logic & Computer Architecture Lab',
                scheme_id: rev2019SchemeId,
                course_type: 'Practical'
            },
            {
                course_code: 'CSL303',
                course_name: 'Computer Graphics Lab',
                scheme_id: rev2019SchemeId,
                course_type: 'Practical'
            },
            {
                course_code: 'CSL304',
                course_name: 'Skill base Lab course: Object Oriented Programming with Java',
                scheme_id: rev2019SchemeId,
                course_type: 'Practical'
            },
            {
                course_code: 'CSC401',
                course_name: 'Engineering Mathematics-IV',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture'
            },
            {
                course_code: 'CSC402',
                course_name: 'Analysis of Algorithm',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture'
            },
            {
                course_code: 'CSC403',
                course_name: 'Database Management System',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture'
            },
            {
                course_code: 'CSC404',
                course_name: 'Operating System',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture'
            },
            {
                course_code: 'CSC405',
                course_name: 'Microprocessor',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture'
            },
            {
                course_code: 'CSL401',
                course_name: 'Analysis of Algorithm Lab',
                scheme_id: rev2019SchemeId,
                course_type: 'Practical'
            },
            {
                course_code: 'CSL402',
                course_name: 'Database Management System Lab',
                scheme_id: rev2019SchemeId,
                course_type: 'Practical'
            },
            {
                course_code: 'CSL403',
                course_name: 'Operating System Lab',
                scheme_id: rev2019SchemeId,
                course_type: 'Practical'
            },
            {
                course_code: 'CSL404',
                course_name: 'Microprocessor Lab',
                scheme_id: rev2019SchemeId,
                course_type: 'Practical'
            },
            {
                course_code: 'CSL405',
                course_name: 'Skill Base Lab Course: Python Programming',
                scheme_id: rev2019SchemeId,
                course_type: 'Practical'
            },
            {
                course_code: 'CSC501',
                course_name: 'Theoretical Computer Science',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture'
            },
            {
                course_code: 'CSC502',
                course_name: 'Software Engineering',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture'
            },
            {
                course_code: 'CSC503',
                course_name: 'Computer Network',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture'
            },
            {
                course_code: 'CSC504',
                course_name: 'Data Warehousing & Mining',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture'
            },
            {
                course_code: 'CSL501',
                course_name: 'Software Engineering Lab',
                scheme_id: rev2019SchemeId,
                course_type: 'Practical'
            },
            {
                course_code: 'CSL502',
                course_name: 'Computer Network Lab',
                scheme_id: rev2019SchemeId,
                course_type: 'Practical'
            },
            {
                course_code: 'CSL503',
                course_name: 'Data Warehousing & Mining Lab',
                scheme_id: rev2019SchemeId,
                course_type: 'Practical'
            },
            {
                course_code: 'CSL504',
                course_name: 'Business Comm. & Ethics II',
                scheme_id: rev2019SchemeId,
                course_type: 'Practical'
            },
            {
                course_code: 'CSDLO5011',
                course_name: 'Probabilistic Graphical Models',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'CSDLO501'
            },
            {
                course_code: 'CSDLO5012',
                course_name: 'Internet Programming',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'CSDLO501'
            },
            {
                course_code: 'CSDLO5013',
                course_name: 'Advance Database Management System',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'CSDLO501'
            },
            {
                course_code: 'CSC601',
                course_name: 'System Programming & Compiler Construction',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture'
            },
            {
                course_code: 'CSC602',
                course_name: 'Cryptography & System Security',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture'
            },
            {
                course_code: 'CSC603',
                course_name: 'Mobile Computing',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture'
            },
            {
                course_code: 'CSC604',
                course_name: 'Artificial Intelligence',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture'
            },
            {
                course_code: 'CSL601',
                course_name: 'System Programming & Compiler Construction Lab',
                scheme_id: rev2019SchemeId,
                course_type: 'Practical'
            },
            {
                course_code: 'CSL602',
                course_name: 'Cryptography & System Security Lab',
                scheme_id: rev2019SchemeId,
                course_type: 'Practical'
            },
            {
                course_code: 'CSL603',
                course_name: 'Mobile Computing Lab',
                scheme_id: rev2019SchemeId,
                course_type: 'Practical'
            },
            {
                course_code: 'CSL604',
                course_name: 'Artificial Intelligence Lab',
                scheme_id: rev2019SchemeId,
                course_type: 'Practical'
            },
            {
                course_code: 'CSL605',
                course_name: 'Skill base Lab Course: Cloud Computing',
                scheme_id: rev2019SchemeId,
                course_type: 'Practical'
            },
            {
                course_code: 'CSDLO6011',
                course_name: 'Internet of Things',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'CSDLO601'
            },
            {
                course_code: 'CSDLO6012',
                course_name: 'Digital Signal & Image Processing',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'CSDLO601'
            },
            {
                course_code: 'CSDLO6013',
                course_name: 'Quantitative Analysis',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'CSDLO601'
            },
            {
                course_code: 'CSC701',
                course_name: 'Machine Learning',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture'
            },
            {
                course_code: 'CSC702',
                course_name: 'Big Data Analytics',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture'
            },
            {
                course_code: 'CSL701',
                course_name: 'Machine Learning Lab',
                scheme_id: rev2019SchemeId,
                course_type: 'Practical'
            },
            {
                course_code: 'CSL702',
                course_name: 'Big Data Analytics Lab',
                scheme_id: rev2019SchemeId,
                course_type: 'Practical'
            },
            {
                course_code: 'CSDC7011',
                course_name: 'Machine Vision',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'CSDC701'
            },
            {
                course_code: 'CSDC7012',
                course_name: 'Quantum Computing',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'CSDC701'
            },
            {
                course_code: 'CSDC7013',
                course_name: 'Natural Language Processing',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'CSDC701'
            },
            {
                course_code: 'CSDL7011',
                course_name: 'Machine Vision Lab',
                scheme_id: rev2019SchemeId,
                course_type: 'Practical',
                course_optional_course: 'CSDL701'
            },
            {
                course_code: 'CSDL7012',
                course_name: 'Quantum Computing Lab',
                scheme_id: rev2019SchemeId,
                course_type: 'Practical',
                course_optional_course: 'CSDL701'
            },
            {
                course_code: 'CSDL7013',
                course_name: 'Natural Language Processing Lab',
                scheme_id: rev2019SchemeId,
                course_type: 'Practical',
                course_optional_course: 'CSDL701'
            },
            {
                course_code: 'CSDC7021',
                course_name: 'Augmented and Virtual Reality',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'CSDC702'
            },
            {
                course_code: 'CSDC7022',
                course_name: 'Block Chain',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'CSDC702'
            },
            {
                course_code: 'CSDC7023',
                course_name: 'Information Retrieval',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'CSDC702'
            },
            {
                course_code: 'CSDL7021',
                course_name: 'Augmented and Virtual Reality Lab',
                scheme_id: rev2019SchemeId,
                course_type: 'Practical',
                course_optional_course: 'CSDL702'
            },
            {
                course_code: 'CSDL7022',
                course_name: 'Block Chain Lab',
                scheme_id: rev2019SchemeId,
                course_type: 'Practical',
                course_optional_course: 'CSDL702'
            },
            {
                course_code: 'CSDL7023',
                course_name: 'Information Retrieval Lab',
                scheme_id: rev2019SchemeId,
                course_type: 'Practical',
                course_optional_course: 'CSDL702'
            },
            {
                course_code: 'CSC801',
                course_name: 'Distributed Computing',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture'
            },
            {
                course_code: 'CSL801',
                course_name: 'Distributed Computing Lab',
                scheme_id: rev2019SchemeId,
                course_type: 'Practical'
            },
            {
                course_code: 'CSDC8011',
                course_name: 'Deep Learning',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'CSDC801'
            },
            {
                course_code: 'CSDC8012',
                course_name: 'Digital Forensic',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'CSDC801'
            },
            {
                course_code: 'CSDC8013',
                course_name: 'Applied Data Science',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'CSDC801'
            },
            {
                course_code: 'CSDL8011',
                course_name: 'Deep Learning Lab',
                scheme_id: rev2019SchemeId,
                course_type: 'Practical',
                course_optional_course: 'CSDL801'
            },
            {
                course_code: 'CSDL8012',
                course_name: 'Digital Forensic Lab',
                scheme_id: rev2019SchemeId,
                course_type: 'Practical',
                course_optional_course: 'CSDL801'
            },
            {
                course_code: 'CSDL8013',
                course_name: 'Applied Data Science Lab',
                scheme_id: rev2019SchemeId,
                course_type: 'Practical',
                course_optional_course: 'CSDL801'
            },
            {
                course_code: 'CSDC8021',
                course_name: 'Optimization in Machine Learning',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'CSDC802'
            },
            {
                course_code: 'CSDC8022',
                course_name: 'High Performance Computing',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'CSDC802'
            },
            {
                course_code: 'CSDC8023',
                course_name: 'Social Media Analytics',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'CSDC802'
            },
            {
                course_code: 'CSDL8021',
                course_name: 'Optimization in Machine Learning Lab',
                scheme_id: rev2019SchemeId,
                course_type: 'Practical',
                course_optional_course: 'CSDL802'
            },
            {
                course_code: 'CSDL8022',
                course_name: 'High Performance Computing Lab',
                scheme_id: rev2019SchemeId,
                course_type: 'Practical',
                course_optional_course: 'CSDL802'
            },
            {
                course_code: 'CSDL8023',
                course_name: 'Social Media Analytics Lab',
                scheme_id: rev2019SchemeId,
                course_type: 'Practical',
                course_optional_course: 'CSDL802'
            },
            {
                course_code: 'CEC301',
                course_name: 'Engineering Mathematics-III',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture'
            },
            {
                course_code: 'CEC302',
                course_name: 'Mechanics of Solids',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture'
            },
            {
                course_code: 'CEC303',
                course_name: 'Engineering Geology',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture'
            },
            {
                course_code: 'CEC304',
                course_name: 'Architectural Planning & Design of Buildings',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture'
            },
            {
                course_code: 'CEC305',
                course_name: 'Fluid Mechanics- I',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture'
            },
            {
                course_code: 'CEL301',
                course_name: 'Mechanics of Solids Lab',
                scheme_id: rev2019SchemeId,
                course_type: 'Practical'
            },
            {
                course_code: 'CEL302',
                course_name: 'Engineering Geology Lab',
                scheme_id: rev2019SchemeId,
                course_type: 'Practical'
            },
            {
                course_code: 'CEL303',
                course_name: 'Architectural Planning & Design of Buildings Lab',
                scheme_id: rev2019SchemeId,
                course_type: 'Practical'
            },
            {
                course_code: 'CEL304',
                course_name: 'Fluid Mechanics- I Lab',
                scheme_id: rev2019SchemeId,
                course_type: 'Practical'
            },
            {
                course_code: 'CEL305',
                course_name: 'Skill Based Lab Course-I',
                scheme_id: rev2019SchemeId,
                course_type: 'Practical'
            },
            {
                course_code: 'CEC401',
                course_name: 'Engineering Mathematics - IV',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture'
            },
            {
                course_code: 'CEC402',
                course_name: 'Structural Analysis',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture'
            },
            {
                course_code: 'CEC403',
                course_name: 'Surveying',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture'
            },
            {
                course_code: 'CEC404',
                course_name: 'Building Materials & Concrete Technology',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture'
            },
            {
                course_code: 'CEC405',
                course_name: 'Fluid Mechanics-II',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture'
            },
            {
                course_code: 'CEL401',
                course_name: 'Structural Analysis Lab',
                scheme_id: rev2019SchemeId,
                course_type: 'Practical'
            },
            {
                course_code: 'CEL402',
                course_name: 'Surveying Lab',
                scheme_id: rev2019SchemeId,
                course_type: 'Practical'
            },
            {
                course_code: 'CEL403',
                course_name: 'Building Material Concrete Technology Lab',
                scheme_id: rev2019SchemeId,
                course_type: 'Practical'
            },
            {
                course_code: 'CEL404',
                course_name: 'Fluid Mechanics-II Lab',
                scheme_id: rev2019SchemeId,
                course_type: 'Practical'
            },
            {
                course_code: 'CEL405',
                course_name: 'Skill Based lab Course-II',
                scheme_id: rev2019SchemeId,
                course_type: 'Practical'
            },
            {
                course_code: 'CEC501',
                course_name: 'Theory of Reinforced Concrete Structures',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture'
            },
            {
                course_code: 'CEC502',
                course_name: 'Applied Hydraulics',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture'
            },
            {
                course_code: 'CEC503',
                course_name: 'Geotechnical Engineering-I',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture'
            },
            {
                course_code: 'CEC504',
                course_name: 'Transportation Engineering',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture'
            },
            {
                course_code: 'CEL501',
                course_name: 'Theory of Reinforced Concrete Structures Lab',
                scheme_id: rev2019SchemeId,
                course_type: 'Practical'
            },
            {
                course_code: 'CEL502',
                course_name: 'Applied Hydraulics Lab',
                scheme_id: rev2019SchemeId,
                course_type: 'Practical'
            },
            {
                course_code: 'CEL503',
                course_name: 'Geotechnical Engineering-I Lab',
                scheme_id: rev2019SchemeId,
                course_type: 'Practical'
            },
            {
                course_code: 'CEL504',
                course_name: 'Transportation Engineering Lab',
                scheme_id: rev2019SchemeId,
                course_type: 'Practical'
            },
            {
                course_code: 'CEL505',
                course_name: 'Professional Communication and Ethics Lab',
                scheme_id: rev2019SchemeId,
                course_type: 'Practical'
            },
            {
                course_code: 'CEDLO5011',
                course_name: 'Modern Surveying Instruments and Techniques',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'CEDLO501'
            },
            {
                course_code: 'CEDLO5012',
                course_name: 'Building Services & Repairs',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'CEDLO501'
            },
            {
                course_code: 'CEDLO5013',
                course_name: 'Sustainable Building Materials',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'CEDLO501'
            },
            {
                course_code: 'CEDLO5014',
                course_name: 'Advanced Structural Mechanics',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'CEDLO501'
            },
            {
                course_code: 'CEDLO5015',
                course_name: 'Air and Noise Pollution & Control',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'CEDLO501'
            },
            {
                course_code: 'CEDLO5016',
                course_name: 'Transportation Planning & Economics',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'CEDLO501'
            },
            {
                course_code: 'CEDLO5017',
                course_name: 'Advanced Concrete Technology',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'CEDLO501'
            },
            {
                course_code: 'CEC601',
                course_name: 'Design & Drawing of Steel Structures',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture'
            },
            {
                course_code: 'CEC602',
                course_name: 'Water Resources Engineering',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture'
            },
            {
                course_code: 'CEC603',
                course_name: 'Geotechnical Engineering-II',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture'
            },
            {
                course_code: 'CEC604',
                course_name: 'Environmental Engineering',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture'
            },
            {
                course_code: 'CEL601',
                course_name: 'Design & Drawing of Steel Structures Lab',
                scheme_id: rev2019SchemeId,
                course_type: 'Practical'
            },
            {
                course_code: 'CEL602',
                course_name: 'Water Resources Engineering Lab',
                scheme_id: rev2019SchemeId,
                course_type: 'Practical'
            },
            {
                course_code: 'CEL603',
                course_name: 'Geotechnical Engineering-II Lab',
                scheme_id: rev2019SchemeId,
                course_type: 'Practical'
            },
            {
                course_code: 'CEL604',
                course_name: 'Environmental Engineering Lab',
                scheme_id: rev2019SchemeId,
                course_type: 'Practical'
            },
            {
                course_code: 'CEL605',
                course_name: 'Skill Based Lab Course - III',
                scheme_id: rev2019SchemeId,
                course_type: 'Practical'
            },
            {
                course_code: 'CEDLO6011',
                course_name: 'Rock Mechanics',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'CEDLO601'
            },
            {
                course_code: 'CEDLO6012',
                course_name: 'Biological Processes & Contaminant Removal',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'CEDLO601'
            },
            {
                course_code: 'CEDLO6013',
                course_name: 'Construction Equipment & Techniques',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'CEDLO601'
            },
            {
                course_code: 'CEDLO6014',
                course_name: 'Urban Infrastructure Planning',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'CEDLO601'
            },
            {
                course_code: 'CEDLO6015',
                course_name: 'Open Channel Flow',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'CEDLO601'
            },
            {
                course_code: 'CEDLO6016',
                course_name: 'Computational Structural Analysis',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'CEDLO601'
            },
            {
                course_code: 'CEDLO6017',
                course_name: 'Traffic Engineering and Management',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'CEDLO601'
            },
            {
                course_code: 'CEDLO6018',
                course_name: 'Introduction to Offshore Engineering',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'CEDLO601'
            },
            {
                course_code: 'CEC701',
                course_name: 'Design & Drawing of Reinforced Concrete Structures',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture'
            },
            {
                course_code: 'CEC702',
                course_name: 'Quantity Survey, Estimation and Valuation',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture'
            },
            {
                course_code: 'CEL701',
                course_name: 'Design & Drawing of Reinforced Concrete Structures Lab',
                scheme_id: rev2019SchemeId,
                course_type: 'Practical'
            },
            {
                course_code: 'CEL702',
                course_name: 'Quantity Survey, Estimation and Valuation Lab',
                scheme_id: rev2019SchemeId,
                course_type: 'Practical'
            },
            {
                course_code: 'CEDLO7011',
                course_name: 'Pre-stressed Concrete',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'CEDLO701'
            },
            {
                course_code: 'CEDLO7012',
                course_name: 'Applied Hydrology and Flood Control',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'CEDLO701'
            },
            {
                course_code: 'CEDLO7013',
                course_name: 'Appraisal and Implementation of Infra Projects',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'CEDLO701'
            },
            {
                course_code: 'CEDLO7014',
                course_name: 'Analysis of Offshore Structures',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'CEDLO701'
            },
            {
                course_code: 'CEDLO7015',
                course_name: 'Advanced Construction Technology',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'CEDLO701'
            },
            {
                course_code: 'CEDLO7016',
                course_name: 'Pavement Materials Construction and Maintenance',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'CEDLO701'
            },
            {
                course_code: 'CEDLO7021',
                course_name: 'Foundation Analysis and Design',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'CEDLO702'
            },
            {
                course_code: 'CEDLO7022',
                course_name: 'Solid and Hazardous Waste Management',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'CEDLO702'
            },
            {
                course_code: 'CEDLO7023',
                course_name: 'Ground Improvement techniques',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'CEDLO702'
            },
            {
                course_code: 'CEDLO7024',
                course_name: 'Green building constructions',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'CEDLO702'
            },
            {
                course_code: 'CEDLO7025',
                course_name: 'Legal Aspects in constructions',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'CEDLO702'
            },
            {
                course_code: 'CEDLO7026',
                course_name: 'Environmental impact assessment',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'CEDLO702'
            },
            {
                course_code: 'CEDLO7027',
                course_name: 'Advanced Design of Steel Structures',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'CEDLO702'
            },
            {
                course_code: 'ILO7011',
                course_name: 'Product Lifecycle Management',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'ILO701'
            },
            {
                course_code: 'ILO7012',
                course_name: 'Reliability Engineering',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'ILO701'
            },
            {
                course_code: 'ILO7013',
                course_name: 'Management Information Systems',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'ILO701'
            },
            {
                course_code: 'ILO7014',
                course_name: 'Design of Experiments',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'ILO701'
            },
            {
                course_code: 'ILO7015',
                course_name: 'Operations Research',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'ILO701'
            },
            {
                course_code: 'ILO7016',
                course_name: 'Cyber Security and Laws',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'ILO701'
            },
            {
                course_code: 'ILO7017',
                course_name: 'Disaster Management and Mitigation Measures',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'ILO701'
            },
            {
                course_code: 'ILO7018',
                course_name: 'Energy Audit and Management',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'ILO701'
            },
            {
                course_code: 'ILO7019',
                course_name: 'Development Engineering',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'ILO701'
            },
            {
                course_code: 'CEC801',
                course_name: 'Construction Management',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture'
            },
            {
                course_code: 'CEL801',
                course_name: 'Construction Management Lab',
                scheme_id: rev2019SchemeId,
                course_type: 'Practical'
            },
            {
                course_code: 'CEDLO8011',
                course_name: 'Bridge Engineering',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'CEDLO801'
            },
            {
                course_code: 'CEDLO8012',
                course_name: 'Design of Hydraulics Structures',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'CEDLO801'
            },
            {
                course_code: 'CEDLO8013',
                course_name: 'Construction Safety',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'CEDLO801'
            },
            {
                course_code: 'CEDLO8014',
                course_name: 'Pavement Design',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'CEDLO801'
            },
            {
                course_code: 'CEDLO8015',
                course_name: 'Industrial Waste Treatment',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'CEDLO801'
            },
            {
                course_code: 'CEDLO8016',
                course_name: 'Soil Dynamics',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'CEDLO801'
            },
            {
                course_code: 'CEDLO8021',
                course_name: 'Repairs, Rehabilitation and Retrofitting of structures',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'CEDLO802'
            },
            {
                course_code: 'CEDLO8022',
                course_name: 'Physico-Chemical Treatment of Water and Waste Water',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'CEDLO802'
            },
            {
                course_code: 'CEDLO8023',
                course_name: 'Transportation System Engineering',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'CEDLO802'
            },
            {
                course_code: 'CEDLO8024',
                course_name: 'Smart Building Materials',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'CEDLO802'
            },
            {
                course_code: 'CEDLO8025',
                course_name: 'Structural Dynamics',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'CEDLO802'
            },
            {
                course_code: 'CEDLO8026',
                course_name: 'Ground Water Engineering',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'CEDLO802'
            },
            {
                course_code: 'ILO8021',
                course_name: 'Project Management',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'ILO802'
            },
            {
                course_code: 'ILO8022',
                course_name: 'Finance Management',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'ILO802'
            },
            {
                course_code: 'ILO8023',
                course_name: 'Entrepreneurship Development and Management',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'ILO802'
            },
            {
                course_code: 'ILO8024',
                course_name: 'Human Resource Management',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'ILO802'
            },
            {
                course_code: 'ILO8025',
                course_name: 'Professional Ethics and CSR',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'ILO802'
            },
            {
                course_code: 'ILO8026',
                course_name: 'Research Methodology',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'ILO802'
            },
            {
                course_code: 'ILO8027',
                course_name: 'IPR and Patenting',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'ILO802'
            },
            {
                course_code: 'ILO8028',
                course_name: 'Digital Business Management',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'ILO802'
            },
            {
                course_code: 'ILO8029',
                course_name: 'Environmental Management',
                scheme_id: rev2019SchemeId,
                course_type: 'Lecture',
                course_optional_course: 'ILO802'
            }
        ];

        const coursesToInsert = courses.map((course) => ({
            ...course,
            course_id: uuidv4(),
            created_at: new Date(),
            updated_at: new Date()
        }));

        await queryInterface.bulkInsert('courses', coursesToInsert, {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('courses', null, {});
    }
};
