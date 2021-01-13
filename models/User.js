const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleID: {
    type: String,
    },
  displayName: {
    type: String,
  },
  firstName: {
    type: String,
  },
  image: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  name: {
    type: String,
  },
  email: {
    type: String,
  },
  password: {
    type: String
  },
})

module.exports=mongoose.model('User', userSchema)