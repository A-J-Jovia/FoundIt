const { check } = require('express-validator');

// Validation rules for item creation
const validateItemCreation = [
    check('title', 'Title is required').not().isEmpty(),
    check('type', 'Type must be either lost or found').isIn(['lost', 'found']),
    check('category', 'Category is required').not().isEmpty(),
    check('location', 'Location is required').not().isEmpty(),
    check('date', 'Please provide a valid date').isISO8601(),
];

// Validation rules for submitting a claim
const validateClaimSubmission = [
    check('reason', 'Reason for claim is optional').optional().not().isEmpty(),
];

module.exports = {
    validateItemCreation,
    validateClaimSubmission,
};
