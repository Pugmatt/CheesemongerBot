const Discord = require('discord.js');

const CommandManager = require('./commands');

const tokens = require('./tokens');

const client = new Discord.Client();
const commands = new CommandManager();

client.on('ready', () => {
  console.log(`Up n' ready for duty!`);
});

client.on('message', msg => {
  commands.check(client, msg);
});

client.login(tokens.DISCORD);