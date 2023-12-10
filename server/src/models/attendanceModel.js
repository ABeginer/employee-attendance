const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");
let attendanceModel = new mongoose.Schema({
  userId: ObjectId,
  email: String,
  date: String,
  checkInTime: String,
  checkOutTime: String,

});
let attendance = new mongoose.model("attendances", attendanceModel);
module.exports = attendance;