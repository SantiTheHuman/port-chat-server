//~~ setup ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
require("dotenv").config();
const cors = require("cors");
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  cors: {
    origin: process.env.ORIGIN,
    credentials: true,
  },
});
const cookieParser = require("cookie-parser");
const session = require("express-session");
const mongoDBStore = require("connect-mongodb-session")(session);
const colors = require("colors/safe");

app.use(
  cors({
    origin: process.env.ORIGIN,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const {
  PORT = process.env.PORT || 5000,
  SESS_LIFETIME = 1000 * 60 * 60 * 24 * 30,
  NODE_ENV = "development",
} = process.env;
const IN_PROD = NODE_ENV === "production";

const store = new mongoDBStore({
  uri: process.env.CONNECTION_URI,
  collection: "sessions",
  expires: SESS_LIFETIME,
});

app.use(
  session({
    name: process.env.SESS_NAME,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: SESS_LIFETIME,
      sameSite: false,
      secure: IN_PROD,
    },
    store: store,
  })
);

//~~ imports ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
const { connectDB } = require("./models");
const {
  checkSession,
  handleUsername,
  loginUser,
  registerUser,
  changeUsername,
  logoutUser,
  deleteUser,
  deleteConnection,
  addConnection,
} = require("./controllers/user");
const { getMessages, createMessage } = require("./controllers/message");
const { User } = require("./models");

//~~ routes ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
app.get("/auth", checkSession);

app.get("/login/:username", handleUsername);
app.post("/login", loginUser);
app.put("/register", registerUser);
app.get("/logout", logoutUser);
app.delete("/logout", deleteUser);

app.put("/user", changeUsername);

app.route("/connections").post(addConnection).delete(deleteConnection);

//~~ sockets ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
io.of("/chat").on("connection", async (socket) => {
  const { _id, username, connections } = await socket.handshake.query;
  let contacts = JSON.parse(connections);
  let recipient = {};

  socket.join(_id);
  contacts.forEach((c) => {
    socket.join(c._id);
    socket.to(c._id).emit("get status", _id);
    console.log(`${username} connects and asks ${c.username} for status'`);
  });

  socket.on("status", ({ contact, status }) => {
    const c = JSON.parse(contact);
    socket.to(c._id).emit("status", { userId: _id, status });
    console.log(`${username} sends status '${status}' to ${c.username}.'`);
  });

  socket.on("live", async (contact) => {
    recipient = await JSON.parse(contact);
    console.log(recipient);
    contacts.forEach((c) => {
      let status;
      c._id === recipient._id ? (status = "live") : (status = "online");
      socket.to(c._id).emit("status", { userId: _id, status });
      console.log(
        `${username} sends status '${status}' to '${c.username}'s room.'`
      );
    });
    const chatHistory = await getMessages(_id, recipient._id);
    socket.emit("chat history", chatHistory);
  });

  socket.on("my rooms", async () => {
    io.of("/Chat")
      .allSockets()
      .then((ids) => console.log(ids));
  });

  // // socket.on("live text", (liveText) => {
  // //   socket.to(inRoom).emit("live text", liveText);
  // // });

  socket.on("message", async (msg) => {
    createMessage(msg)
      .then((res) => {
        io.of("/chat").in(res.recipientId).emit("message", res);
      })
      .catch((err) => console.log(err));
  });
  socket.on("log out", () => {
    contacts.forEach((c) => {
      socket.to(c._id).emit("status", { userId: _id, status: null });
      console.log(
        `${username} sends status 'LOGGED OUT' to '${c.username}'s room.'`
      );
    });
    socket.disconnect(true);
  });
});

//~~ IIFE to start db connection and express listening ~~~~~~~~~~~~~~~~~~
(async () => {
  await connectDB();
  http.listen(PORT, () => {
    console.log(colors.green.inverse(`Live on ${PORT}`));
  });
})();
