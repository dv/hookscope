describe 'config module', ->
  it 'should import', ->
    config = require '../config'

  it 'should have sensible defaults', ->
    config = (require '../config').config

    config.persist.should.be.false
    config.redisHost.should.eql("localhost")
    config.redisPort.should.eql("6379")

