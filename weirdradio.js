const cheerio = require("cheerio");
const request = require("request");
const jsonfile = require("jsonfile");
const sdk = require("matrix-bot-sdk");
const http = require("http");
const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");

const configfile = "config/config.json";
var config = jsonfile.readFileSync(configfile);

const MatrixClient = sdk.MatrixClient;
const SimpleFsStorageProvider = sdk.SimpleFsStorageProvider;
const AutojoinRoomsMixin = sdk.AutojoinRoomsMixin;

const client = new MatrixClient(
  config.homeServerUrl,
  config.accessToken,
  new SimpleFsStorageProvider(config.storage)
);

// load assets
let assets = [];
var files = fs.readdirSync("assets/");
files.forEach((name) => {
  assets[name] = fs.readFileSync("assets/" + name);
});
// create server, this is for delivering the iframe page
const webServer = http
  .createServer((req, res) => {
    reqFileName = path.parse(req.url).base;
    if (reqFileName == "") {
      reqFileName = "index.html";
    }
    if (assets[reqFileName] != undefined && assets[reqFileName] != null) {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(assets[reqFileName]);
    } else {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404 - file not found");
    }
  })
  .listen(config.webServerPort);
console.log("Webserver started");

const webSocketServer = new WebSocket.Server({
  port: config.webSocketServerPort,
});
console.log("Websocketserver started");

let sockets = [];
webSocketServer.on("connection", function (socket) {
  sockets.push(socket);

  // When you receive a message, send that message to every socket.
  //socket.on('message', function(msg) {
  //sockets.forEach(s => s.send(msg));
  //});

  // When a socket closes, or disconnects, remove it from the array.
  socket.on("close", function () {
    sockets = sockets.filter((s) => s !== socket);
  });
});

// matrix client
AutojoinRoomsMixin.setupOnClient(client);
client.start().then(() => console.log("Matrix-Client started!"));

client.on("room.message", (roomId, event) => {
  if (!config.monitorChannels.includes(roomId)) return;
  if (!event["content"]) return;
  const sender = event["sender"];
  const body = event["content"]["body"];
  const type = event["content"]["msgtype"];
  const info = event["content"]["info"];
  const url = event["content"]["url"];
  if (type == "m.text") {
    // TODO: beautify this regexp, too greedy, match only on explizit watch links, maybe transcribe into embedd links here
    //link_matches = body.match(/https?:\/\/[^\ ]*youtu[^\ ]*/g);
    var r = new RegExp(/https?:\/\/[^\ ]*youtube.com\/watch\?v=([^\ ]*)/g);
    link_matches = r.exec(body);
    if (link_matches && link_matches.length > 1) {
      // pass to server
      var obj = {
        link: link_matches[0],
        embedLink:
          "https://www.youtube.com/embed/" + link_matches[1] + "?autoplay=1",
        videoId: link_matches[1],
    
      };
      console.log("Relaying: " + obj.link);
      sockets.forEach((s) => s.send(JSON.stringify(obj)));
    }
  }
});
