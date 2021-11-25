const fs = require('fs');

class CommandManager {
    constructor() {
        this.commands = [];

        fs.readdirSync('./commands').forEach(file => {
            if(file === 'index.js') return;

            let moduleName = `./${file}`.replace('.js', '');
            let mod = require(moduleName);
            this.commands.push(new mod());
        });

        console.log("Loaded " + this.commands.length + " command(s)");
    }

    check(client, msg) {
        const content = msg.content;
        const parts = msg.content.split(" ");

        if(parts.length === 0) return;

        const command = parts[0];
        const args = parts.splice(0, 1);

        for(let com of this.commands) {
            const value = !com.raw ? command : content;

            let commandSet = com.command;
            if(!Array.isArray(commandSet))
                commandSet = [commandSet];

            const index = commandSet.map(c => c.toLowerCase()).indexOf(value.toLowerCase());

            if(index === -1) continue;
                
            com.run(client, msg, index);

            break;
        }
    }
}

module.exports = CommandManager;