const express = require("express");
const passport = require("passport");
const router=express.Router();


//@desc Auth with Google
//@route GET/auth/google
router.get('/google',
  passport.authenticate('google', {
    scope: ["profile"]
  }));

//@desc Google auth home
//@route GET/auth/google/home

router.get("/google/home",
  passport.authenticate("google", {
    failureRedirect: "/"
  }),
  function (req, res) {
    res.redirect("/home");
  });

  
module.exports=router;