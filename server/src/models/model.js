const mongoose = require("mongoose");
let userModel = new mongoose.Schema({
  email: String,
  password: String,
  Role: String,
  Rate: Number,
  First_name: String,
  Last_name: String,
});
let user = new mongoose.model("Users", userModel);
module.exports = user;

