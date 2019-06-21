const socket = io();

// Elements
const messageForm = document.querySelector("#chat");
const messageFormInput = messageForm.querySelector("#message");
const messageFormBtn = messageForm.querySelector("#submit");
const messagesContainer = document.querySelector("#messages-container");
const sendLocationBtn = document.querySelector("#send-location");
const sidebarContainer = document.querySelector("#sidebar");

// Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

// Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true
});

const autoscroll = () => {
  const newMessage = messagesContainer.lastElementChild;

  // get the height of the new message
  const newMessageStyles = getComputedStyle(newMessage);
  const newMessageHeight =
    newMessage.offsetHeight + parseInt(newMessageStyles.marginBottom);

  // visible and total height
  const visibleHeight = messagesContainer.offsetHeight;
  const totalHeight = messagesContainer.scrollHeight;

  // how far have i scrolled??
  const scrollOffset = messagesContainer.scrollTop + visibleHeight;

  if (totalHeight - newMessageHeight <= scrollOffset) {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
};

// listen on "message" event and populate the template
socket.on("message", message => {
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format("h:mm A")
  });
  messagesContainer.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

// listen on "locationMessage" event and populate the template
socket.on("locationMessage", location => {
  const html = Mustache.render(locationTemplate, {
    url: location.url,
    createdAt: moment(location.createdAt).format("h:mm A")
  });
  messagesContainer.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

// listen on "roomChanged" event and update users list
socket.on("roomChanged", ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users
  });
  // sidebarContainer.insertAdjacentHTML("beforeend", html);
  document.querySelector("#sidebar").innerHTML = html;
});

messageForm.addEventListener("submit", e => {
  e.preventDefault();

  messageFormBtn.setAttribute("disabled", "disabled");

  socket.emit("sendMessage", messageFormInput.value, error => {
    messageFormBtn.removeAttribute("disabled");
    messageFormInput.value = "";
    messageFormInput.focus();

    if (error) {
      return console.log("Error!");
    }

    console.log("Message delivered!");
  });
});

sendLocationBtn.addEventListener("click", e => {
  e.preventDefault();

  if (!navigator.geolocation) {
    return console.log("Geolocation not available");
  }

  sendLocationBtn.setAttribute("disabled", "disabled");

  navigator.geolocation.getCurrentPosition(position => {
    socket.emit(
      "sendLocation",
      {
        lat: position.coords.latitude,
        long: position.coords.longitude
      },
      () => {
        sendLocationBtn.removeAttribute("disabled");
        console.log("Delivered");
      }
    );
  });
});

socket.emit("join", { username, room }, error => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});
