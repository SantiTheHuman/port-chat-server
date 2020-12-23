require("dotenv").config();
const { User } = require("../models");

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
      return res.status(200).json({
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
      console.log(user, req.session);
      return res.status(200).json({
        success: true,
        user: user,
      });
    }
  });
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
        redirectUrl: "/",
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
  // try {
  //   if (user.connections.contacts) {
  //     res.json(user);
  //   await user.connections.contacts.push(newContactExists);
  //   await user.save();
  //   console.log(updatedContacts);
  //   res.json({
  //     success: true,
  //     updatedContacts: user.connections.contacts,
  //   });
  // } else {
  //   const contactsArray = { contacts: [] };
  //   await user.connections
  //     .push(contactsArray)
  //     .then(user.connections.contacts.push(newContactExists));
  //   await user.save();
  //   console.log(user.connections.contacts);
  //   res.json({
  //     success: true,
  //     updatedContacts: user.connections.contacts,
  //   });
  //         }
  //       } catch (err) {
  //         console.log(err);
  //         res.json({
  //           success: false,
  //           message: err.message,
  //         });
  //       }
  //     } else {
  //       res.json({
  //         success: false,
  //         message: "Contact not found in database.",
  //       });
  //     }
  //   } else {
  //     res.json({
  //       success: false,
  //       message: "Couldn't recognize type of connection.",
  //     });
  //   }
  // } else {
  //   console.log(`ERROR: Couldn't get req.session.userId.`);
  // }
};

exports.deleteConnection = async (req, res, next) => {
  // console.log(req.session, req.session.userId, req.body);
  if (req.session.userId) {
    const user = await User.findById(req.session.userId);
    const updatedContacts = await user.connections
      .pull({
        username: req.body.username,
      })
      .save();
    return res.status(200).json({
      success: true,
      updatedContacts: updatedContacts,
    });
  } else {
    return res.status(402).json({
      success: false,
      message: "No authorized user in this session found.",
    });
  }
};

// new Idea(newUser)
// .save()
// .then(idea => {
// res.redirec('/ideas');
// })

// app.put("ideas/:id", (req, res) => {
// Idea.findOne({_id: re.params.id})
//  .then(idea => {
// idea.title = req.body.title,
// idea.details = req.body.details

// idea.save()
// .then(idea => {
// res.redirect('/ideas');
// })
// })
// })

// app.delete("ideas/:id", (req, res) => {
//  Idea.remove({_id: req.params.id})
// .then(() => {
// res.redirect('/ideas')
// })
// })
