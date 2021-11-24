class TestCommand {
    constructor() {
        this.command = "test";
    }

    run(client, msg) {
        msg.reply("hello");
    }
}

module.exports = TestCommand;