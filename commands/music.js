const ytdl = require('ytdl-core');
const ytSearch = require('youtube-search');

const tokens = require('../tokens');

class MusicCommand {
    constructor() {
        this.command = ["-play", "-pause", "-resume", "-skip"];

        this.queue = [];
        this.playing = false;
        this.dispatcher;

        this.ytOpts = {
            maxResults: 1,
            type: 'video',
            key: tokens.YOUTUBE
        };
    }

    run(client, msg, data) {
        const args = data.args;

        switch(data.index) {
            case 0:
                if(args.length < 1) return msg.channel.send("Music request must contain a YouTube link.");
                if(!msg.member.voice.channel) return msg.channel.send("You gotta be in a voice chat channel first to play a song.");

                var regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
                var match = args[0].match(regExp);

                // Play a direct youtube link if supplied.
                // If not, then search for a video and play the first result
                if(match)
                    this.play(msg.channel, msg.member.voice.channel, args[0]);
                else {
                    const thus = this;
                    ytSearch(args.join(" "), this.ytOpts, function(err, results) {
                        if(err) {
                            msg.channel.send("Error finding a video. Please try again in a few seconds.");
                            return console.log(err);
                        }

                        thus.play(msg.channel, msg.member.voice.channel, results[0].link);
                    });
                }
                break;
            case 1:
                if(this.dispatcher)
                    this.dispatcher.pause();
                else
                    msg.channel.send("No song currently playing to pause.");
                break;
            case 2:
                if(this.dispatcher) {
                    // Glitches on some versions of nodejs without calling resume twice on this version of discordjs
                    this.dispatcher.resume();
                    this.dispatcher.pause();
                    this.dispatcher.resume();
                }
                else
                    msg.channel.send("No song currently playing to resume.");
                break;
            case 3:
                if(this.dispatcher) {
                    this.dispatcher.destroy();
                    this.playing = false;
                    this.nextQueue(msg.channel, msg.member.voice.channel);
                    this.dispatcher = null;
                }
                else
                    msg.channel.send("No song currently playing to skip.");
                break;
        }
    }

    async play(channel, voiceChannel, link) {
        if(this.playing) {
            this.queue.push(link);
            channel.send("Added to queue");
            return;
        }

        this.playing = true;

        const connection = await voiceChannel.join();
        const thus = this;

        channel.send("Grabbing song...");

        const stream = ytdl(link, { filter: 'audioonly' }).on('error', e => {
            channel.send("Shit broke. Re-check if the given link is correct, or try again in a few seconds.");
            thus.playing = false;
            thus.nextQueue(channel, voiceChannel);
            thus.dispatcher = null;
        }).on('info',function(info) {
            channel.send(":notes: Playing: " + info.videoDetails.title);
        });

        this.dispatcher = connection.play(stream);

        this.dispatcher.on('finish', () => {
            thus.playing = false;
            thus.nextQueue(channel, voiceChannel);
            thus.dispatcher = null;
        });
    }

    async nextQueue(channel, voiceChannel) {
        if(this.queue.length > 0) {
            this.play(channel, voiceChannel, this.queue.shift());
        }
    }
}

module.exports = MusicCommand;