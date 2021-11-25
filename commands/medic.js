class MedicCommand {
    constructor() {
        this.command = "medic!";
        this.msgs = ["Here, take a load off breh", "Here ya go", "This'll heal yeh right up", "gotchu breh", "ba da bing, the code red has arrived", "Drink this and you'll be good as new, if not better tbh", "succ", "drink up bubby"];
    }

    run(client, msg) {
        msg.channel.send(this.msgs[Math.floor(Math.random() * 8)], {
            files: ["https://i.imgur.com/EWdC60g.png"]
        });
    }
}

module.exports = MedicCommand;