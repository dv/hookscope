describe 'persistence module', ->
  it 'should import', ->
    persistence = require '../persistence'

  describe '', ->
    before ->
      persistence = require '../persistence'
      
    it 'should create a client', ->
      client = 