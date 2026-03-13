'use strict';

const request = require('supertest');
const express = require('express');
const healthCheck = require('../lib/healthCheck');

const app = express();
app.use('/health', healthCheck({ memoryThreshold: 200, customCheck: () => true }));

describe('Health Check Middleware', function() {
  it('should return status ok when checks pass', function(done) {
    request(app)
      .get('/health')
      .expect(200)
      .expect(res => {
        if (res.body.status !== 'ok') throw new Error('Expected status ok');
      })
      .end(done);
  });

  it('should return status fail when memory threshold is exceeded', function(done) {
    const app = express();
    app.use('/health', healthCheck({ memoryThreshold: 0 }));
    request(app)
      .get('/health')
      .expect(503)
      .expect(res => {
        if (res.body.status !== 'fail') throw new Error('Expected status fail');
      })
      .end(done);
  });

  it('should return status fail when custom check fails', function(done) {
    const app = express();
    app.use('/health', healthCheck({ customCheck: () => false }));
    request(app)
      .get('/health')
      .expect(503)
      .expect(res => {
        if (res.body.status !== 'fail') throw new Error('Expected status fail');
      })
      .end(done);
  });
});