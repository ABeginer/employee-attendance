const mongoose = require("mongoose");
const url =
  "mongodb+srv://boprosieuga:Boprodeptrai2@debugfailed.ezl2hjm.mongodb.net/attendance";

mongoose
  .connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("connected to database");
  })
  .catch((err) => {
    console.log("error connecting to database");
  });

