const express = require('express')
const router = express.Router();
const nodemailer = require('nodemailer')
require('dotenv').config({ path: '../config_service/config.env' });
const { publishSubject, publishSubSubject, publishStudentInterests, publishTeacherExpertise } = require('../config_service/kafka/producer');

const { ChildParent, Users, Students, Parents, Subjects, StudentInterest, TeacherExpertise, SubSubjects, Teachers, Adresses } = require('../models');
const { createChildByParent, createParentApprovalEmail } = require('./utilities/utilities');
const { where } = require('sequelize');
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt')
const { discoverNotifService } = require('../config_service/discovery.service')
const axios = require('axios');
const { error } = require('node:console');
const multer = require('multer');
const { Op } = require('sequelize');
const redis = require('../config_service/redis.config')


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/subjects/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now();
        cb(null, uniqueSuffix + file.originalname)
    }
})

const upload = multer({ storage: storage })

const generateRandomPassword = (length = 10) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
    let password = "";
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
};

router.post("/request-child", async (req, res) => {
    const parentId = req.headers["x-user-id"];
    const { email } = req.body;

    if (!email) return res.status(400).json({ error: "Email is required" });

    try {
        const token = jwt.sign(
            { parentId, email },
            process.env.PARENT_APPROVAL_SECRET,
            { expiresIn: "48h" }
        );
        const approveLink = `/confirm-parent?token=${token}`;

        const studentExist = await Users.findOne({ where: { email } });

        if (studentExist) {
            const linkExist = await ChildParent.findOne({
                where: { idParent: parentId, idStudent: studentExist.id }
            });

            if (linkExist) {
                return res.status(400).json({
                    error: "The link between parent and child already exists"
                });
            }
            // send real notification

            const parent = await Users.findByPk(parentId)

            const serviceNotifyBaseUrl = await discoverNotifService();

            try {
                await axios.post(`${serviceNotifyBaseUrl}/notify`, {
                    idSender: parentId,
                    idReceiver: studentExist.id,
                    title: `a parent wants to link with you`,
                    message: `parent with email ${parent.email} is requesting you to accept the link as their child`,
                    metadata: {
                        emailParent: parent.email,
                        link: approveLink
                    },
                    type: "REQUEST_LINK_PARENT_CHILD"
                });
            } catch (err) {
                console.error("error while sending notification to child", err.message);
            }

            return res.status(200).json({
                message: "Link request has been sent to child"
            });
        }

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASS
            }
        });

        await transporter.sendMail({
            from: `"Edtech Team" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: "Your parent wants to link with your account",
            html: createParentApprovalEmail(email, `${process.env.CLIENT_ADDRESS}/${approveLink}`, parent.email)
        });

        res.status(200).json({
            message: "Email has been sent successfully"
        });

    } catch (error) {
        console.error("Internal Server Error", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.post("/child-approval", async (req, res) => {
    const { token, action } = req.body;

    try {

        const decoded = jwt.verify(token, process.env.PARENT_APPROVAL_SECRET);
        const { parentId, email: studentEmail } = decoded;

        if (!["approve", "refuse"].includes(action)) {
            return res.status(400).json({ error: "Invalid action" });
        }

        if (action === "approve") {

            const student = await Users.findOne({ where: { email: studentEmail } })

            if (student) {
                await ChildParent.create({
                    idParent: parentId,
                    idStudent: student.id,
                    pending: true
                })

                // Notify parent that the child accpeted the link

                const serviceNotifyBaseUrl = await discoverNotifService();

                try {

                    await axios.post(`${serviceNotifyBaseUrl}/notify`, {
                        idReceiver: parentId,
                        title: `the child accepted the link`,
                        message: `the child with email ${studentEmail} accepeted you as their parent`,
                        metadata: {
                            link: `/`
                        },
                        type: "REQUEST_LINK_PARENT_CHILD"
                    })

                } catch (error) {
                    console.error("error while sending notification to child", err.message);
                }

                return res.status(200).json({ message: "Child accepted the parent link and it has been established." });
            } else {

                // Notify parent that the child accpeted the link

                const serviceNotifyBaseUrl = await discoverNotifService();

                await axios.post(`${serviceNotifyBaseUrl}/notify`, {
                    idReceiver: parentId,
                    title: `the child accepted the link`,
                    message: `the child with email${studentEmail} accepeted the link you may now create their account`,
                    metadata: {
                        link: `/create-child`
                    },
                    type: "REQUEST_LINK_PARENT_CHILD"
                })
                    .catch((err) => console.error("error while sending notification to child", err.message))

                return res.status(200).json({ message: "Child approved the parent. Parent can now create the account" });

            }
        }

        // Child refused
        // Notify parent that the child refused
        res.status(200).json({ message: "Child refused the parent." });

    } catch (err) {
        console.error(err);
        return res.status(400).json({ error: "Invalid or expired token." });
    }
});

router.post("/link-existing-student", async (req, res) => {
    const studentId = req.headers["x-user-id"];
    const { parentId } = req.body;

    await ChildParent.create({
        idParent: parentId,
        idStudent: studentId,
        pending: false
    });

    return res.status(200).json({ message: "Link created successfully." });
});

router.post("/confirm-parent", async (req, res) => {
    const parentId = req.headers["x-user-id"];
    const { familyName, givenName, dateOfBirth, email } = req.body;

    try {

        let student = await Users.findOne({ where: { email: email } });

        if (!student) {
            const tempPassword = generateRandomPassword();
            const hashedPassword = await bcrypt.hash(tempPassword, 10);

            student = await Users.create({
                userName: `student_${familyName}_${Date.now()}`,
                familyName,
                givenName,
                email,
                pwd: hashedPassword,
                dateOfBirth,
                role: "student"
            });

            await Students.create({
                idStudent: student.id,
                userName: student.userName,
                familyName: student.familyName,
                givenName: student.givenName,
            })

            // Link parent-child
            await ChildParent.create({
                idParent: parentId,
                idStudent: student.id,
                pending: false
            });

            // Send email with temp password
            await transporter.sendMail({
                from: { name: "Edtech Team", address: process.env.GMAIL_USER },
                to: email,
                subject: "Your Edtech Account is Ready",
                html: createChildByParent(`${familyName} ${givenName}`, tempPassword, "http://localhost:3000/login")
            });
        }

        res.status(200).json({ message: "Parent successfully linked" });
    } catch (err) {
        res.status(500).json({ error: "Invalid or expired token" });
    }
});

router.get('/get-children', async (req, res) => {
    try {
        const parentId = req.headers['x-user-id']
        const userRole = req.headers['x-user-role']
        if (userRole !== "parent") return res.status(403).json({ error: "action unauthorized" })

        const parent = await Parents.findByPk(parentId)
        if (!parent) return res.status(404).json({ error: "this parent doesn't exist" })

        const children = await ChildParent.findAll({ where: { idParent: parentId } })
        const students = await Promise.all(
            children.map(async (c) => {
                const student = await Users.findByPk(c.idStudent)
                return {
                    userId: student.id,
                    userName: student.userName,
                    familyName: student.familyName,
                    givenName: student.givenName,
                    userImg: student.uerImg,
                    linkedAt: c.addedAt
                }
            })
        )

        res.status(200).json(students)

    } catch (error) {
        res.status(400).json("error while fetching the kids", error);
    }
})

//---------------Subjects and relations---------------//

router.post('/add-subject', upload.single('subImg'), async (req, res) => {
    try {
        const userRole = req.headers['x-user-role']
        if (userRole !== "admin") return res.status(403).json({ error: "Forbidden" })

        const { name, color } = req.body
        const subImg = req.file ? `subjects/${req.file.filename}` : null;

        const subject = await Subjects.findOne({ where: { name: name } })
        if (!subject) {
            const newSubject = await Subjects.create({ name: name, subImg: subImg, color: color })

            await publishSubject({
                idSubject: newSubject.idSubject,
                name: newSubject.name,
                color: newSubject.color,
                subImg: newSubject.subImg
            });

            return res.status(200).json({
                msg: "subject added sucessfully",
                newSubject
            })
        } else {
            return res.status(400).json({
                error: "Subject already exists"
            })
        }
    } catch (error) {
        console.error("Intenal server error", error)
    }
})

router.post('/subjects/:id/add-sub-subject', async (req, res) => {
    try {
        const userRole = req.headers['x-user-role']
        if (userRole !== "admin") return res.status(403).json({ error: "Forbidden" })

        const { name } = req.body
        const idSubject = req.params.id

        const subject = await Subjects.findByPk(idSubject)
        if (!subject) return res.status(400).json("subject doesn't exists")
        const subOfSubject = await SubSubjects.findOne({ where: { name: name, idSubject: idSubject } })
        if (subOfSubject) return res.status(400).json('element already exists')

        const newSub = await SubSubjects.create({
            idSubject: idSubject,
            name: name
        })

        await publishSubSubject({
            idSub: newSub.idSub,
            name: newSub.name,
            idSubject: newSub.idSubject
        });

        return res.status(200).json({
            msg: "subject added sucessfully",
            newSub
        })
    } catch (error) {
        console.error("Intenal server error", error)
    }
})

router.put('/subjects/:id/sub-subjects/:idSub', async (req, res) => {
    try {
        const userRole = req.headers['x-user-role']
        if (userRole !== "admin") return res.status(403).json({ error: "Forbidden" })

        const { name } = req.body
        const idSubject = req.params.id

        const subject = await Subjects.findByPk(idSubject)
        if (!subject) return res.status(400).json("subject doesn't exists")
        const subSubject = await SubSubjects.findByPk(req.params.idSub)
        if (subSubject) return res.status(400).json('sub subect doesnt exist')

        subSubject.name = name
        await subSubject.save()

        await publishSubSubject({
            idSub: newSub.idSub,
            name: newSub.name,
            idSubject: newSub.idSubject
        });

        return res.status(200).json({ msg: "Sub-subject updated successfully", subSubject })
    } catch (error) {
        console.error("Intenal server error", error.message)
    }
})

router.delete('/delete-subject/:id', async (req, res) => {

    try {
        const userRole = req.headers['x-user-role']
        if (userRole !== "admin") return res.status(403).json({ error: "Forbidden" })

        const id = req.params.id
        const subject = await Subjects.findByPk(id)
        if (!subject) return res.status(404).json({ error: "subject doesn't exist" })
        await subject.destroy()

        return res.status(200).json({ msg: "subject deleted sucessfully" })
    } catch (error) {
        console.error("Intenal server error", error)
    }

})

router.delete('/subjects/:id/sub-subjects/:idSub', async (req, res) => {
    try {
        const userRole = req.headers['x-user-role']
        if (userRole !== "admin") return res.status(403).json({ error: "Forbidden" })

        const id = req.params.id
        const subject = await Subjects.findByPk(id)
        if (!subject) return res.status(404).json({ error: "subject doesn't exist" })
        const subSubject = await SubSubjects.findByPk(req.params.idSub)
        if (!subSubject) return res.status(403).json({ error: "Not found" })

        await subSubject.destroy();

        return res.status(200).json({ msg: "subject deleted sucessfully" })
    } catch (error) {
        console.error("Intenal server error", error)
    }

})

router.get('/subjects/:id', async (req, res) => {
    try {
        const subject = await Subjects.findByPk(req.params.id)
        if (!subject) return res.status(404).json("subject not found")
        res.status(200).json(subject)
    } catch (error) {
        console.log(error.message);
        res.status(500).json("Internal Server Error", error);
    }
})

router.get('/sub-subjects/:id', async (req, res) => {
    try {
        const subject = await SubSubjects.findByPk(req.params.id)
        if (!subject) return res.status(404).json("sub subject not found")
        res.status(200).json(subject)
    } catch (error) {
        console.log(error.message);
        res.status(500).json("Internal Server Error", error);
    }
})

router.get('/get-subjects', async (req, res) => {
    try {
        const subjects = await Subjects.findAll();

        const enrichedSubjects = await Promise.all(
            subjects.map(async (sub) => {
                const subs = await SubSubjects.findAll({
                    where: { idSubject: sub.idSubject }
                });

                return {
                    ...sub.toJSON(), // in sql toJson() and in mongoose toObject()
                    subCategories: subs
                };
            })
        );

        res.status(200).json(enrichedSubjects);

    } catch (error) {
        console.log(error.message);
        res.status(500).json("Internal Server Error");
    }
});

router.get('/subjects/:id/specialities', async (req, res) => {
    try {
        const idSubject = req.params.id;
        const subject = await Subjects.findByPk(idSubject);
        if (!subject) return res.status(404).json("subject not found")

        const specialities = await SubSubjects.findAll({ where: { idSubject: idSubject } })
        res.status(200).json(specialities)
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: "Internal Server Error", message: error.message });
    }
})

router.post("/student/interests", async (req, res) => {
    try {
        const studentId = req.headers["x-user-id"]; // student id from token
        const interests = req.body.interests;

        if (!Array.isArray(interests) || interests.length === 0) {
            return res.status(400).json({ error: "Interests must be a non-empty array." });
        }

        await StudentInterest.destroy({ where: { idStudent: studentId } });

        // Insert new interests
        const insertData = interests.map(id => ({
            idStudent: studentId,
            idInterest: id
        }));

        await StudentInterest.bulkCreate(insertData); //for multipe insterts

        //publie en kafka
        await publishStudentInterests(studentId, interests);
        await redis.del(`interests:${studentId}`);
        return res.status(200).json({
            msg: "Interests updated successfully",
            interests
        });

    } catch (err) {
        console.error("Error updating student interests", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.post("/student/add-interest", async (req, res) => {
    try {
        const studentId = req.headers['x-user-id'];
        const { subjectId } = req.body;

        if (!subjectId) {
            return res.status(400).json({ error: "subjectId is required." });
        }

        const existing = await StudentInterest.findOne({
            where: { idStudent: studentId, idInterest: subjectId }
        });

        if (existing) {
            return res.status(400).json({ error: "Interest already exists." });
        }

        await StudentInterest.create({
            idStudent: studentId,
            idInterest: subjectId
        });

        return res.status(200).json({ msg: "Interest added successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.delete("/student/remove-interest/:subjectId", async (req, res) => {
    try {
        const studentId = req.headers["x-user-id"];
        const { subjectId } = req.params;

        const deleted = await StudentInterest.destroy({
            where: { idStudent: studentId, idInterest: subjectId }
        });

        if (!deleted) {
            return res.status(400).json({ error: "Interest not found." });
        }

        return res.status(200).json({ msg: "Interest removed successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.post("/teacher/expertise", async (req, res) => {
    try {
        const teacherId = req.headers['x-user-id'];
        const expertise = req.body.interests;

        if (!Array.isArray(expertise) || expertise.length === 0) {
            return res.status(400).json({ error: "Expertise must be a non-empty array." });
        }

        await TeacherExpertise.destroy({ where: { idTeacher: teacherId } });

        const insertData = expertise.map(id => ({
            idTeacher: teacherId,
            idExpertise: id
        }));

        await TeacherExpertise.bulkCreate(insertData);

        await publishTeacherExpertise(teacherId, expertise);
        await redis.del(`interests:${teacherId}`);

        return res.status(200).json({
            msg: "Expertise updated successfully",
            expertise
        });

    } catch (err) {
        console.error("Error updating expertise", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.post("/teacher/add-interest", async (req, res) => {
    try {
        const teacherId = req.headers['x-user-id'];
        const { subjectId } = req.body;

        if (!subjectId) {
            return res.status(400).json({ error: "subjectId is required." });
        }

        const existing = await TeacherExpertise.findOne({
            where: { idTeacher: teacherId, idExpertise: subjectId }
        });

        if (existing) {
            return res.status(400).json({ error: "Interest already exists." });
        }

        await TeacherExpertise.create({
            idTeacher: teacherId,
            idExpertise: subjectId
        });

        return res.status(200).json({ msg: "Interest added successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.delete("/teacher/remove-interest/:subjectId", async (req, res) => {
    try {
        const teacherId = req.user.id;
        const { subjectId } = req.params;

        const deleted = await TeacherExpertise.destroy({
            where: { idTeacher: teacherId, idExpertise: subjectId }
        });

        if (!deleted) {
            return res.status(400).json({ error: "Interest not found." });
        }

        return res.status(200).json({ msg: "Interest removed successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get('/get-teacher-expertise', async (req, res) => {
    const teacherId = req.headers['x-user-id']
    try {

        const intrests = await TeacherExpertise.findAll({ where: { idTeacher: teacherId } })

        const enrichedIntrests = await Promise.all(
            intrests.map(async (i) => {
                const subject = await Subjects.findByPk(i.idExpertise)
                const sub_subject = await SubSubjects.findAll({ where: { idSubject: i.idExpertise } })
                return {
                    idSubject: i.idExpertise,
                    name: subject.name,
                    subCategories: sub_subject
                }
            }))

        res.status(200).json(enrichedIntrests)

    } catch (error) {
        console.error("Error fetching teacher expertise", error);
        res.status(500).json({ error: "Internal server error" });
    }
})

//---------------GETTERS FOR FILTRATION-------------

router.get('/get-user-intrests', async (req, res) => {
    const userId = req.headers['x-user-id']

    try {
        const user = await Users.findByPk(userId)
        if (!user) return res.status(400).json("the user doesn't exist!!")

        const role = user.role
        if (role != "teacher" && role != "student") return res.status(400).json("Unotharized")

        let intrestIds;
        if (role == "student") {
            const intrests = await StudentInterest.findAll({ where: { idStudent: userId } })
            intrestIds = intrests.map((i) => i.idInterest)
        } else {
            const intrests = await TeacherExpertise.findAll({ where: { idTeacher: userId } })
            intrestIds = intrests.map((i) => i.idExpertise)
        }

        res.status(200).json(intrestIds)
    } catch (error) {
        console.log("error while fetching the intrests", error.message)
        res.status(500).json({ msg: "Internal Server Error", error })
    }
})

//----------Search 
router.get('/search', async (req, res) => {
    const { q } = req.query;

    if (!q || q.trim() === '') {
        return res.status(400).json({ message: 'Search query is required' });
    }

    const searchTerm = `%${q.trim()}%`;

    try {
        const users = await Users.findAll({
            where: {
                role: { [Op.ne]: 'admin' },
                [Op.or]: [
                    { familyName: { [Op.like]: searchTerm } },
                    { givenName: { [Op.like]: searchTerm } },
                    { userName: { [Op.like]: searchTerm } },
                ],
            },
            attributes: ['id', 'userName', 'familyName', 'givenName', 'email', 'role', 'uerImg', 'isActive'],
        });

        if (users.length === 0) {
            return res.status(404).json({ message: 'No users found' });
        }

        return res.status(200).json({ count: users.length, users });

    } catch (error) {
        console.error('Search error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

//------------Admin Endpoints----------//

router.get('/admin/get-teachers', async (req, res) => {
    try {
        const userRole = req.headers['x-user-role']
        if (userRole !== "admin") return res.status(403).json({ error: "Forbidden" })

        const teachers = await Users.findAll({ where: { role: "teacher" } })
        return res.status(200).json(teachers)
    } catch (error) {
        console.log('error while fetching for teachers: ', error.message)
        return res.status(500).json({ error: error.message })
    }
})

router.get('/admin/get-students', async (req, res) => {
    try {
        const userRole = req.headers['x-user-role']
        if (userRole !== "admin") return res.status(403).json({ error: "Forbidden" })

        const students = await Users.findAll({ where: { role: "student" } })
        return res.status(200).json(students)
    } catch (error) {
        console.log('error while fetching for students: ', error.message)
        return res.status(500).json({ error: error.message })
    }
})

router.get('/admin/get-parents', async (req, res) => {
    try {
        const userRole = req.headers['x-user-role']
        if (userRole !== "admin") return res.status(403).json({ error: "Forbidden" })

        const parents = await Users.findAll({ where: { role: "parent" } })
        return res.status(200).json(parents)
    } catch (error) {
        console.log('error while fetching for parents: ', error.message)
        return res.status(500).json({ error: error.message })
    }
})

router.get('/users/user-infos', async (req, res) => {
    try {
        const userId = req.headers['x-user-id']

        const [user, address] = await Promise.all([
            Users.findByPk(userId),
            Adresses.findOne({ where: { userId } })
        ])

        if (!user) return res.status(400).json({ error: "user does not exist" })

        let normalized = {
            id: user.id,
            userName: user.userName,
            familyName: user.familyName,
            givenName: user.givenName,
            userImg: user.uerImg,
            role: user.role,
            bio: user.bio,
            dateOfBirth: user.dateOfBirth,
            gender: user.gender,
            phoneNumber: user.phoneNumber,
            address: address ? {
                addressLine1: address.addressLine1,
                addressLine2: address.addressLine2,
                city: address.city,
                state: address.state,
                postalCode: address.postalCode,
                country: address.country,
            } : null
        }

        if (user.role === "student") {
            const student = await Students.findOne({ where: { idStudent: userId } })
            if (student) normalized = { ...normalized, levelOfEducation: student.levelOfEducation, institution: student.institution }
        } else if (user.role === "teacher") {
            const teacher = await Teachers.findOne({ where: { idTeacher: userId } })
            if (teacher) normalized = { ...normalized, grade: teacher.grade, placeOfWork: teacher.placeOfWork }
        }

        return res.status(200).json(normalized)
    } catch (error) {
        console.error('Error fetching user:', error.message)
        res.status(500).json({ error: 'Internal server error' })
    }
})

router.get('/users/:userName', async (req, res) => {
    try {
        const userName = req.params.userName
    
        const cachedKey = `portfolioDetailed${userName}`
        const cached = await redis.get(cachedKey)
        if(cached) return res.status(200).json(JSON.parse(cached))

        const user = await Users.findOne({ where: { userName } })
        if (!user) return res.status(400).json({ error: "user does not exist" })

        const userId = user.id
        const address = await Adresses.findOne({ where: { userId } })

        let normalized = {
            id: user.id,
            userName: user.userName,
            familyName: user.familyName,
            givenName: user.givenName,
            userImg: user.uerImg,
            role: user.role,
            bio: user.bio,
            dateOfBirth: user.dateOfBirth,
            gender: user.gender,
            phoneNumber: user.phoneNumber,
            address: address ? {
                addressLine1: address.addressLine1,
                addressLine2: address.addressLine2,
                city: address.city,
                state: address.state,
                postalCode: address.postalCode,
                country: address.country,
            } : null
        }

        if (user.role === "student") {
            const student = await Students.findOne({ where: { idStudent: userId } })
            if (student) normalized = { ...normalized, levelOfEducation: student.levelOfEducation, institution: student.institution }
        } else if (user.role === "teacher") {
            const teacher = await Teachers.findOne({ where: { idTeacher: userId } })
            if (teacher) normalized = { ...normalized, grade: teacher.grade, placeOfWork: teacher.placeOfWork }
        }

        await redis.setex(cachedKey, 120, JSON.stringify(normalized))
        return res.status(200).json(normalized)
    } catch (error) {
        console.log("error while fetching for user infos", error.message)
        res.status(500).json({ error: "Internal Server Error" })
    }
})

module.exports = router 