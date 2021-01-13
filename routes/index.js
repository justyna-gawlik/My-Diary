const express = require("express");
const router=express.Router();
const {ensureAuth, ensureGuest}=require('../middleware/auth');
const passport = require("passport");
const bcrypt=require('bcryptjs');
const User=require('../models/User');
const Story=require('../models/Story');

//@desc Welcome page
//@route GET/
router.get("/", function (req, res) {
    res.render("welcome.ejs");
});

// @desc    Home
// @route   GET /home
router.get("/home", function (req, res) {
  res.render("home");
});


//@desc Posts page
//@route GET/posts
router.get('/posts', ensureAuth, async (req, res) => {
  try {
    const stories = await Story.find({ user: req.user.id }).lean()
    res.render('posts', {
      stories,
    })
  } catch (err) {
    console.error(err)
    res.render('error/500')
  }
})

router.post("/delete", function (req, res) {
  const checkedId = req.body.button;
  User.findByIdAndRemove(checkedId, function (err) {
    if (!err) {
      res.redirect("/posts")
    }
  })
})

//@desc Register page
//@route GET/register
router.get("/register", ensureGuest, function (req, res) {
  res.render("register.ejs");
});

//@desc Login page
//@route GET/login
router.get("/login", ensureGuest, function (req, res) {
  res.render("login.ejs");
});

//@desc Posts page
//@route GET/posts
router.get("/posts", ensureAuth, function (req, res) {
  res.render("posts");
});

//Register Handle
router.post("/register", function (req, res) {

  const {name, email, password, password2}=req.body;
  let errors=[];

  //Check required fields
  if(!name || !email || !password || !password2){
    errors.push({msg:"Please fill in all fields!"});
  }

  //Check passwords match
  if(password !==password2){
    errors.push({msg:'Passwords do not match!'});
  }

  //Check pass length
  if(password.length <6){
    errors.push({msg:"Password should be at least 6 characters!"});
  }

  if(errors.length>0){
    res.render('register.ejs',{
      errors,
      name,
      email,
      password,
      password2  
    });
  }else{
    //Validation pass
    User.findOne({email:email})
    .then(user =>{
      if(user){
        //User exists
        errors.push({msg:'Email is already registered'})
        res.render('register.ejs',{
          errors,
          name,
          email,
          password,
          password2  
        });
      }else{
        const newUser= new User({
          name,
          email,
          password
        });
        // Hash Password
        bcrypt.genSalt(10, (err, salt)=>bcrypt.hash(newUser.password, salt, (err, hash)=>{
          if(err) throw err;
          //Set password to hashed
          newUser.password=hash;
          //Save user
          newUser.save()
          .then(user=>{
            req.flash('success_msg', 'You are now registered and can log in');
            res.redirect("/login")
          })
          .catch(err=> console.log(err));
        }))

      }
    });
  }
});


// Login
router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/home',
    failureRedirect: '/login',
    failureFlash: true
  })(req, res, next);
});


//@desc Logout page
//@route GET/logout
router.get("/logout",function (req, res) {
  req.session.destroy(function(e){
    req.logout();
    res.render("welcome.ejs");
});

});

module.exports=router