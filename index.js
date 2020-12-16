const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

// express application
const app = express();

// middlewares
app.use(cors());
app.use(express.static("public"));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: "Keepthoseyouloveclosetoyou.",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// IIFE to start db connection and express listening
(async function () {
  const connection_URI =
    "mongodb+srv://Santiago:Imtheboss3000%21@cluster0.25o5l.mongodb.net/chatapp?retryWrites=true&w=majority";
  await mongoose.connect(connection_URI, { useNewUrlParser: true });
  mongoose.set("useCreateIndex", true);
  app.listen("4000", () => console.log("GO GO http://localhost:4000"));
})();

// mongoose model
const userSchema = new mongoose.Schema(
  {
    username: String,
    email: String,
    password: String,
    contacts: Array,
    data: Array,
  },
  {
    timestamps: true,
  }
);
userSchema.plugin(passportLocalMongoose);
const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const messageSchema = new mongoose.Schema(
  {
    senderId: String,
    recipientId: String,
    message: String,
  },
  {
    timestamps: true,
  }
);
const Message = mongoose.model("message", messageSchema);

// routes
app
  .get("/", async (req, res) => {
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.json("notLoggedIn");
    }
  })
  .get("/users", async (req, res) => {
    const result = await User.find({});
    res.json(result);
  })
  .get("/user/:userId", async (req, res) => {
    const result = await User.findById(req.params.userId);
    res.json(result);
  })
  .post("/users", async (req, res) => {
    const userExists = await User.exists({
      username: req.body.username,
    });
    if (userExists) {
      const result = `User ${req.body.username} exists.`;
      console.log(result);
      return res.json(result);
    } else {
      const result = await User.create(req.body);
      console.log(`User ${req.body.username} saved to database`);
      return res.json(result);
    }
  })
  .get("/:username", async (req, res) => {
    const userExists = await User.exists({
      username: req.params.username,
    });
    if (userExists) {
      if (req.isAuthenticated()) {
        if (req.user.username === req.params.username) {
          res.json(req.user.username);
        } else {
          res.json("notUserInUrl");
        }
      } else {
        res.json("notLoggedIn");
      }
    } else {
      res.redirect("/");
      res.json(`${req.params.username} is not on the database.`);
    }
  })
  // MOST RELEVANT
  .post("/register", function (req, res) {
    const userData = {
      username: req.body.username,
      email: req.body.email,
      contacts: [],
      data: [],
    };
    User.register(userData, req.body.password, function (err, user) {
      if (err) {
        console.log(err);
        res.json("Error.");
      } else {
        passport.authenticate("local")(req, res, function () {
          console.log(
            `User ${req.body.username} successfully added to database.`
          );
          res.json(req.user);
        });
      }
    });
  })
  // MOST RELEVANT
  .post("/login", function (req, res) {
    const loginData = new User({
      username: req.body.username,
    });
    req.login(loginData, req.body.password, function (err) {
      if (err) {
        console.log(err);
      } else {
        passport.authenticate("local")(req, res, function () {
          console.log(`User ${req.body.username} successfully logged in.`);
          // res.redirect(req.body.username);
          res.json(req.user);
        });
      }
    });
  })
  .get("/messages/:userId", async (req, res) => {
    Message.find()
      .or([{ senderId: req.params.userId }, { recipientId: req.params.userId }])
      .then((result) => {
        res.json(result);
        console.log(result);
      })
      .catch((error) => {
        console.log(error);
      });
  })
  .post("/messages", async (req, res) => {
    const result = await Message.create(req.body);
    // io.emit()
    res.json(result);
    console.log(result);
  })
  .delete("/messages", async (req, res) => {
    let objId = ObjectId(req.body._id);
    console.log(objId);
    Message.findByIdAndRemove(objId, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log(`Message "${req.body.message}" deleted`);
        // res.set("Content-Type", "text/html");
      }
    });
  })
  .put("/contacts/:userName/:id", async (req, res) => {
    await User.findOneAndUpdate(
      { username: req.params.userName },
      {
        $addToSet: { contacts: [req.body] },
      },
      { new: true },
      function (err, result) {
        if (err) {
          console.log(err);
          return;
        } else {
          res.json(result);
        }
      }
    );
    console.log(req.body._id);
  })
  .delete("/contacts/:userId", async (req, res) => {
    const result = await mongoose.connection.db
      .collection("users")
      .findOneAndUpdate(
        { _id: new mongoose.mongo.ObjectId(req.params.userId) },
        { $pull: { contacts: { username: req.body.username } } },
        { returnOriginal: false }
      );

    res.json(result);
    console.log(result);
  });
