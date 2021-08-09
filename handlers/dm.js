const mailCategory = require('../config.json').ids.mailCategory;

function mail(message) {
  const ticketName = message.author.username.substr(0,5);
  const server = message.client.guilds.cache.get(require('../config.json').ids.serverID);
  server.channels.create(ticketName,{
    parent:mailCategory
  }).then((newChannel)=>{
    newChannel
  });
}
module.exports = {mail}
