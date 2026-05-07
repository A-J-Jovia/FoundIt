const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { db } = require('../db');
const User = require('../models/User');
const { eq } = require('drizzle-orm');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register new user
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Check for required fields
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please add all required fields' });
        }

        // Check if user exists (validate email uniqueness)
        const userExists = await db.select().from(User).where(eq(User.email, email));

        if (userExists.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Role-based assignment (default to user if none provided)
        const userRole = role === 'admin' ? 'admin' : 'user';

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const [user] = await db.insert(User).values({
            name,
            email,
            password: hashedPassword,
            role: userRole,
        }).returning();

        if (user) {
            res.status(201).json({
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user.id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
};

// @desc    Authenticate a user
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check for user email
        const [user] = await db.select().from(User).where(eq(User.email, email));

        // Match password
        if (user && (await bcrypt.compare(password, user.password))) {
            res.json({
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user.id),
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
};

// @desc    Update logged-in user's profile (name / email)
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    try {
        const [user] = await db.select().from(User).where(eq(User.id, req.user._id));
        if (!user) return res.status(404).json({ message: 'User not found' });

        const { name, email } = req.body;

        if (email && email !== user.email) {
            const [taken] = await db.select().from(User).where(eq(User.email, email));
            if (taken) return res.status(400).json({ message: 'Email already in use' });
            user.email = email;
        }
        if (name) user.name = name;

        const [updated] = await db.update(User)
          .set({ name: user.name, email: user.email, updatedAt: new Date() })
          .where(eq(User.id, user.id))
          .returning();

        res.json({
            _id:   updated.id,
            name:  updated.name,
            email: updated.email,
            role:  updated.role,
            token: generateToken(updated.id),
        });
    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
};

module.exports = {
    registerUser,
    loginUser,
    updateUserProfile,
};
