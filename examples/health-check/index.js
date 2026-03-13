'use strict';

const express = require('../../');
const healthCheck = require('../../lib/healthCheck');

const app = express();

app.use('/health', healthCheck({
  memoryThreshold: 150,
  customCheck: () => true
}));

app.listen(3000, () => {
  console.log('Health check example running on http://localhost:3000');
});