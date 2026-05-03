const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { sign } = require('jsonwebtoken');
const multer = require('multer');
require('dotenv').config({ path: '../config_service/config.env' });
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { Op } = require('sequelize');
const { generateResetPasswordEmail } = require('./utilities/utilities');
const { publishUsers } = require('../config_service/kafka/producer');

const { Users, Parents, Students, Teachers, Admins, ResetPassword, Adresses } = require('../models');
const { Model, where } = require('sequelize');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/profiles/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now();
        cb(null, uniqueSuffix + file.originalname)
    }
})

const upload = multer({ storage: storage })

router.post('/register', async (req, res) => {

    const { role, familyName, givenName, DateOfBirth, userName, email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const existingUser = await Users.findOne({ where: { email: email } });

        if (existingUser) {
            return res.status(400).json({ errorEmail: 'Email already in use' });
        }

        let finalUserName = userName;

        if (!finalUserName) {
            if (role === "admin") {
                finalUserName = `admin_${familyName}_${Date.now()}`;
            }
        } else {
            const existingUserName = await Users.findOne({ where: { userName: userName } })

            if (existingUserName) {
                return res.status(400).json({ errorUsername: 'UserName already in use' });
            }
        }

        const newUser = await Users.create({
            userName: finalUserName,
            familyName: familyName,
            givenName: givenName,
            email: email,
            pwd: hashedPassword,
            dateOfBirth: DateOfBirth,
            role: role
        });

        await publishUsers(newUser);

        const accessToken = sign({
            userId: newUser.id,
            userName: newUser.userName,
            userRole: newUser.role
        }, process.env.JWT_ACCESS_SECRET, {
            expiresIn: '15m'
        });

        const refreshToken = sign({
            userId: newUser.id,
            userName: newUser.userName,
            userRole: newUser.role
        }, process.env.JWT_REFRESH_SECRET, {
            expiresIn: '7d'
        });

        res.cookie('accessToken', accessToken, { maxAge: 900000 });
        res.cookie('refreshToken', refreshToken, {
            maxAge: 14 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            secure: true,
            sameSite: 'strict'
        });

        if (role === 'parent') {
            await Parents.create({
                idParent: newUser.id,
                userName: newUser.userName,
                familyName: newUser.familyName,
                givenName: newUser.givenName,
            })
        } else if (role === 'student') {
            await Students.create({
                idStudent: newUser.id,
                userName: newUser.userName,
                familyName: newUser.familyName,
                givenName: newUser.givenName,
            })
        } else if (role === 'teacher') {
            await Teachers.create({
                idTeacher: newUser.id,
                userName: newUser.userName,
                familyName: newUser.familyName,
                givenName: newUser.givenName,
            })
        } else {
            await Admins.create({
                familyName: newUser.familyName,
                givenName: newUser.givenName,
                email: newUser.email,
                pwd: hashedPassword,
            })
        }

        return res.status(201).json({
            message: 'User registered successfully',
            userId: newUser.id
        });

    } catch (error) {
        console.error('Error during registration:', error);
        return res.status(500).json({ error: 'An error occurred during registration' });
    }
})

router.post('/login', async (req, res) => {
    const { identifier, password } = req.body;

    try {

        if (!identifier) {
            return res.status(400).json({ error: "Please enter your email or username" });
        }

        // Detect if identifier is an email
        const isEmail = identifier.includes('@');

        const user = await Users.findOne({
            where: isEmail
                ? { email: identifier }
                : { userName: identifier }
        });

        if (!user) {
            return res.status(400).json({
                errorUser: "User doesn't exist"
            });
        }

        bcrypt.compare(password, user.pwd).then((match) => {
            if (!match) {

                return res.status(400).json({
                    errorPassword: "wrong password"
                })

            } else {

                const accessToken = sign({
                    userId: user.id,
                    userName: user.userName,
                    userRole: user.role
                }, process.env.JWT_ACCESS_SECRET, {
                    expiresIn: '15m'
                });

                const refreshToken = sign({
                    userId: user.id,
                    userName: user.userName,
                    userRole: user.role
                }, process.env.JWT_REFRESH_SECRET, {
                    expiresIn: '14d'
                });

                res.cookie('accessToken', accessToken, { maxAge: 900000 });
                res.cookie('refreshToken', refreshToken, {
                    maxAge: 14 * 24 * 60 * 60 * 1000,
                    httpOnly: true,
                    secure: true,
                    sameSite: 'strict'
                });

                res.status(200).json({
                    userId: user.id,
                    userName: user.userName,
                    familyName: user.familyName,
                    givenName: user.givenName,
                    userImg: user.uerImg,
                    role: user.role
                })

            }
        })

    } catch (error) {

        res.status(500).json({
            error: "Internal server error while searching for the user"
        })

    }

})

router.get('/verify', async (req, res) => {

    const userId = req.headers['x-user-id'];
    const userName = req.headers['x-user-name'];

    try {
        const user = await Users.findByPk(userId, {
            attributes: ['familyName', 'givenName', 'uerImg', 'role']
        });

        if (!user) {
            return res.status(404).json({
                error: "User not found"
            });
        }

        res.status(200).json({
            userId: parseInt(userId),
            userName: userName,
            familyName: user.familyName,
            givenName: user.givenName,
            userImg: user.uerImg,
            role: user.role
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Internal server error while searching for the user"
        });
    }
});

router.post('/logout', (req, res) => {

    res.clearCookie('accessToken');

    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict'
    });

    res.sendStatus(204);//204: It means without content
});

router.put('/edit-profile', upload.single('userImg'), async (req, res) => {
    const userId = req.headers['x-user-id'];
    const userImg = req.file ? `profiles/${req.file.filename}` : null;
    const {
        userName,
        familyName,
        givenName,
        bio,
        gender,
        birthDate,
        phoneNumber,
        // Address fields
        addressLine1,
        addressLine2,
        city,
        state,
        postalCode,
        country
    } = req.body || {};

    try {

        const user = await Users.findByPk(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });


        if (userImg) user.uerImg = userImg;
        if (userName) user.userName = userName;
        if (familyName) user.familyName = familyName;
        if (givenName) user.givenName = givenName;
        if (bio) user.bio = bio;
        if (gender) user.gender = gender;
        if (birthDate) user.dateOfBirth = birthDate;
        if (phoneNumber) user.phoneNumber = phoneNumber;

        await user.save();

        if (user.role === "teacher") {
            const teacher = await Teachers.findOne({ where: { idTeacher: userId } });
            const { placeOfWork, grade } = req.body;

            if (teacher) {
                if (userName) teacher.userName = userName;
                if (familyName) teacher.familyName = familyName;
                if (givenName) teacher.givenName = givenName;
                if (placeOfWork) teacher.placeOfWork = placeOfWork;
                if (grade) teacher.grade = grade;
                await teacher.save();
            }
        } else if (user.role === "parent") {
            const parent = await Parents.findOne({ where: { idParent: userId } });
            if (parent) {
                if (userName) parent.userName = userName;
                if (familyName) parent.familyName = familyName;
                if (givenName) parent.givenName = givenName;
                await parent.save();
            }
        } else if (user.role === "student") {
            const student = await Students.findOne({ where: { idStudent: userId } });
            const { levelOfEducation, institution } = req.body;
            if (student) {
                if (userName) student.userName = userName;
                if (familyName) student.familyName = familyName;
                if (givenName) student.givenName = givenName;
                if (levelOfEducation) student.levelOfEducation = levelOfEducation;
                if (institution) student.institution = institution;
                await student.save();
            }
        } else if (user.role === "admin") {
            const admin = await Admins.findOne({ where: { idAdmin: userId } });
            if (admin) {
                if (familyName) admin.familyName = familyName;
                if (givenName) admin.givenName = givenName;
                await admin.save();
            }
        }
        //  Handle address
        let address = await Adresses.findOne({ where: { userId } });

        if (address) {
            // Update existing address
            if (addressLine1) address.addressLine1 = addressLine1;
            if (addressLine2) address.addressLine2 = addressLine2;
            if (city) address.city = city;
            if (state) address.state = state;
            if (postalCode) address.postalCode = postalCode;
            if (country) address.country = country;
            await address.save();
        } else if (addressLine1 || addressLine2 || city || state || postalCode || country) {
            await Adresses.create({
                userId,
                addressLine1,
                addressLine2,
                city,
                state,
                postalCode,
                country
            });
        }
        const updatedUser = await Users.findByPk(userId, {
            include: [{ model: Adresses }],
            attributes: { exclude: ['pwd'] }
        });

        res.status(200).json(updatedUser);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        const user = await Users.findOne({
            where: { email: email }
        });

        if (user) {
            const token = crypto.randomBytes(20).toString('hex');

            await ResetPassword.create({
                userId: user.id,
                token: token,
                expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
            });

            const transporter = nodemailer.createTransport({
                service: 'gmail',
                host: 'smtp.gmail.com',
                port: 465, // or 587 for TLS
                secure: true, // true for port 465, false for port 587
                auth: {
                    user: process.env.GMAIL_USER,
                    pass: process.env.GMAIL_PASS,
                },
            });

            const link = `http://localhost:3000/reset-password/${token}`;

            try {
                transporter.sendMail({
                    from: {
                        name: 'Edtech Team',
                        address: 'halimaderki399@gmail.com'
                    },
                    to: email,
                    subject: 'Reset Password',
                    html: generateResetPasswordEmail(user.userName, link)
                }, (error, info) => {
                    if (error) {
                        return res.status(500).json({ error: 'Failed to send email' });
                    } else {
                        return res.status(200).json({
                            message: 'Email has been sent successfully.',
                            info
                        });
                    }
                });
            } catch (error) {
                return res.status(500).json({ error: 'Failed to send email' });
            }
        } else {
            res.status(404).json({ userError: 'User not found' });
        }
    } catch (error) {
        console.error('FORGOT PASSWORD ERROR:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/reset-password/:token', async (req, res) => {
    const token = req.params.token;
    const { password } = req.body;

    try {
        const resetEntry = await ResetPassword.findOne({
            where: {
                token: token,
                expiresAt: { [Op.gt]: Date.now() }
            }
        });

        if (resetEntry) {
            const user = await Users.findByPk(resetEntry.userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            user.pwd = await bcrypt.hash(password, 10);
            await user.save();

            const accessToken = sign({
                userId: user.id,
                userName: user.userName
            }, process.env.ACCESS_KEY, {
                expiresIn: '15m'
            });

            const refreshToken = sign({
                userId: user.id,
                userName: user.userName
            }, process.env.REFRESH_KEY, {
                expiresIn: '7d'
            });

            res.cookie('accessToken', accessToken, { maxAge: 900000 });
            res.cookie('refreshToken', refreshToken, {
                maxAge: 14 * 24 * 60 * 60 * 1000,
                httpOnly: true,
                secure: true,
                sameSite: 'strict'
            });

            await resetEntry.destroy();
            res.status(201).json({
                message: 'Password changed successfully',
                userName: user.userName,
                familyName: user.familyName,
                givenName: user.givenName,
                userImg: user.uerImg,
                role: user.role
            });

        } else {
            res.status(400).json({
                tokenExpired: 'Invalid or expired token'
            });
        }

    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({
            serverError: 'Internal server error'
        });
    }
});

// GET USER BY USERNAME

router.get('/users/:userName', async (req, res) => {

    const userName = req.params.userName

    try {

        const user = await Users.findOne({ where: { userName: userName } })

        if (!user) {
            return res.status(400).json({ error: "user does not exist" })
        }

        res.status(200).json({ sucess: "user found", user })

    } catch (error) {

        console.error('Error resetting password:', error);
        res.status(500).json({
            serverError: 'Internal server error'
        });

    }

})

router.get('/get_user_byId/:userId', async (req, res) => {

    const userId = req.params.userId

    try {

        const user = await Users.findByPk(userId)

        if (!user) {
            return res.status(400).json({ error: "user does not exist" })
        }

        res.status(200).json({ sucess: "user found", user })

    } catch (error) {

        console.error('Error resetting password:', error);
        res.status(500).json({
            serverError: 'Internal server error'
        });

    }

})


module.exports = router;


