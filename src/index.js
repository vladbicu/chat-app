const express = require("express");
const http = require("http");
const path = require("path");
const socketio = require("socket.io");
const { generateMessage, generateLocationUrl } = require("./utils/messages");
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom
} = require("./utils/users");

// App setup
const app = express();
// convert Express server in raw HTTP server to be accepted by socket.io lib
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, "../public");

app.use(express.static(publicDirectoryPath));

// socket.io
io.on("connection", socket => {
  // react when join event is emitted
  socket.on("join", ({ username, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, username, room });

    if (error) {
      return callback(error);
    }

    socket.join(user.room);

    // emit a message when someone uses the connection
    socket.emit("message", generateMessage("Admin", "Welcome!")); // seen by everyone
    socket.broadcast
      .to(user.room)
      .emit("message", generateMessage("Admin", `${user.username} has joined`)); // seen by everyone except the user that sent the message

    io.to(user.room).emit("roomChanged", {
      room: user.room,
      users: getUsersInRoom(user.room)
    });
    callback();
  });

  // react when a sendMessage event is emitted
  socket.on("sendMessage", (message, callback) => {
    // get the user info w/ socket.id and send message to current room
    const user = getUser(socket.id);
    // emit a message event with newly sent message object as data
    io.to(user.room).emit("message", generateMessage(user.username, message));
    callback();
  });

  // react when a sendLocation event is emitted
  socket.on("sendLocation", (location, callback) => {
    // get the user info w/ socket.id and send message to current room
    const user = getUser(socket.id);
    socket.broadcast
      .to(user.room)
      .emit("locationMessage", generateLocationUrl(user.username, location));
    callback();
  });

  // react when someone gets disconnected from the connection
  // by emmiting a message at the rest of connections
  socket.on("disconnect", () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        generateMessage("Admin", `${user.username} has left!`)
      );
      io.to(user.room).emit("roomChanged", {
        room: user.room,
        users: getUsersInRoom(user.room)
      });
    }
  });
});

server.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});
