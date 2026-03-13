'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = function requestIdMiddleware(req, res, next) {
  const requestId = uuidv4();
  req.headers['x-request-id'] = requestId;
  res.setHeader('x-request-id', requestId);
  next();
};
