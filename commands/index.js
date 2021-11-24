const fs = require('fs');

class CommandManager {
    constructor() {
        this.commands = [];

        fs.readdirSync('./commands').forEach(file => {
            if(file === 'index.js') return;

            let moduleName = `./${file}`.replace('.js', '');
            let mod = require(moduleName);
            this.commands.push(new mod());
        })
    }

    check(client, msg) {
        const parts = msg.content.split(" ");

        if(parts.length === 0) return;

        const command = parts[0];
        const args = parts.splice(0, 1);

        for(let com of this.commands) {
            if(command.toLowerCase() !== com.command.toLowerCase()) continue;
            
            com.run(client, msg);
        }
    }
}

module.exports = CommandManager;