var express = require('express');
var router = express.Router();
var USER = require('../controllers/user.controller');

router.post('/login', USER.login);
router.post('/password-change', USER.passwordChange);
router.post('/signup', USER.signup);
router.get('/checkAvailability/:id', USER.ckeckAvailibity);
router.post('/fbLogin', USER.fbLogin);
router.post('/userVerification', USER.userVerfication);
router.post('/newCodeGenerate', USER.generateNewVerificationCode);
module.exports = router;


