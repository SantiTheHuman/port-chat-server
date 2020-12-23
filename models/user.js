const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const SALT_WORK_FACTOR = 10;

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      index: { unique: true },
    },
    email: {
      type: String,
      unique: false,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    connections: Array,
    data: Array,
  },
  { timestamps: true }
);

// connections: Array

UserSchema.pre("save", function (next) {
  var user = this;
  if (!user.isModified("password")) return next();

  bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
    if (err) return next(err);

    bcrypt.hash(user.password, salt, function (err, hash) {
      if (err) return next(err);

      user.password = hash;
      next();
    });
  });
});

UserSchema.statics.authenticate = function (username, password, callback) {
  User.findOne({ username: username }).exec(function (err, user) {
    if (err) {
      return callback(err);
    } else if (!user) {
      var err = new Error("User not found");
      err.status = 401;
      return callback(err);
    }
    bcrypt.compare(password, user.password, function (err, result) {
      if (err) {
        return callback(err);
      }
      if (result === true) {
        return callback(null, user);
      } else {
        var err = new Error("Password is incorrect.");
        // err.status = 401;
        return callback(err);
      }
    });
  });
};

const User = mongoose.model("user", UserSchema);

module.exports = User;
