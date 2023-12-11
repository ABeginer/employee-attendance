require("dotenv").config;
const cors = require("cors");
const result = require("dotenv").config();
const nodemailer = require("nodemailer");
if (result.error) {
  console.error(result.error);
}
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
module.exports = router;

const userModel = require("../models/model.js");
const attenModel = require("../models/attendanceModel.js");
const authModel = require("../models/authModel.js");
router.use(cors());
router.use(cors({ origin: true, credentials: true }));
// router.options("*", cors());
router.use(cors({ origin: "*" }));
router.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type,Authorization"
  );

  res.setHeader("Access-Control-Allow-Credentials", true);

  next();
});
router.post("/addNewUser", async (req, res) => {
  try {
    let checkExist = await userModel.find({ email: req.body.email });
    if (checkExist == "") {
      const salt = await bcrypt.genSalt();
      const hashPassword = await bcrypt.hash(req.body.password, salt);
      let data = new userModel({
        email: req.body.email,
        password: hashPassword,
        Role: req.body.Role,
        Rate: req.body.Rate,
        First_name: req.body.First_name,
        Last_name: req.body.Last_name,
        Active : req.body.Active
      });

      data
        .save()
        .catch((err) => {
          return res.status(400).json("error occured");
        })

        .then(() => {
          console.log("data is saved");
          console.log(data);
        });
      // let attenData = new attenModel({
      //   userId: data.id,
      //   email: data.email,
      //   checkIn: false,
      //   checkOut: false,
      //   atten: { 2023: { 12: { date: "8", checkIn: false, checkOut: false } } },
      // });
      // attenData
      //   .save()
      //   .catch((err) => {
      //     return res.status(400).json("error input attendance collection");
      //   })
      //   .then(() => {
      //     console.log("data is saved");
      //     console.log(attenData);
      //   });
      return res.status(200).json("data saved succesfully");
    } else {
      res.status(400).json("user existed");
    }
  } catch (err) {
    //res.status(500).send("something gone wrong at adding user");
    res.status(400).send(err);
  }
});
router.post(
  "/user/change/password",
  cors(),
  authenticateToken,
  async (req, res) => {
    const user = await userModel.find({ email: req.user.email });

    const salt = await bcrypt.genSalt();
    const hashNewPass = await bcrypt.hash(req.body.password, salt);
    const changeObj = { $set: { password: hashNewPass } };

    const filter = { _id: user[0]["id"] };
    try {
      const result = await userModel.updateOne(filter, changeObj);

      res.status(200).send("change password successfully");
    } catch (err) {
      console.log(err);
    }
  }
);
router.post("/getUser", authenticateToken, async (req, res) => {
  try {
    const token = await req.user;
    const user = await userModel.find({ email: token.email });
    res.status(200).send(user);
  } catch (err) {
    console.log(err);
    return res.status(400).send("something gone wrong at getting the user");
  }
});
router.post("/user/login", async (req, res) => {
  if (req.body.email == "" || req.body.password == "") {
    return res.status(400).send("have not insert email or address");
  }
  let loginUser = await userModel.find({ email: req.body.email });
  if(loginUser[0]['Active'] == false ){
    return res.status(404).json({ message: "user is not active" });

  }
  if (loginUser == "") {
    return res.status(404).json({ message: "user does not exist" });
  } else {
    try {
      if (await bcrypt.compare(req.body.password, loginUser[0]["password"])) {
        let resUser = {
          email: loginUser[0]["email"],
          Role: loginUser[0]["Role"],
          Rate: loginUser[0]["Rate"],
          First_name: loginUser[0]["First_name"],
          Last_name: loginUser[0]["Last_name"],
        };
        const accessToken = jwt.sign(resUser, process.env.ACCESS_TOKEN_SECRET, {
          expiresIn: "15m",
        });
        return res.status(200).json({ accessToken: accessToken }); //, user: resUser  Role: loginUser[0][Role]
      } else {
        return res.status(401).json({ message: "wrong username or password" });
      }
    } catch {
      return res.status(401).json({ message: "error when login" });
    }
  }
});
router.get("/user/get/Role", cors(), authenticateToken, async (req, res) => {
  try {
    const user = await userModel.find({ email: req.user.email });
    return res.status(200).send(user[0]["Role"]);
  } catch (err) {
    return res.status(400).send("something gone wrong at get Role");
  }
});

router.post("/user/forgot/password", async (req, res) => {
  let user = await userModel.find({ email: req.body.email });
  if (user == "") return res.status(400).send("user not exist");
  let authUser = await authModel.find({ email: req.body.email });
  if (authUser != "")
    await authModel.deleteOne({ email: authUser[0]["email"] });
  let OTP = Math.floor(Math.random() * 1000000);
  sendOTP(OTP, req);
  const stringOTP = OTP.toString();

  const salt = await bcrypt.genSalt();
  const hashOTP = await bcrypt.hash(stringOTP, salt);
  let authUserModel = new authModel({
    email: req.body.email,
    OTP: hashOTP,
  });

  try {
    authUserModel.save();
    return res.status(200).send("auth data saved successfully");
  } catch (err) {
    return res.status(403).send("some error occur at saving user");
  }
});

router.post("/user/check/valid/OTP", async (req, res) => {
  if (req.body.OTP == "")
    return res.status(400).send("request does not include OTP");
  let authUser = await authModel.find({ email: req.body.email });
  try {
    if (await bcrypt.compare(req.body.OTP, authUser[0]["OTP"])) {
      user = { email: req.body.email, OTP: req.body.OTP };
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "15m",
      });
      deleteAuthUser(req);
      return res.status(200).json({ accessToken: accessToken });
    }
  } catch (err) {
    return res.status(400).send("error confirm OTP");
  }
  deleteAuthUser(req);
  return res.status(401).send("invalid OTP");
});
router.get(
  "/users/get/atten/user",

  cors(),
  authenticateToken,
  async (req, res) => {
    const date = new Date().toLocaleDateString();
    const attenUser = await attenModel.find({
      email: req.user.email,
      date: date,
    });
    if (attenUser == "") {
      return res.status(200).send("");
    }

    return res.status(200).send(attenUser);
  }
);
router.get(
  "/users/get/all/user",
  cors(),
  authenticateToken,
  async (req, res) => {
    try {
      const allEmployee = await userModel.find({ Role: "employee", Active: 'true' });

      return res.status(200).send(allEmployee);
    } catch (err) {
      console.log(err);
      return res.status(400).send("sth gone wrong at getting all user");
    }
  }
);
router.get(
  "/users/get/all/atten/user",
  cors(),
  authenticateToken,
  async (req, res) => {
    const date = new Date().toLocaleDateString();
    try {
      const allAttenUser = await attenModel.find({ date: date });
      return res.status(200).send(allAttenUser);
    } catch (err) {
      console.log(err);
      return res.status(400).send("sth gone wrong at getting atten user");
    }
  }
);
router.post(
  "/user/take/attendance",
  cors(),
  authenticateToken,
  async (req, res) => {
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const newAttend = new attenModel({
      userId: req.user.id,
      email: req.user.email,
      date: currentDate,
      checkInTime: currentTime,
      checkOutTime: "",
    });
    try {
      await newAttend.save();
      return res.status(200).send(currentTime);
    } catch (err) {
      console.log(err);
      return res.status(400).send("sth gone wrong at adding atten model");
    }
  }
);

router.post("/user/check/out", cors(), authenticateToken, async (req, res) => {
  const time = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const date = new Date().toLocaleDateString();
  const filter = { email: req.user.email, date: date };
  const changeObj = { $set: { checkOutTime: time } };
  try {
    await attenModel.updateOne(filter, changeObj);
    return res.status(200).send("check out successfully");
  } catch (err) {
    console.log(err);
    return res.status(400).send("sth gone wrong at checking our user");
  }
});
router.post(
  "/users/deactive/user",
  cors(),
  authenticateToken,
  async (req, res) => {
    try{
      const filter = {email: req.user.email};
      const changeObj = {$set:{Active : "false"}};
      await userModel.updateOne(filter,changeObj);
      return res.status(200).send('deactive user successfully');
    }catch(err){
      console.log(err);
      return res.status(400).send('sth gone wrong at deleting user');
    }
  }
);
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];

  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.sendStatus(401);
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);

    req.user = user;
    next();
  });
}
const sendOTP = async (OTP, req) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "thuanton2003@gmail.com",
      pass: "mdpm pzdz agqo nmuu",
    },
  });
  const mailOptions = {
    from: "thuanton2003@gmail.com",
    to: req.body.email,
    subject: "OTP for password recover",
    text: OTP.toString(),
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error when sending email");
    } else {
      console.log("Email sent to ", req.body.email);
    }
  });
};
const deleteAuthUser = async (req) => {
  const condition = { email: req.body.email };
  try {
    await authModel.deleteOne(condition);
  } catch (err) {
    return res.status(400).send("error when delete auth user");
  }
};

module.exports = router;
// router.get("/findAll", async (req, res) => {
//   try {
//     const data = await userModel.find();
//     res.status(200).json(data);
//   } catch (err) {
//     return res.status(400).json("error occur when find all user");
//   }
//   return res.status(200);
// });

// router.get("/find/:id", async (req, res) => {
//   try {
//     const data = await userModel.findById(req.params.id);
//     res.status(200).json(data);
//   } catch (err) {
//     res.json({ message: err.message });
//     return res.status(400).json("error finding user by ID");
//   }

//   return res.status(200);
// });
