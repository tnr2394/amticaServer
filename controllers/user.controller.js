const mongoose = require('mongoose');
var async = require('async');
var user = require('../models/user.schema');
var jwt = require('jsonwebtoken');
var randomstring = require("randomstring");
var datetime = require('node-datetime');
var bcrypt = require('bcrypt');
var SALT_WORK_FACTOR = 10;
var mailer = require('nodemailer');
var ses = require('nodemailer-ses-transport');

let userController = {

	// User And Admin Login

	login: function(req,res){
		console.log("LOGIN REQ",req.body);
		let email = req.body.email;
		let password = req.body.password;

		user.find({
			'email': email
		}).exec(function(err,result){
			if (err) {
				return res.status(500).send({err});
			}
			else{
				result[0].comparePassword(password,(err, isMatch)=>{
					if(err || isMatch == false || result[0].verify == false){
						return res.status(404).send('No User Found');
					}
					else{
						console.log("1 user found")
						req.session.user = result;
						req.session.authenticated = true;
						console.log(req.session.user);

						const payload = {
							'user': result[0]
						};

						console.log("PAYLOAD : ",payload);
						var token = jwt.sign(payload,'samsarcom');
						console.log("Token = ",token);
						res.send({
							success: true,
							message: 'Enjoy your token!',
							token: token,
							user: result[0]
						});
					}
				});
			}
		});
	},

	// Get Users Information

	passwordChange: function(req,res){
		let email = req.body.email;
		let password = req.body.password;
		var newPassword = req.body.newPassword;
		user.find({
			'email': email
		}).exec(function(err,result){
			if (err) {
				return res.status(500).send({err});
			}
			else{
				if (result.length < 1){
					return res.status(400).send('No User Found');
				}
				else{
					result[0].comparePassword(password,(err, isMatch)=>{
						if(err || isMatch == false || result[0].verify == false){
							return res.status(404).send('Password is incorrect');
						}
						else{
							let newStorePassword = bcrypt.hashSync(newPassword, 10);

							user.update({'_id': result[0].id},{
								password: newStorePassword
							},function(err,result){
								if (result.nModified == 1) {
									res.status(200).send({res:"Success",
										msg: "Password Update"});
								}else{
									res.status(400).send({ err :"Bad Request",
										msg: "Can't Updated" });
								}
							});
						}
					});
				}
			}
		});
	},

	ckeckAvailibity: function(req, res, next){
		const id = req.params.id;
		user
		.find({'facebookId': id})
		.select()
		.exec((err, user) =>{
			if (err) {
				return err;
			}else if(user.length>0){
				res.status(200).json({user:user, avilable:true});
			}else{
				res.status(200).json({
					facebookId: id,
					avilable: false 
				});
			}
		})
	},

	fbLogin: function(req, res, next){
		let email = req.body.email;
		let facebookId = req.body.facebookId;
		user
		.find({'facebookId':facebookId, 'email': email})
		.exec((err, user)=>{
			if (err) {
				return err;
			}else{
				req.session.user = user;
				req.session.authenticated = true;
				console.log(req.session.user);

				const payload = {
					'user': user
				};

				var token = jwt.sign(payload,'samsarcom');
				console.log("Token = ",token);
				res.send({
					success: true,
					message: 'Enjoy your token!',
					token: token,
					user: user
				});
			}
		})
	},

	// Agent Signup

	signup: function(req,res,next){
		var randomCode = randomstring.generate({
			length: 8,
			charset: 'alphabetic'
		});
		user.create({
			_id: mongoose.Types.ObjectId(),
			firstName: req.body.firstName,
			lastName: req.body.lastName,
			address: req.body.address,
			postalCode: req.body.postalCode,
			city: req.body.city,
			state: req.body.state,
			country: req.body.country,
			email: req.body.email,
			phone: req.body.phone,
			mobile: req.body.mobile,
			company: req.body.company,
			password: req.body.password,
			userStatus: req.body.userStatus,
			verify: false,
			salt: '',
			randomCode: randomCode
		},(err,result) => {
			if(err){
				res.status(500).send(err);
			}
			else{

				var output = '<!DOCTYPE html><html><head><style>table {border-collapse: collapse;width: 100%;}th, td {text-align: left;padding: 8px;}tr:nth-child(even){background-color: #f2f2f2}th {background-color: #4CAF50;color: white;}</style></head><body><h2>Your Samsarcom Verification Code</h2><p>You are just a step away from accessing your Samsarcom account</p><p>We are sharing a verification code to access your account. The code is valid for 5 minutes and usable only once.</p><p>Once you have verified the code, you all be prompted login page immediately. This is to ensure that only you have access to your account.</p><table><tr><th>Verification Code</th><th>Expires In</th></tr><tr><td>';
				output = output + result.randomCode + '</td><td>5 Minutes</td></tr></table></body></html>';

				var aws = { key: 'AKIAIH7WL3IYEOGOCR3Q', secret: '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', amazon: 'eu-west-1' };

				var transporter = mailer.createTransport(ses({
					accessKeyId: aws.key,
					secretAccessKey: aws.secret,
					region: aws.amazon
				}));

				transporter.sendMail({
					from: 'info@samsarcom.be',
					to: result.email,
					bcc: 'yashs018@gmail.com',
					subject: 'Verification Code for New User',
					html: output
			// attachments: attachments ? attachments : null
		}, function (err, emailResult) {
			if (!err) {
				return res.status(200).send(result);
			}
			else{
				return res.status(500).send(err);
			}
		})

			}
		})

	},





	// User Verfication

	userVerfication:(req,res)=>{
		var userId = req.body._id;
		user.findById(userId).select('createdAt randomCode').exec((err,result)=>{
			if(err){return res.status(500).send({msg: "Internal Server Error."});}
			else if(result != undefined){

				var createdAt = result.createdAt;
				var randomCode = result.randomCode;			
				if (randomCode  !== req.body.randomCode) {
					return res.status(400).send({
						err: "Bad Request",
						msg: "Your Key has been Wrong .!"
					});
				}
				var dt = new Date();
				var create = new Date(createdAt);
				var diff = Math.abs(new Date(dt) - new Date(create));
				var minutes = Math.floor((diff/1000)/60);
				if (minutes <= 5) {
					user.update({'_id': userId},{
						verify: true
					},function(err,result){
						if (result.nModified == 1) {return res.status(200).send({res:"Success",msg: "User Verified !"});}
						else{return res.status(400).send({ err :"Bad Request",msg: "User Can't Verify" });}
					})				
				}else{
					return res.status(401).send({
						err: "Bad Request",
						msg: "Your Key has been expire .!"
					});
				}
			}
			else{
				return res.status(404).send({
					err: "User Not Found",
					msg: "User has been Deleted .!"
				});
			}
		});

	},

	generateNewVerificationCode:(req,res)=>{
		var randomCode = randomstring.generate({
			length: 8,
			charset: 'alphabetic'
		});
		user.update({'_id': req.body},{
			randomCode: randomCode,
			verify: false,
			createdAt: new Date()
		},function(err,result){
			if (result.nModified == 1) {return res.status(200).send({res:"Success",msg: "Code Generated!",'randomCode': randomCode
		});}
				else{return res.status(500).send({ err :"Bad Request",msg: "Can't Generate New Code" });}
		})

	}



};

module.exports = userController;