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
  const mySocketId = socket.id;
  const parsed = JSON.parse(connections);
  let contacts = parsed.map((c) => ({
    _id: c,
    socket: null,
    status: "offline",
  }));
  let recipient;

  contacts.forEach((c) => {
    socket.join(c._id);
  });
  socket.join(_id);
  socket.to(_id).emit("ask status", {
    userId: _id,
    socketId: mySocketId,
    status: "online",
  });

  socket.on("send status", async ({ userId, socketId, status }) => {
    console.log("send status", userId, socketId, status);
    socketId &&
      io
        .of("/chat")
        .to(socketId)
        .emit("status", { userId: _id, socketId: mySocketId, status });
    const updated = await contacts.map((c) =>
      c._id === userId ? { ...c, socketId, status } : c
    );
    contacts = updated;
  });

  socket.on("update contact", async ({ userId, socketId, status }) => {
    const updated = await contacts.map((c) =>
      c._id === userId ? { ...c, socketId, status } : c
    );
    contacts = updated;
  });

  socket.on("ask status", async ({ socketId, status }) => {
    io.of("/chat")
      .to(socketId)
      .emit("ask status", { userId: _id, socketId: mySocketId, status });
  });

  // socket.on("set recipient", async ({ userId, live }) => {
  //   console.log(userId, live);
  //   const contact = await contacts.find((c) => (c._id = userId));
  //   console.log(contact);

  //   contact.socket &&
  //     io
  //       .of("/chat")
  //       .to(contact.socket)
  //       .emit("status", {
  //         userId: _id,
  //         contSocket: socketId,
  //         status: live ? "live" : "online",
  //       });
  //   recipient = contact;
  //   const chatHistory = await getMessages(_id, userId);
  //   socket.emit("chat history", chatHistory);
  // });

  socket.on("log", () => {
    console.log(contacts);
  });

  socket.on("send msg", async (msg) => {
    const contSocket = recipient.socket ? recipient.socket : null;
    createMessage(msg)
      .then((res) => {
        contSocket && io.of("/chat").to(contSocket).emit("msg received", res);
        socket.emit("msg sent", msg);
      })
      .catch((err) => console.log(err));
  });

  socket.on("log out", () => {
    socket.to(_id).emit("status", { userId: _id, status: "offline" });
    socket.disconnect(true);
  });
  socket.on("disconnect", () => {
    socket.to(_id).emit("status", { userId: _id, status: "offline" });
  });
});

//~~ IIFE to start db connection and express listening ~~~~~~~~~~~~~~~~~~
(async () => {
  await connectDB();
  http.listen(PORT, () => {
    console.log(colors.green.inverse(`Live on ${PORT}`));
  });
})();
