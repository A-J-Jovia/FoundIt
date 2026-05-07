const express = require('express');
const router = express.Router();
const {
    createItem,
    getAllItems,
    getItemById,
    submitClaim,
    startVerification,
    decideClaim,
    deleteItem,
    getReturnToken,
    scanReturnItem,
} = require('../controllers/itemController');
const { protect, admin } = require('../middleware/authMiddleware');
const { validateItemCreation, validateClaimSubmission } = require('../utils/itemValidators');
const { validateRequest } = require('../middleware/validationMiddleware');

// Public routes
router.get('/', getAllItems);
router.get('/:id', getItemById);

// Protected routes (Require login)
router.post('/', protect, validateItemCreation, validateRequest, createItem);
router.post('/:id/claim', protect, validateClaimSubmission, validateRequest, submitClaim);
router.get('/:id/return-token', protect, getReturnToken);
router.put('/:id/scan-return', protect, scanReturnItem);

// Admin-only routes (Require login + Admin role)
router.put('/:id/verify', protect, admin, startVerification);
router.put('/:id/decide', protect, admin, decideClaim);
router.delete('/:id', protect, admin, deleteItem);

module.exports = router;
