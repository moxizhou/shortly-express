var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: true,

initialize: function() {
	this.on('creating', function(model, attrs){
		var salt = bcrypt.genSaltSync(10);
		var hash = bcrypt.hashSync(model.attributes.password, salt)
		model.get('password');
		model.attributes.password = hash;
		model.set('password', hash);
	})
	}

});

module.exports = User;