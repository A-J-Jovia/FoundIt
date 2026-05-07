const { check } = require('express-validator');

// Validation rules for user registration
const validateRegister = [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    // Role is optional, but if provided, it must be either 'user' or 'admin'
    check('role', 'Role must be either user or admin').optional().isIn(['user', 'admin']),
];

// Validation rules for user login
const validateLogin = [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
];

module.exports = {
    validateRegister,
    validateLogin,
};
