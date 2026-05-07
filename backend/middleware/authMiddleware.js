const jwt = require('jsonwebtoken');
const { db } = require('../db');
const User = require('../models/User');
const { eq } = require('drizzle-orm');

// Middleware to protect routes (Require User)
const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Get token from header (Bearer <token>)
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token payload and exclude the password
            const [user] = await db.select({
                id: User.id,
                name: User.name,
                email: User.email,
                role: User.role,
                createdAt: User.createdAt,
                updatedAt: User.updatedAt
            }).from(User).where(eq(User.id, decoded.id));

            if (user) {
                user._id = user.id; // map id to _id for controllers
                req.user = user;
                next();
            } else {
                res.status(401).json({ message: 'Not authorized, user not found. Please log in again.' });
            }
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// Middleware to protect routes (Require Admin)
const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized as an admin' });
    }
};

module.exports = { protect, admin };
