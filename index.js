require("dotenv").config();
const cors = require("cors");
const express = require("express");
var app = require("express")();
var http = require("http").createServer(app);
var io = require("socket.io")(http, {
  cors: true,
  origins: ["http://localhost:3000"],
});
const cookieParser = require("cookie-parser");
const session = require("express-session");
const colors = require("colors/safe");
const { connectDB } = require("./models");

const {
  createUser,
  loginUser,
  logoutUser,
  getUser,
  deleteConnection,
  addConnection,
} = require("./controllers/user");
const {
  getMessages,
  getMessageById,
  createMessage,
  deleteMessage,
} = require("./controllers/message");

// express application
// const app = express();
const TWO_HOURS = 1000 * 60 * 60 * 2;
const {
  PORT = 4000,
  SESS_NAME = "sid",
  SESS_LIFETIME = TWO_HOURS,
  NODE_ENV = "development",
} = process.env;
const IN_PROD = NODE_ENV === "production";

// middlewares
app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    name: SESS_NAME,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: SESS_LIFETIME,
      sameSite: true,
      secure: IN_PROD,
    },
  })
);

app.use((err, req, res, next) => {
  res.status(err).send(err);
});

// socket
// const io = require("socket.io");

io.on("connection", (socket) => {
  // const id = socket.handshake.query.id;
  // socket.join(id);
  socket.on("new message", (msg) => {
    console.log("hi");
    // io.emit("chat message", msg);
  });

  console.log(`connected to socket`);
});

// routes
app.post("/register", createUser);
app.post("/login", loginUser);
app.get("/logout", logoutUser);

app.get("/", getUser);
app.route("/messages/:connectionId").get(getMessages).post(createMessage);
app.route("/messages/:messageId/").get(getMessageById).delete(deleteMessage);
app.route("/connections").post(addConnection).delete(deleteConnection);

// IIFE to start db connection and express listening
(async () => {
  await connectDB();
  http.listen(PORT, () => {
    console.log(colors.green.inverse(`Live on http://localhost:${PORT}`));
  });
})();
