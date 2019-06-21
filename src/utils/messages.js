const generateMessage = (username, text) => ({
  username,
  text,
  createdAt: new Date().getTime()
});

const generateLocationUrl = (username, { lat, long }) => ({
  username,
  url: `http://google.com/maps?q=${lat},${long}`,
  createdAt: new Date().getTime()
});

module.exports = {
  generateMessage,
  generateLocationUrl
};
