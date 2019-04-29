var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var SALT_WORK_FACTOR = 10;

var userSchema = new mongoose.Schema({  
	firstName: String,
	lastName: String,
	address: String,
	postalCode: String,
	city: String,
	country: String,
	email: String,
	phone: String,
	mobile: String,
	password: String,
	userStatus: String,
	admin: String,
	verify: Boolean,
	createdAt: {type: Date, default: Date.now},
	updatedAt: {type: Date, default: Date.now},
	randomCode: String
});

userSchema.pre('save', function(next) {
	var user = this;
	console.log("IN PRE SAVE SECTION")
	
	console.log("IS MODIFIED");
	bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
		if (err) return next(err);
		
		bcrypt.hash(user.password, salt, function(err, hash) {
			if (err){ 
				console.error("ERROR ",err);
				return next(err);
			}
			user.password = hash;
			user.salt = salt;
			next();
		});
	});
});

userSchema.methods.comparePassword = function(candidatePassword, cb) {
	
	bcrypt.compare( candidatePassword,this.password,function(err, isMatch) {
		console.log("candidatePassword",candidatePassword);
		console.log(this.password);
		if (err) return cb(err);
		cb(null, isMatch);
	});
};

module.exports = mongoose.model('User', userSchema);  