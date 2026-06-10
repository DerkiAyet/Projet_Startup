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
const { publishUsers, startGame } = require('../config_service/kafka/producer');

const { Users, Parents, Students, Teachers, Admins, ResetPassword, Adresses } = require('../models');
const { Model, where } = require('sequelize');
const redis = require('../config_service/redis.config')

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

    const { role, familyName, givenName, dateOfBirth, userName, email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        if (role === "admin") return res.status(403).json({ error: "Forbidden" })

        const existingUser = await Users.findOne({
            where: {
                [Op.or]: [
                    { email: email },
                    { userName: userName }
                ]
            }
        });

        if (existingUser) {
            if (existingUser.email === email) {
                return res.status(400).json({ errorEmail: 'Email already in use' });
            }
            if (existingUser.userName === userName) {
                return res.status(400).json({ errorUsername: 'Username already in use' });
            }
        }

        const newUser = await Users.create({
            userName,
            familyName,
            givenName,
            email,
            pwd: hashedPassword,
            dateOfBirth,
            role
        });

        await publishUsers({
            id: newUser.id,
            userName: newUser.userName,
            familyName: newUser.familyName,
            givenName: newUser.givenName,
            userImg: newUser.uerImg,  // normalize here
            role: newUser.role
        })

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
            expiresIn: '14d'
        });

        res.cookie('accessToken', accessToken, {
            maxAge: 900000,
            httpOnly: true,
            sameSite: 'lax',   // lax instead of strict
            secure: false       // false because HTTP not HTTPS
        });
        res.cookie('refreshToken', refreshToken, {
            maxAge: 14 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            sameSite: 'lax',   // lax instead of strict
            secure: false
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
            await startGame(newUser.id)
        } else {
            await Teachers.create({
                idTeacher: newUser.id,
                userName: newUser.userName,
                familyName: newUser.familyName,
                givenName: newUser.givenName,
            })
        }

        await redis.setex(`user:${newUser.id}`, 300, JSON.stringify({
            id: newUser.id,
            userName: newUser.userName,
            familyName: newUser.familyName,
            givenName: newUser.givenName,
            userImg: newUser.uerImg || null,
            role: newUser.role
        }));

        return res.status(201).json({
            message: 'User registered successfully',
            userId: newUser.id
        });

    } catch (error) {
        console.error('Error during registration:', error);
        return res.status(500).json({ error: 'An error occurred during registration' });
    }
})

router.post('/mobile/register', async (req, res) => {

    const { role, familyName, givenName, dateOfBirth, userName, email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        if (role === "admin") return res.status(403).json({ error: "Forbidden" })

        const existingUser = await Users.findOne({
            where: {
                [Op.or]: [
                    { email: email },
                    { userName: userName }
                ]
            }
        });

        if (existingUser) {
            if (existingUser.email === email) {
                return res.status(400).json({ errorEmail: 'Email already in use' });
            }
            if (existingUser.userName === userName) {
                return res.status(400).json({ errorUsername: 'Username already in use' });
            }
        }

        const newUser = await Users.create({
            userName,
            familyName,
            givenName,
            email,
            pwd: hashedPassword,
            dateOfBirth,
            role
        });

        await publishUsers({
            id: newUser.id,
            userName: newUser.userName,
            familyName: newUser.familyName,
            givenName: newUser.givenName,
            userImg: newUser.uerImg,  // normalize here
            role: newUser.role
        })

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
            expiresIn: '90d'   //longer for mobile
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
        } else {
            await Teachers.create({
                idTeacher: newUser.id,
                userName: newUser.userName,
                familyName: newUser.familyName,
                givenName: newUser.givenName,
            })
        }

        await redis.setex(`user:${newUser.id}`, 300, JSON.stringify({
            id: newUser.id,
            userName: newUser.userName,
            familyName: newUser.familyName,
            givenName: newUser.givenName,
            userImg: newUser.uerImg || null,
            role: newUser.role
        }));

        return res.status(201).json({
            message: 'User registered successfully',
            userId: newUser.id,
            accessToken,
            refreshToken  // mobile stores this in SecureStore
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

        const attemptKey = `login_attempts:${identifier}`;
        const attempts = await redis.get(attemptKey);
        if (attempts && parseInt(attempts) >= 5) {
            return res.status(429).json({ error: "Too many failed login attempts. Try again in 15 minutes." });
        }


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

        if (user.role === "admin") return res.status(403).json({ error: "Forbidden, this is an admin's credentials" })

        const match = await bcrypt.compare(password, user.pwd);
        if (!match) {
            //Increment failed attempts
            await redis.incr(attemptKey);
            await redis.expire(attemptKey, 900); // 15 min window
            return res.status(400).json({ errorPassword: "Wrong password" });
        }
        // Login success — clear failed attempts
        await redis.del(attemptKey);

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

        res.cookie('accessToken', accessToken, {
            maxAge: 900000,
            httpOnly: true,
            sameSite: 'lax',   // lax instead of strict
            secure: false       // false because HTTP not HTTPS
        });
        res.cookie('refreshToken', refreshToken, {
            maxAge: 14 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            sameSite: 'lax',   // lax instead of strict
            secure: false       // false because HTTP not HTTPS
        });

        await redis.setex(`user:${user.id}`, 300, JSON.stringify({
            id: user.id,
            userName: user.userName,
            familyName: user.familyName,
            givenName: user.givenName,
            userImg: user.uerImg,
            role: user.role
        }));

        res.status(200).json({
            userId: user.id,
            userName: user.userName,
            familyName: user.familyName,
            givenName: user.givenName,
            userImg: user.uerImg,
            role: user.role
        })

    } catch (error) {

        res.status(500).json({
            msg: "Internal server error while searching for the user",
            error: error.message
        })

    }

})

router.post('/mobile/login', async (req, res) => {
    const { identifier, password } = req.body;

    try {

        if (!identifier) {
            return res.status(400).json({ error: "Please enter your email or username" });
        }

        //Rate Limiting
        const attemptKey = `login_attempts:${identifier}`;
        const attempts = await redis.get(attemptKey);
        if (attempts && parseInt(attempts) >= 5) {
            return res.status(429).json({ error: "Too many failed login attempts. Try again in 15 minutes." });
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

        if (user.role === "admin") return res.status(403).json({ error: "Forbidden, this is an admin's credentials" })

        const match = await bcrypt.compare(password, user.pwd);
        if (!match) {
            // Increment failed attempts
            await redis.incr(attemptKey);
            await redis.expire(attemptKey, 900); // 15 min window
            return res.status(400).json({ errorPassword: "Wrong password" });
        }

        //Login success — clear failed attempts
        await redis.del(attemptKey);

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
            expiresIn: '90d'
        });

        //cache user data in redis
        await redis.setex(`user:${user.id}`, 300, JSON.stringify({
            id: user.id,
            userName: user.userName,
            familyName: user.familyName,
            givenName: user.givenName,
            userImg: user.uerImg,
            role: user.role
        }));

        res.status(200).json({
            userId: user.id,
            userName: user.userName,
            familyName: user.familyName,
            givenName: user.givenName,
            userImg: user.uerImg,
            role: user.role,
            accessToken,
            refreshToken  // mobile stores this in SecureStore
        })

    } catch (error) {

        res.status(500).json({
            error: "Internal server error while searching for the user"
        })

    }

})

router.post('/create/admin', async (req, res) => {
    const { familyName, givenName, email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const existingAdmin = await Admins.findOne({ where: { email: email } });
        if (existingAdmin) return res.status(400).json({ errorEmail: 'Email already in use' });

        const newAdmin = await Users.create({
            userName: `admin_${Date.now()}`,
            familyName,
            givenName,
            email,
            pwd: hashedPassword,
            role: 'admin'
        });
        await publishUsers({
            id: newAdmin.id,
            userName: newAdmin.userName,
            familyName: newAdmin.familyName,
            givenName: newAdmin.givenName,
            userImg: newAdmin.uerImg,
            role: newAdmin.role
        })

        await Admins.create({
            familyName: newAdmin.familyName,
            givenName: newAdmin.givenName,
            email: newAdmin.email,
            pwd: hashedPassword,
        });

        return res.status(201).json({
            message: 'User registered successfully',
            userId: newAdmin.id
        });

    } catch (error) {
        console.error('Error during registration:', error);
        return res.status(500).json({ error: 'An error occurred during registration' });
    }
})

router.post('/login/admin', async (req, res) => { // a protected route with /users in gateway
    const { identifier, password } = req.body;
    try {
        if (!identifier) {
            return res.status(400).json({ error: "Please enter your email or username" });
        }

        const attemptKey = `login_attempts:${identifier}`;
        const attempts = await redis.get(attemptKey);
        if (attempts && parseInt(attempts) >= 5) {
            return res.status(429).json({ error: "Too many failed login attempts. Try again in 15 minutes." });
        }

        const isEmail = identifier.includes('@');

        const admin = await Users.findOne({ where: { email: identifier, role: 'admin' } });

        if (!admin) {
            return res.status(400).json({
                errorAdmin: "Admin doesn't exist"
            });
        }

        // replace in all routes
        const match = await bcrypt.compare(password, admin.pwd);
        if (!match) {
            //Increment failed attempts
            await redis.incr(attemptKey);
            await redis.expire(attemptKey, 900); // 15 min window
            return res.status(400).json({ errorPassword: "Wrong password" });
        }

        //Login success — clear failed attempts
        await redis.del(attemptKey);

        const accessToken = sign({
            userId: admin.id,
            userName: admin.userName,
            userRole: admin.role
        }, process.env.JWT_ACCESS_SECRET, {
            expiresIn: '15m'
        });

        const refreshToken = sign({
            userId: admin.id,
            userName: admin.userName,
            userRole: admin.role
        }, process.env.JWT_REFRESH_SECRET, {
            expiresIn: '14d'
        });

        res.cookie('accessToken', accessToken, {
            maxAge: 900000,
            httpOnly: true,
            sameSite: 'lax',
            secure: false
        });
        res.cookie('refreshToken', refreshToken, {
            maxAge: 14 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            sameSite: 'lax',
            secure: false
        });

        //cache user data in redis
        await redis.setex(`user:${admin.id}`, 300, JSON.stringify({
            id: admin.id,
            userName: admin.userName,
            familyName: admin.familyName,
            givenName: admin.givenName,
            userImg: admin.uerImg,
            role: admin.role
        }));

        res.status(200).json({
            userId: admin.id,
            userName: admin.userName,
            familyName: admin.familyName,
            givenName: admin.givenName,
            userImg: admin.uerImg,
            role: admin.role
        })

    } catch (error) {
        res.status(500).json({
            error: "Internal server error while searching for the admin",
            message: error.message
        })

    }
})

router.get('/verify', async (req, res) => {

    const userId = req.headers['x-user-id'];
    const userName = req.headers['x-user-name'];

    try {
        const cached = await redis.get(`user:${userId}`) //verify in redis and send the chached data, else fetch from db
        if (cached) {
            return res.status(200).json(JSON.parse(cached));
        }

        const user = await Users.findByPk(userId, {
            attributes: ['familyName', 'givenName', 'uerImg', 'role']
        });

        if (!user) {
            return res.status(404).json({
                error: "User not found"
            });
        }

        const userData = {
            id: parseInt(userId),
            userName,
            familyName: user.familyName,
            givenName: user.givenName,
            userImg: user.uerImg,
            role: user.role
        };
        // Save to cache for next time (5 min)
        await redis.setex(`user:${userId}`, 300, JSON.stringify(userData));

        res.status(200).json({
            id: parseInt(userId),
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

router.post('/logout', async (req, res) => {
    const token = req.cookies?.accessToken;

    try {
        if (token) {
            //Blacklist token until it naturally expires (15 min) --- an additional security layer
            //by caching the token after the user logout it's going to be marked as crucial error (means someone who uses this token after being cached here is identified as HACKER!!)
            //Hacker sends request with old token
            // → Middleware checks Redis blacklist
            // → Finds it → Rejects immediately 
            await redis.setex(`blacklist:${token}`, 900, 'true');
        }

        // Clear user cache
        const userId = req.headers['x-user-id'];
        if (userId) await redis.del(`user:${userId}`);

        res.clearCookie('accessToken');
        res.clearCookie('refreshToken', { httpOnly: true, secure: false, sameSite: 'lax' });
        res.sendStatus(204);

    } catch (error) {
        console.error('Logout error:', error);
        res.sendStatus(204); // still logout even if Redis fails
    }
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
            // rate limit for 3 attempts
            const limitKey = `reset_limit:${email}`;
            const resetCount = await redis.get(limitKey);
            if (resetCount && parseInt(resetCount) >= 3) {
                return res.status(429).json({ error: "Too many reset requests. Try again in an hour." });
            }

            const token = crypto.randomBytes(20).toString('hex');

            await redis.setex(`reset_token:${token}`, 3600, String(user.id));// using redis is more optimal compared to the ResetPassword table, so this table will be deleted

            // Increment reset request count
            await redis.incr(limitKey);
            await redis.expire(limitKey, 3600);

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
        const userId = await redis.get(`reset_token:${token}`)

        if (!userId) return res.status(400).json({ tokenExpired: 'Invalid or expired token' });

        const user = await Users.findByPk(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.pwd = await bcrypt.hash(password, 10);
        await user.save();

        //Delete token from Redis after use
        await redis.del(`reset_token:${token}`);

        // Clear any cached user data so fresh data loads
        await redis.del(`user:${userId}`);

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
            expiresIn: '14d'
        });

        res.cookie('accessToken', accessToken, { maxAge: 900000 });
        res.cookie('refreshToken', refreshToken, {
            maxAge: 14 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            secure: true,
            sameSite: 'strict'
        });

        res.status(201).json({
            message: 'Password changed successfully',
            userName: user.userName,
            familyName: user.familyName,
            givenName: user.givenName,
            userImg: user.uerImg,
            role: user.role
        });
    } catch (error) {
        console.error('Error resetting password:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET USER BY USERNAME

router.get('/users/:userName', async (req, res) => {
    const userName = req.params.userName
    try {
        const user = await Users.findOne({ where: { userName: userName } })
        if (!user) return res.status(400).json({ error: "user does not exist" })

        res.status(200).json({ sucess: "user found", user })
    } catch (error) {
        console.error('Error resetting password:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
})

router.get('/get_user_byId/:userId', async (req, res) => {
    const userId = req.params.userId
    try {
        const cached = await redis.get(`user:${userId}`)
        if (cached) {
            return res.status(200).json({ success: "user found", user: JSON.parse(cached) });
        }

        const user = await Users.findByPk(userId)
        if (!user) return res.status(400).json({ error: "user does not exist" }) // ← check before accessing

        const normalized = {
            id: user.id,
            userName: user.userName,
            familyName: user.familyName,
            givenName: user.givenName,
            userImg: user.uerImg,
            role: user.role
        }

        await redis.setex(`user:${userId}`, 300, JSON.stringify(normalized));
        return res.status(200).json({ success: "user found", user: normalized }) // ← return normalized
    } catch (error) {
        console.error('Error fetching user:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
})


module.exports = router;


