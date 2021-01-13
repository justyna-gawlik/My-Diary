//jshint esversion:6
require('dotenv').config();
const express = require("express");
const mongoose = require('mongoose');
const bodyParser = require("body-parser");
const connectDB=require('./db');
const morgan=require('morgan');
const ejs = require("ejs");
const methodOverride=require('method-override');
const session = require('express-session');
const MongoStore=require('connect-mongo')(session);
const exphbs=require('express-handlebars')
const passport = require("passport");
const flash=require('connect-flash')


//Passport config
require('./passport')(passport)

connectDB();

const app = express();

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.json())
app.set('view engine', 'ejs');

// Method override
app.use(
  methodOverride(function (req, res) {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
      // look in urlencoded POST bodies and delete it
      let method = req.body._method
      delete req.body._method
      return method
    }
  })
)

//Logging
if(process.env.NODE_ENV==='development'){
  app.use(morgan('dev'))
}

//Handlebars Helpers
const {stripTags, truncate, editIcon}= require('./helpers/hbs')

//Handlebars
app.engine('.hbs', exphbs({helpers:{
  stripTags, truncate, editIcon
}, defaultLayout:'main', extname:'.hbs'}));
app.set('view engine', '.hbs');

// Sessions
app.use(session({
  secret: "My secret",
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({mongooseConnection: mongoose.connection})
}));


//Passport middleware
app.use(passport.initialize());
app.use(passport.session());

//Set global var
app.use(function(req, res, next){
  res.locals.user=req.user ||null
  next()
})

//Static folder
app.use(express.static("public"));

//Connect flash
app.use(flash());

//Global Vars
app.use((req,res,next)=>{
  res.locals.success_msg=req.flash("success_msg");
  res.locals.error_msg=req.flash("error_msg");
  res.locals.error=req.flash("error");
  next();
});

//Routes
app.use('/', require('./routes/index'))
app.use('/auth', require('./routes/auth'))
app.use('/stories', require('./routes/stories'))


app.listen(process.env.PORT, function () {
  console.log("Server is running");
})

// app.listen(3000, function () {
//   console.log("Server started on port 3000");
// });