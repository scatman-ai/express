'use strict'

var crypto = require('crypto')

/**
 * Generate a UUID v4
 * @returns {string} UUID v4 string
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0
    var v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * Express middleware to generate and attach unique request IDs
 * @param {Object} options - Configuration options
 * @param {string} options.header - Header name for request ID (default: 'X-Request-ID')
 * @param {Function} options.generator - Custom ID generator function
 * @param {boolean} options.setHeader - Whether to set response header (default: true)
 * @returns {Function} Express middleware function
 */
function requestId(options) {
  options = options || {}
  
  var headerName = options.header || 'X-Request-ID'
  var generator = options.generator || generateUUID
  var setHeader = options.setHeader !== false
  
  return function requestIdMiddleware(req, res, next) {
    // Check if request already has an ID in headers
    var existingId = req.get(headerName)
    var id = existingId || generator()
    
    // Attach ID to request object
    req.id = id
    
    // Set response header if enabled
    if (setHeader) {
      res.set(headerName, id)
    }
    
    next()
  }
}

module.exports = requestId
module.exports.generateUUID = generateUUID
