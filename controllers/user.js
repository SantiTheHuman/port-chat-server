require("dotenv").config();
const { User } = require("../models");

// let userId = "";

// exports.userId = userId;

// exports.getUserId = () => {
//   return userId;
// };

// const setUserId = (id) => {
//   userId = id;
// };

exports.createUser = async (req, res, next) => {
  User.create(req.body, function (err, user) {
    if (err) {
      console.log(err);
      return res.status(401).json({
        success: false,
        message: err,
      });
    } else {
      req.session.userId = user._id;
      console.log(
        `~~User created: ${user} ~~Session initiated: ${req.session}`
      );
      return res.json({
        success: true,
        user: user,
      });
    }
  });
};

exports.loginUser = async (req, res, next) => {
  const { username, password } = req.body;
  User.authenticate(username, password, (err, user) => {
    if (err) {
      console.log(err);
      return res.status(402).json({
        success: false,
        message: err,
      });
    } else if (user) {
      req.session.userId = user._id;
      console.log(`Session user: ${user}`);
      return res.status(200).json({
        success: true,
        user: user,
      });
    }
  });
};

exports.findUsername = async (req, res, next) => {
  const usernameInput = req.body.username;
  console.log(usernameInput);
  const userExists = await User.findOne({ username: usernameInput });
  if (userExists) {
    return res.json({
      success: true,
    });
  } else {
    return res.json({
      success: false,
    });
  }
};

exports.logoutUser = async (req, res, next) => {
  if (req.session.cookie) {
    req.session.destroy(function (err) {
      if (err) {
        console.log(err);
        return res.status(403).json({
          success: false,
          message: err,
        });
      }
      res.clearCookie("sid");
      console.log("User logged out.");
      return res.status(202).json({
        success: true,
        message: "User logged out.",
      });
    });
  } else {
    return res.status(403).json({
      success: false,
      message: "No session to destroy found.",
    });
  }
};

exports.getUser = async (req, res, next) => {
  if (req.session.userId) {
    const userId = req.session.userId;
    const user = await User.findById(userId);
    console.log(`Session user: ${user}`);
    return res.json({
      authenticated: true,
      user: user,
    });
  } else {
    return res.json({
      authenticated: false,
    });
  }
};

exports.addConnection = async (req, res, next) => {
  // if (req.session.userId) {
  //   console.log(req.session, req.session.userId, req.body);
  // }
  if (req.session.userId) {
    const user = await User.findById(req.session.userId);
    const newContactExists = await User.findOne({
      username: req.body.username,
    });
    if (newContactExists) {
      const newContact = {
        _id: newContactExists._id,
        username: newContactExists.username,
      };
      const updatedContacts = await user.connections.push(newContact);
      user.save();
      console.log(updatedContacts);
      console.log(user.connections);
      return res.status(200).json({
        success: true,
        updatedContacts: user.connections,
      });
    } else {
      return res.status(402).json({
        success: false,
        message: "No user with this username found in database.",
      });
    }
  } else {
    return res.status(402).json({
      success: false,
      message: "No authorized user in this session found.",
    });
  }
};

exports.deleteConnection = async (req, res, next) => {
  // console.log(req.session, req.session.userId, req.body);
  if (req.session.userId) {
    try {
      const myId = req.session.userId;
      const name = req.body.username;
      // console.log(myId, contactId);
      User.findByIdAndUpdate(
        myId,
        { $pull: { connections: { username: name } } },
        { safe: true, new: true },
        function (err, user) {
          if (err) {
            console.log(err);
          }
          console.log(user.connections);
          return res.status(200).json({
            success: true,
            updatedContacts: user.connections,
          });
        }
      );
    } catch (error) {
      console.log(error);
    }
  } else {
    return res.status(402).json({
      success: false,
      message: "No authorized user in this session found.",
    });
  }
};

// exports.globalUserId = globalUserId;
// exports.getUserId = getUserId;
// exports.setUserId = setUserId;
