'use strict'

var express = require('../')
var request = require('supertest')
var requestId = require('../lib/middleware/request-id')

describe('requestId middleware', function() {
  var app
  
  beforeEach(function() {
    app = express()
  })
  
  describe('default behavior', function() {
    it('should generate a UUID v4 request ID', function(done) {
      app.use(requestId())
      app.get('/', function(req, res) {
        res.json({ id: req.id })
      })
      
      request(app)
        .get('/')
        .expect(200)
        .expect(function(res) {
          var id = res.body.id
          var uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
          if (!uuidRegex.test(id)) {
            throw new Error('Generated ID is not a valid UUID v4: ' + id)
          }
        })
        .end(done)
    })
    
    it('should attach request ID to req.id', function(done) {
      app.use(requestId())
      app.get('/', function(req, res) {
        if (!req.id) {
          return res.status(500).send('req.id not set')
        }
        res.send('ok')
      })
      
      request(app)
        .get('/')
        .expect(200, 'ok', done)
    })
    
    it('should set X-Request-ID response header', function(done) {
      app.use(requestId())
      app.get('/', function(req, res) {
        res.send('ok')
      })
      
      request(app)
        .get('/')
        .expect('X-Request-ID', /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
        .expect(200, done)
    })
    
    it('should use existing request ID from header', function(done) {
      var existingId = 'existing-request-id'
      
      app.use(requestId())
      app.get('/', function(req, res) {
        res.json({ id: req.id })
      })
      
      request(app)
        .get('/')
        .set('X-Request-ID', existingId)
        .expect(200)
        .expect(function(res) {
          if (res.body.id !== existingId) {
            throw new Error('Expected existing ID, got: ' + res.body.id)
          }
        })
        .expect('X-Request-ID', existingId)
        .end(done)
    })
  })
  
  describe('options.header', function() {
    it('should use custom header name', function(done) {
      app.use(requestId({ header: 'X-Custom-ID' }))
      app.get('/', function(req, res) {
        res.send('ok')
      })
      
      request(app)
        .get('/')
        .expect('X-Custom-ID', /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
        .expect(200, done)
    })
    
    it('should read from custom header', function(done) {
      var existingId = 'custom-header-id'
      
      app.use(requestId({ header: 'X-Custom-ID' }))
      app.get('/', function(req, res) {
        res.json({ id: req.id })
      })
      
      request(app)
        .get('/')
        .set('X-Custom-ID', existingId)
        .expect(200)
        .expect(function(res) {
          if (res.body.id !== existingId) {
            throw new Error('Expected existing ID from custom header, got: ' + res.body.id)
          }
        })
        .end(done)
    })
  })
  
  describe('options.generator', function() {
    it('should use custom generator function', function(done) {
      var customId = 'custom-generated-id'
      var generator = function() { return customId }
      
      app.use(requestId({ generator: generator }))
      app.get('/', function(req, res) {
        res.json({ id: req.id })
      })
      
      request(app)
        .get('/')
        .expect(200)
        .expect(function(res) {
          if (res.body.id !== customId) {
            throw new Error('Expected custom generated ID, got: ' + res.body.id)
          }
        })
        .expect('X-Request-ID', customId)
        .end(done)
    })
    
    it('should call generator function for each request', function(done) {
      var callCount = 0
      var generator = function() { 
        callCount++
        return 'id-' + callCount
      }
      
      app.use(requestId({ generator: generator }))
      app.get('/', function(req, res) {
        res.json({ id: req.id })
      })
      
      request(app)
        .get('/')
        .expect(200)
        .expect(function(res) {
          if (res.body.id !== 'id-1') {
            throw new Error('Expected first generated ID, got: ' + res.body.id)
          }
        })
        .end(function(err) {
          if (err) return done(err)
          
          request(app)
            .get('/')
            .expect(200)
            .expect(function(res) {
              if (res.body.id !== 'id-2') {
                throw new Error('Expected second generated ID, got: ' + res.body.id)
              }
            })
            .end(done)
        })
    })
  })
  
  describe('options.setHeader', function() {
    it('should not set response header when setHeader is false', function(done) {
      app.use(requestId({ setHeader: false }))
      app.get('/', function(req, res) {
        res.json({ id: req.id })
      })
      
      request(app)
        .get('/')
        .expect(200)
        .expect(function(res) {
          if (res.headers['x-request-id']) {
            throw new Error('Response header should not be set')
          }
        })
        .end(done)
    })
    
    it('should still attach ID to req.id when setHeader is false', function(done) {
      app.use(requestId({ setHeader: false }))
      app.get('/', function(req, res) {
        if (!req.id) {
          return res.status(500).send('req.id not set')
        }
        res.send('ok')
      })
      
      request(app)
        .get('/')
        .expect(200, 'ok', done)
    })
  })
  
  describe('generateUUID function', function() {
    it('should generate valid UUID v4', function() {
      var id = requestId.generateUUID()
      var uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      
      if (!uuidRegex.test(id)) {
        throw new Error('Generated UUID is not valid v4: ' + id)
      }
    })
    
    it('should generate unique UUIDs', function() {
      var ids = new Set()
      
      for (var i = 0; i < 1000; i++) {
        var id = requestId.generateUUID()
        if (ids.has(id)) {
          throw new Error('Duplicate UUID generated: ' + id)
        }
        ids.add(id)
      }
    })
  })
  
  describe('middleware integration', function() {
    it('should work with multiple middleware', function(done) {
      var loggedId = null
      
      app.use(requestId())
      app.use(function(req, res, next) {
        loggedId = req.id
        next()
      })
      app.get('/', function(req, res) {
        res.json({ 
          requestId: req.id,
          loggedId: loggedId 
        })
      })
      
      request(app)
        .get('/')
        .expect(200)
        .expect(function(res) {
          if (res.body.requestId !== res.body.loggedId) {
            throw new Error('Request ID not consistent across middleware')
          }
        })
        .end(done)
    })
    
    it('should preserve ID across async operations', function(done) {
      app.use(requestId())
      app.get('/', function(req, res) {
        var initialId = req.id
        
        setTimeout(function() {
          res.json({ 
            initialId: initialId,
            currentId: req.id 
          })
        }, 10)
      })
      
      request(app)
        .get('/')
        .expect(200)
        .expect(function(res) {
          if (res.body.initialId !== res.body.currentId) {
            throw new Error('Request ID changed during async operation')
          }
        })
        .end(done)
    })
  })
})
