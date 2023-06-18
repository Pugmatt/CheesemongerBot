const { Client, GatewayIntentBits, Events, Partials } = require('discord.js');

const CommandManager = require('./commands');

const tokens = require('./tokens');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates], partials: [Partials.Channel] });
const commands = new CommandManager();

client.on(Events.ClientReady, c => {
  console.log(`Up n' ready for duty! (${c.user.tag})`);
});

client.on('messageCreate', (message) => {
  commands.check(client, message);
});

client.login(tokens.DISCORD);