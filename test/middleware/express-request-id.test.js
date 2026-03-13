const request = require('supertest');
const express = require('express');
const requestIdMiddleware = require('../../lib/middleware/express-request-id');

const app = express();
app.use(requestIdMiddleware);
app.get('/', (req, res) => {
  res.send('Hello World');
});

describe('Request ID Middleware', function() {
  it('should attach a unique request ID to the request and response headers', function(done) {
    request(app)
      .get('/')
      .expect('x-request-id', /.+/, done);
  });
});
