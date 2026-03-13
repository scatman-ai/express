'use strict';

const express = require('express');
const request = require('supertest');
const requestIdMiddleware = require('../lib/express-request-id');

const app = express();
app.use(requestIdMiddleware);
app.get('/', (req, res) => {
  res.send('Hello World');
});

describe('Request ID Middleware', function() {
  it('should attach a unique request ID to req and res headers', function(done) {
    request(app)
      .get('/')
      .expect('x-request-id', /[0-9a-fA-F-]{36}/)
      .expect(200, done);
  });
});
