const { AppError } = require('../utils/apiResponse');


function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      }));
      throw new AppError('Validation failed', 422, details);
    }
    req.body = result.data;
    next();
  };
}

module.exports = validate;
