const { validationResult } = require('express-validator');
const { CustomError } = require('../middlewares/error');
function assertValid(req) {
  const result = validationResult(req);
  if (!result.isEmpty()) throw new CustomError(result.array()[0].msg, 400, 'VALIDATION_ERROR');
}
module.exports = { assertValid };
