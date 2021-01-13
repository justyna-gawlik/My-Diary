//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require('lodash');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: "My secret",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://localhost:27017/diary', {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});

mongoose.set("useCreateIndex", true);

// const postSchema = {
//   title: {
//     type: String,
//     required: [true, 'Enter the title!'],
//     unique: true
//   },
//   content: {
//     type: String,
//     required: true
//   }
// };
// const Post = mongoose.model("Post", postSchema);

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    sparse: true
  },
  password: {
    type: String
  },
  googleID: {
    type: String
  },
  secretTitle: {
    type: String
  },
 secretContent: {
    type: String
  }
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/home",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },

  function (accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({
      googleID: profile.id
    }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get("/posts", function (req, res) {
 
  User.find(
    {
    "secretTitle": {  
      $exists: true,
      $ne: null
    },
    "secretContent": {
      $exists: true, 
      $ne: null
    }
  }, function (err, foundUsers) {
    if (err) {
      console.log(err);
    } else {
      if (foundUsers) {
        res.render("posts", {
          posts: foundUsers
         
        });
      }
    }
  });
});


// app.get("/about", function (req, res) {
//   if (req.isAuthenticated()) {
//     res.render("about");
//   } else {
//     res.redirect("/login");
//   }
// });



app.post("/compose", function (req, res) {

 const userTitle = req.body.postTitle;
 const userContent = req.body.postContent;
 const userId=req.user.id;


  User.findById(userId, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        foundUser.secretTitle = userTitle;
        foundUser.secretContent = userContent;
        foundUser.save(function (err) {
          if (!err) {
            res.redirect("/posts");
          
          } else {
            // console.log("Title must be unique and both fields must be filled in!");
            res.redirect("/compose")
          }
        });
      }
    }

  });

  // post.save(function (err) {
  //   if (!err) {
  //     res.redirect("/home");
  //   } else {
  //     alert("Title must be unique and both fields must be filled in!");
  //     res.redirect("/compose")
  //   }
  // });

});

app.post("/delete", function (req, res) {
  const checkedId = req.body.button;
  User.findByIdAndRemove(checkedId, function (err) {
    if (!err) {
      res.redirect("/posts")
    }
  })
})

app.get('/post/:id', function (req, res) {
  const requestedId = req.params.id;

  User.findOne({
    _id: requestedId
  }, function (err, post) {

    res.render("post", {
      title: _.upperFirst(post.title),
      content: post.content,
      post: post
    });
  });
});

app.get("/compose", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("compose");
  } else {
    res.redirect("/login");
  }
});

app.get("/", function (req, res) {
  res.render("welcome");
});

app.get("/posts", function (req, res) {
  res.render("posts");
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/home", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("home");
  } else {
    res.redirect("/login");
  }
});

app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});

app.get('/auth/google',
  passport.authenticate('google', {
    scope: ["profile"]
  }));

app.get("/auth/google/home",
  passport.authenticate("google", {
    failureRedirect: "/login"
  }),
  function (req, res) {
    res.redirect("/home");
  });

app.post("/register", function (req, res) {

  User.register({
    username: req.body.username
  }, req.body.password, function (err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/home");
      });
    }
  });
});

app.post("/login", function (req, res) {

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/home");
      });
    }
  });
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});