class LennyCommand {
    constructor() {
        this.command = "( ͡° ͜ʖ ͡°)";
        this.raw = true;
    }

    run(client, msg) {
        msg.channel.send("( ͡°( ͡° ͜ʖ( ͡° ͜ʖ ͡°)ʖ ͡°) ͡°)");
    }
}

module.exports = LennyCommand;