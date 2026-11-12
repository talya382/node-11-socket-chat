// Analiza Chat - write your server here.
// Run it with: npm start   then open http://localhost:3000 in two tabs and chat with yourself :)
// The event names and texts are in the "event contract" table in README.md.

// Step 1: an express app that serves the "public" folder,
//         an http server made from the app, a Socket.io server attached to it, and listen(3000).
//         On every connection print:  User connected: <socket.id>
const express = require("express");
const path = require("path");
const app = express();
const http = require("http");

// הגדרת תיקיית public כתיקייה לקבצים סטטיים
app.use(express.static(path.join(__dirname, "public")));
const { Server } = require("socket.io");
const server = http.createServer(app);
const io = new Server(server);

server.listen(3000);
const arr = [];
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  // Step 5
  socket.on("disconnect", () => {
    console.log("הלקוח התנתק");
    const nickname = socket.data.nickname;
    if (!nickname) {
      return;
    }
    arr.splice(arr.indexOf(socket.data.nickname), 1);
    io.emit("system", `${socket.data.nickname} עזבה את הצ'אט`);
    io.emit("users", arr);
  });

  // Step 2: "join" (nickname, callback)
  //         - empty nickname      -> callback({ ok: false, error: "חובה להזין כינוי" })
  //         - nickname is taken   -> callback({ ok: false, error: "הכינוי כבר תפוס" })
  //         - otherwise save it, callback({ ok: true }), and send to everyone:
  //           "system" -> "<nickname> הצטרפה לצ'אט"   and   "users" -> [all nicknames]

  socket.on("join", (nickname, callback) => {
const cleanNickname = nickname.trim();
    if (cleanNickname.length === 0) {
      callback({
        ok: false,
        error: "חובה להזין כינוי",
      });
      return;
    }

    if (arr.includes(cleanNickname)) {
      callback({
        ok: false,
        error: "הכינוי כבר תפוס",
      });
      return;
    }

    arr.push(cleanNickname);

    callback({
      ok: true,
    });

    io.emit("system", `${cleanNickname} הצטרפה לצ'אט`);
    io.emit("users", arr);
    socket.data.nickname = cleanNickname;

    // Step 3: "chat:message" (text) -> send to everyone: "chat:message" -> { nickname, text, time }
    socket.on("chat:message", (text) => {
      if (!socket.data.nickname) {
        return;
      }

      const cleanText = text.trim();

      if (cleanText.length === 0) {
        return;
      }

      const message = {
        nickname: socket.data.nickname,
        text: cleanText,
        time: new Date().toISOString(),
      };

      // שליחת ההודעה לכל המשתמשים
      io.emit("chat:message", message);
    });

    // Step 4: "typing" -> send to everyone except the sender: "typing" -> nickname
    socket.on("typing", () => {
      if (!socket.data.nickname) {
        return;
      }

      socket.broadcast.emit("typing", socket.data.nickname);
    });
  });
});
// Step 5: "disconnect" -> send to everyone: "system" -> "<nickname> עזבה את הצ'אט"  and  "users"

// Bonus: GET /api/messages -> the last 20 chat messages
