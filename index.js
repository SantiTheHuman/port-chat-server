//~~ setup ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
require("dotenv").config();
const cors = require("cors");
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  cors: {
    origin: process.env.ORIGIN,
    methods: ["GET", "POST", "DELETE"],
    credentials: true,
  },
});
const cookieParser = require("cookie-parser");
const session = require("express-session");
const colors = require("colors/safe");

app.use(
  cors({
    origin: process.env.ORIGIN,
    allowedHeaders: ["Content-Type"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const TWO_HOURS = 1000 * 60 * 60 * 2;
const {
  PORT = process.env.PORT || 4000,
  SESS_NAME = "sid",
  SESS_LIFETIME = TWO_HOURS,
  NODE_ENV = "development",
} = process.env;
const IN_PROD = NODE_ENV === "production";

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

//~~ imports ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
const { connectDB } = require("./models");
const {
  createUser,
  loginUser,
  logoutUser,
  getUser,
  deleteConnection,
  addConnection,
  findUsername,
} = require("./controllers/user");
const {
  getMessages,
  // getMessageById,
  createMessage,
  // deleteMessage,
} = require("./controllers/message");
// const e = require("cors");

//~~ routes ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
app.post("/register", createUser);
app.post("/login", loginUser);
app.post("/login/username", findUsername);
app.get("/logout", logoutUser);

app.get("/", getUser);
// app.route("/messages/:connectionId").get(getMessages);
// app.route("/messages/:messageId/").get(getMessageById).delete(deleteMessage);
app.route("/connections").post(addConnection).delete(deleteConnection);

//~~ sockets ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
io.of("/chat").on("connection", (socket) => {
  let userId = "";
  let socketId = "";
  let username = "";
  let currRoom = "";
  const userObj = socket.handshake.query;
  socketId = socket.id;
  userId = userObj._id;
  username = userObj.username;

  socket.on("online status", (status) => {
    socket.broadcast.emit("user status update", status);
  });

  socket.on("user status back", (status) => {
    socket.broadcast.emit("user status back", status);
  });

  socket.on("join room", async (userData) => {
    if (currRoom) {
      socket.leave(currRoom);
    }
    socket.join(userData.roomId);
    currRoom = userData.roomId;

    socket.broadcast.emit("user is live", userData);

    const chatHistory = await getMessages(
      userData.userId,
      userData.recipientId
    );
    socket.emit("chat history", chatHistory);

    console.log(`${username} enters ROOM ${userData.roomId}`);
    const peeps = await io.of("/chat").in(userData.roomId).allSockets();
    console.log(`Sockets in this room: ${Array.from(peeps)}`);
    console.log(
      `${username} is currently in rooms: ${Array.from(socket.rooms)}`
    );
  });

  socket.on("live text", (liveText) => {
    socket.to(currRoom).emit("live text", liveText);
  });

  socket.on("message", async (msg, roomId) => {
    // console.log(msg, roomId);
    createMessage(msg)
      .then((res) => {
        io.of("/chat").in(roomId).emit("message", res);
        console.log(`EMITTED: ${res.content} to ${roomId}`);
      })
      .catch((err) => console.log(err));
  });

  socket.on("log out", async (status) => {
    await socket.broadcast.emit("user logged out", {
      userId,
      isLive: false,
      isOnline: false,
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
