const express = require('express');
const router = express.Router();
const { registerUser, loginUser, updateUserProfile } = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../utils/authValidators');
const { validateRequest } = require('../middleware/validationMiddleware');
const { protect } = require('../middleware/authMiddleware');

// Define authentication routes
router.post('/register', validateRegister, validateRequest, registerUser);
router.post('/login', validateLogin, validateRequest, loginUser);
router.put('/profile', protect, updateUserProfile);

module.exports = router;
