require('dotenv').config();
const { verify, sign } = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
        return renewToken(req, res, next);
    } else {
        verify(accessToken, process.env.ACCESS_KEY, (err, decoded) => {
            if (err) {
                return renewToken(req, res, next);
            } else {
                req.user = decoded;
                next();
            }
        });
    }
};


const renewToken = (req, res, next) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(400).json({
            errorToken: "No refresh token"
        });
    } else {
        verify(refreshToken, process.env.REFRESH_KEY, (err, decoded) => {
            if (err) {
                return res.status(400).json({
                    errorToken: "Invalid refresh token"
                });
            } else {
                const accessToken = sign({
                    userId: decoded.userId,
                    userName: decoded.userName
                }, process.env.ACCESS_KEY, {
                    expiresIn: '15m'
                });

                res.cookie('accessToken', accessToken, { maxAge: 900000 });

                req.user = decoded;
                next();
            }
        });
    }
};


module.exports = { authMiddleware }