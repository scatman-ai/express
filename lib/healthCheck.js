'use strict';

module.exports = function healthCheck(options = {}) {
  const { memoryThreshold = 100, customCheck = () => true } = options;

  return function (req, res, next) {
    const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
    const uptime = process.uptime();
    const customCheckResult = customCheck();

    const status = {
      memoryUsage: `${memoryUsage.toFixed(2)} MB`,
      uptime: `${uptime.toFixed(2)} seconds`,
      customCheck: customCheckResult
    };

    if (memoryUsage > memoryThreshold || !customCheckResult) {
      res.status(503).json({ status: 'fail', details: status });
    } else {
      res.status(200).json({ status: 'ok', details: status });
    }
  };
};