var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: true,

initialize: function() {
	this.on('creating', function(model, attrs, done){
		bcrypt.genSalt(5, function(err, salt) {
			bcrypt.hash(model.attributes.password, salt, null, function(err, hash) {
				model.attributes.password = hash;
			})
		})
	});
	}

});

module.exports = User;