var express = require('express');
var mongoose = require('mongoose');  
var session = require('express-session');
var fileUpload = require('express-fileupload');
var fs = require('fs');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var users = require('./routes/users');
var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens
var cors = require('cors');
var app = express();

app.use(fileUpload());
app.use(cors());

// app.options('*', cors()) // include before other routes 
app.set('superSecret', 'amtica'); // secret variable

mongoose.connect('mongodb://localhost/amtica', {
    reconnectTries: Number.MAX_VALUE,
    reconnectInterval: 1000
});  

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(session({
	secret: 'ssshhhhh',
	resave: true,
	saveUninitialized: true
}));

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../amtikaServer')));
console.log("dirname",__dirname);
app.use('/user', users);

// catch 404 and forward to error handler
app.use(cors({
  origin: 'http://132.140.160.60:9000',
  credentials: true
}));

// app.use(function(req, res, next) {
//   if ((req.get('X-Forwarded-Proto') !== 'https')) {
//     res.redirect('https://' + req.headers.host + req.url);
//   } else
//   next();
// });

// app.use (function (req, res, next) {
//         if (req.secure) {
//           console.log("secure");
//                 // request was via https, so do no special handling
//                 next();
//         } else {
//           console.log("not secure");
//                 // request was via http, so redirect to https
//                 res.redirect('http://' + req.headers.host + req.url);
//         }
// });

app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

app.use(function (req, res, next) {

    // Website you wish to allow to connect
    // res.header("Access-Control-Allow-Origin", "*");
    // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

    // res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');

    // // Request methods you wish to allow
    // res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // // Request headers you wish to allow
    // res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // // Set to true if you need the website to include cookies in the requests sent
    // // to the API (e.g. in case you use sessions)
    // res.setHeader('Access-Control-Allow-Credentials', true);

    // // Pass to next layer of middleware
    // next();
    res.header('Access-Control-Allow-Origin', 'http://localhost:4200');
    res.header('Access-Control-Allow-Origin','*');
    res.header('Access-Control-Allow-Headers','origin, X-Requested-With, Content-Type, Accept, Authorization, x-access-token');
    if (req.method === 'OPTIONS') {
      res.header('Access-Control-Allow-Methods','PUT,POST,PATCH,DELETE,GET');
      return res.status(200).json({});
    }
    else{
      next();

    }
  });
// error handler
// app.use(function(err, req, res, next) {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {};

//   // render the error page
//   res.status(err.status || 500);
//   res.render('error');
// });

app.use((req,res,next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
})

app.use((error,req,res,next)=>{
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message
    }
  })
})


module.exports = app;
