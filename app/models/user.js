var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: true,

initialize: function() {
	var create = Promise.promisify(bcrypt.hash);

	this.on('creating', function(model){
		return create(this.get('password'), null, null)
			.bind(this).then(function(hash) {
				this.set('password', hash);
			});
	});
},

comparePassword: function(attemptedPassword, callback) {
	bcrypt.compare(attemptedPassword, this.get('password'), function(err, isMatch) {
		callback(isMatch);
	});
}

});


module.exports = User;