var playlist = [];
var socketConnector = null;
var socketSemaphore = false;
var tag = document.createElement("script");
var currentVideoID = null;
var player = null;

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName("script")[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
var player;
function onYouTubeIframeAPIReady() {
  currentVideoID = "tbnLqRW9Ef0";
  player = new YT.Player("player", {
    //height: "390",
    //width: "100%",
    videoId: currentVideoID,
    playerVars: {
      playsinline: 1,
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange,
    },
  });
}

function onPlayerReady(event) {
  event.target.playVideo();
}

var done = false;
function onPlayerStateChange(event) {
  if (event.data == 0) {
    playNext();
    console.log("playing stopped");
  }
  //if (event.data == YT.PlayerState.PLAYING && !done) {
  //  setTimeout(stopVideo, 6000);
  //  done = true;
  //}
}
function stopVideo() {
  player.stopVideo();
}

function connectSocket() {
  if (socketSemaphore) {
    console.log("Another connection attempt already in progress, canceling!");
    return;
  }
  console.log("Connecting to socket");
  socketSemaphore = true;
  let socket = new WebSocket(wsBaseUrl);
  socket.onopen = function (e) {
    clearInterval(socketConnector);
    socketConnector = null;
    socketSemaphore = false;
    console.log("[open] Connection established");
  };
  // TODO: on close and on error attempt reconnect
  socket.onclose = function (event) {
    if (event.wasClean) {
      console.log(
        `[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`
      );
    } else {
      // e.g. server process killed or network down
      // event.code is usually 1006 in this case
      // TODO: add some nice ui thingi to show reconnect
      // TODO: also add some timeout function to repeat this until connect is successful, let it interact with 'onopen'
      console.log("[close] Connection died, attempting reconnect");
      if (!socketConnector) {
        socketConnector = setInterval(connectSocket, 5000);
        socketSemaphore = false;
      }
    }
  };
  socket.onmessage = function (event) {
    data = JSON.parse(event.data);
    if (data["videoId"] != undefined && data["videoId"] != null) {
      addToPlaylist(data);
      updateListeners(data);
      console.log(`[message] Data received from server: ${event.data}`);
    } else {
      console.log(
        `[unparseable message] Data received from server ${event.data}`
      );
    }
  };
  socketSemaphore = false;
}

function updateListeners(data) {
  document.getElementById("listeners").innerHTML = data.listeners;
}

function removeFromPlaylist(videoId) {
  delete playlist[currentVideoID];
  // remove from DOM
  rm = document.getElementById(videoId);
  if (rm != null) {
    rm.remove();
  }
  currentVideoID = null;
}

function playNext() {
  removeFromPlaylist(currentVideoID);
  if (playlist[0] != null && playlist[0] != "") {
    player.loadVideoById(playlist[0].videoId);
    player.playVideo();
  }
}

function addToPlaylist(data) {
  if (document.getElementById(data.videoId) == null) {
    playlist.push(data);
    pl = document.getElementById(
      "playlist"
    ).innerHTML += `<div class="playlistrow" id="${data.videoId}">
        <div class="title">${data.title}</div>
        <div class="ytlink">
            <a target="_blank" href="${data.link}">${data.link}</a>
        </div>
        <div class="controls">
            <div class="control" onclick="removeFromPlaylist('${data.videoId}')">Remove</div>
            <div class="control">Play</div>
        </div>
        </div>`;
    if (player.getPlayerState() == YT.PlayerState.ENDED) {
      player.loadVideoById(data["videoId"]);
      player.playVideo();
      currentVideoID = data["videoId"];
    }
  } else {
    console.log(`item ${data.videoId} already exists in playlist skipping`);
  }
}
