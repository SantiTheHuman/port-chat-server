require("dotenv").config();
const { User } = require("../models");

exports.checkSession = async (req, res, next) => {
  if (req.session.userId) {
    const userId = req.session.userId;
    const user = await User.findById(userId);
    console.log(`Session user: ${user}`);
    return res.status(200).json(user);
  } else {
    console.log("No session found on page load.");
    return res.status(204).send();
  }
};

exports.handleUsername = async (req, res, next) => {
  const usernameInput = req.params.username;
  const userExists = await User.findOne({ username: usernameInput });
  if (userExists) {
    console.log(`${usernameInput} exists`);
    res.status(200).send(`${usernameInput} exists`);
  } else {
    User.create(
      { username: usernameInput, status: "temp" },
      function (err, user) {
        if (err) {
          console.log(err);
          return err;
        }
        req.session.userId = user._id;
        console.log(
          `~~Temp User created: ${user} ~~Session initiated: ${JSON.stringify(
            req.session
          )}`
        );
        res.status(201).json(user);
      }
    );
  }
};

exports.loginUser = async (req, res, next) => {
  const { username, password } = req.body;
  User.authenticate(username, password, (err, user) => {
    if (err) {
      console.log(err);
      return res.status(401).json(err);
    } else {
      req.session.userId = user._id;
      console.log(`Session user: ${user}`);
      return res.status(200).json(user);
    }
  });
};

exports.registerUser = async (req, res, next) => {
  User.findOneAndUpdate(
    { _id: req.session.userId },
    { email: req.body.email, password: req.body.password, status: "saved" },
    { new: true },
    function (err, user) {
      if (err) {
        console.log(err);
        return res.status(400).json(err);
      }
      console.log(user);
      return res.status(200).json(user);
    }
  );
};

exports.changeUsername = async (req, res, next) => {
  const userId = req.session.userId;
  const { newUsername } = req.body;
  User.findOneAndUpdate(
    { _id: userId },
    { username: newUsername },
    function (err, user) {
      if (err) {
        return res.status(400).send(err);
      }
      console.log(`Username changed to ${newUsername}`);
      return res.status(200).send();
    }
  );
};

exports.logoutUser = async (req, res, next) => {
  req.session.destroy(function (err) {
    if (err) {
      console.log(err);
      return res.status(403).json(err);
    }
    console.log("User logged out.");
    res.status(200).send();
  });
  res.clearCookie(process.env.SESS_NAME, { path: "/" });
};

exports.deleteUser = async (req, res, next) => {
  const userId = req.session.userId;
  User.findOneAndUpdate(
    { _id: userId },
    { username: userId, connections: null, status: "del" },
    function (err, user) {
      if (err) {
        console.log(err);
        return res.status(400).send(err);
      }
      req.session.destroy(function (err) {
        if (err) {
          console.log(err);
          return res.status(403).json(err);
        }
      });
      console.log(`User data deleted.`);
      res.clearCookie(process.env.SESS_NAME, { path: "/" });
      return res.status(200).send();
    }
  );
};

exports.addConnection = async (req, res, next) => {
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
  if (req.session.userId) {
    try {
      const myId = req.session.userId;
      const name = req.body.username;
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
