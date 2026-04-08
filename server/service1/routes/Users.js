const express = require('express')
const router = express.Router();
const nodemailer = require('nodemailer')
require('dotenv').config({ path: '../config_service/config.env' });

const { ChildParent, Users, Students, Subjects, StudentInterest, TeacherExpertise, SubSubjects } = require('../models');
const { createChildByParent, createParentApprovalEmail } = require('./utilities/utilities');
const { where } = require('sequelize');
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt')
const { discoverNotifService } = require('../config_service/discovery.service')
const axios = require('axios');
const { error } = require('node:console');
const multer = require('multer')

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
        const approveLink = `http://localhost:3000/confirm-parent?token=${token}`;

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
            html: createParentApprovalEmail(email, approveLink)
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
                        message: `the child with email${studentEmail} accepeted you as their parent`,
                        metadata: {
                            link: `/my-children`
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
                    message: `the child with email${studentEmail} accepeted the linl you may create their account`,
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
        res.status(400).json({ error: "Invalid or expired token" });
    }
});

//---------------Subjects and relations---------------//

router.post('/add-subject', upload.single('subImg'), async (req, res) => {

    const { name, color } = req.body
    const subImg = req.file ? `subjects/${req.file.filename}` : null;

    try {

        const subject = await Subjects.findOne({ where: { name: name } })

        if (!subject) {

            const newSubject = await Subjects.create({ name: name, subImg: subImg, color: color })

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

router.post('/:id/add-sub-subject', async (req, res) => {

    const { name } = req.body
    const idSubject = req.params.id

    try {

        const subject = await Subjects.findByPk(idSubject)

        if (!subject) return res.status(400).json("subject doesn't exists")

        const subOfSubject = await SubSubjects.findOne({ where: { name: name } })
        if (subOfSubject) return res.status(400).json('element already exists')

        const newSub = await SubSubjects.create({
            idSubject: idSubject,
            name: name
        })
        return res.status(200).json({
            msg: "subject added sucessfully",
            newSub
        })

    } catch (error) {

        console.error("Intenal server error", error)

    }

})

router.delete('/delete-subject/:name', async (req, res) => {

    const { name } = req.params.name

    try {

        const subject = await Subjects.findOne({ where: { name: name } })

        if (subject) {

            await Subjects.destroy({ where: { name: name } })

            return res.status(200).json({
                msg: "subject deleted sucessfully",
            })

        } else {
            return res.status(400).json({
                error: "Subject doesn't exist"
            })
        }

    } catch (error) {

        console.error("Intenal server error", error)

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

router.post("/student/interests", async (req, res) => {
    try {
        const studentId = req.headers["x-user-id"]; // student id from token
        const { interests } = req.body;

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
        const { expertise } = req.body;

        if (!Array.isArray(expertise) || expertise.length === 0) {
            return res.status(400).json({ error: "Expertise must be a non-empty array." });
        }

        await TeacherExpertise.destroy({ where: { idTeacher: teacherId } });

        const insertData = expertise.map(id => ({
            idTeacher: teacherId,
            idExpertise: id
        }));

        await TeacherExpertise.bulkCreate(insertData);

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

module.exports = router 