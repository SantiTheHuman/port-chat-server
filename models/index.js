require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./user");
const Message = require("./message");

const connectDB = () => {
  return mongoose.connect(process.env.CONNECTION_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  });
};

exports.connectDB = connectDB;
exports.User = User;
exports.Message = Message;
