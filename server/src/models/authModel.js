
const mongoose = require("mongoose");
let authModel = new mongoose.Schema({
    email: String,
    OTP: String,
})
let auth = new mongoose.model("auth",authModel);
module.exports = auth;
