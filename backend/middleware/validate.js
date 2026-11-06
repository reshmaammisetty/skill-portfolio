const { body, validationResult } = require('express-validator');

exports.validate = (req, res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) return res.status(400).json({ message: result.array()[0].msg });
  next();
};

exports.passwordRule = (field) =>
  body(field)
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .bail()
    .matches(/[A-Za-z]/)
    .withMessage('Password must include a letter')
    .bail()
    .matches(/\d/)
    .withMessage('Password must include a number');