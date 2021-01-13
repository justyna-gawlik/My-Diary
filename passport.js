const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const bcrypt=require('bcryptjs')
const User=require('./models/User');


module.exports=function(passport){

    passport.use(new GoogleStrategy({
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "https://fierce-peak-76761.herokuapp.com/auth/google/home",
      },
    
      async (accessToken, refreshToken, profile, cb)=> {
        const newUser={
            googleID: profile.id,
            displayName: profile.displayName,
          firstName: profile.name.givenName,
                    image: profile.photos[0].value,
        }
        try{
            let user=await User.findOne({googleID:profile.id})

            if(user){
                cb(null,user)
            }else{
                user=await User.create(newUser)
                cb(null,user)
            }
        }catch(err){
            console.error(err);
        }
        }
    ));

    passport.use(new LocalStrategy(
      {  usernameField: 'email'},
      (email, password, done)=> {
          //Match user
          User.findOne({email:email})
          .then(user=>{
            if(!user){
              return done(null, false, {message:'That email is not registered'});
            }

          //Match password
          bcrypt.compare(password, user.password, (err, isMatch)=>{
            if(err) throw err;

            if(isMatch){
              return done(null, user);
            }else{
              return done(null, false, {message:'Password incorrect'})
            }
          });
         });

    }));
      
 

    passport.serializeUser(function (user, done) {
        done(null, user.id);
      });
      
      passport.deserializeUser(function (id, done) {
        User.findById(id, function (err, user) {
          done(err, user);
        });
      });
}