const ytdl = require('ytdl-core');
const ytSearch = require('youtube-search');
const { joinVoiceChannel, createAudioPlayer, NoSubscriberBehavior, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');

const tokens = require('../tokens');

class MusicCommand {
  constructor() {
    this.command = ["-play", "-pause", "-resume", "-skip"];

    this.queue = [];
    this.playing = false;
    this.player;

    this.ytOpts = {
      maxResults: 1,
      type: 'video',
      key: tokens.YOUTUBE
    };
  }

  run(client, msg, data) {
    const args = data.args;

    switch (data.index) {
      case 0:
        if (args.length < 1) return msg.channel.send("Music request must contain a YouTube link or search terms.");
        if (!msg.member?.voice.channel) return msg.channel.send("You gotta be in a voice chat channel first to play a song.");

        var regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        var match = args[0].match(regExp);

        // Play a direct youtube link if supplied.
        // If not, then search for a video and play the first result
        if (match)
          this.play(msg.channel, msg.member.voice.channel, args[0]);
        else {
          ytSearch(args.join(" "), this.ytOpts, (err, results) => {
            if (err) {
              msg.channel.send("Error finding a video. Please try again in a few seconds.");
              return console.log(err);
            }

            this.play(msg.channel, msg.member.voice.channel, results[0].link);
          });
        }
        break;
      case 1:
        if (this.player)
          this.player.pause();
        else
          msg.channel.send("No song currently playing to pause.");
        break;
      case 2:
        if (this.player) {
          this.player.unpause();
        }
        else
          msg.channel.send("No song currently playing to resume.");
        break;
      case 3:
        if (this.playing) {
          this.player.stop();
        }
        else
          msg.channel.send("No song currently playing to skip.");
        break;
    }
  }

  async play(channel, voiceChannel, link) {
    if (this.playing) {
      this.queue.push(link);
      channel.send("Added to queue");
      return;
    }

    this.playing = true;

    try {
    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId:  voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      selfDeaf: false,
      selfMute: false
    });
    this.player = createAudioPlayer();

    channel.send("Grabbing song...");

    ytdl.getInfo(link).then((info) => {
      let params = { filter: 'audioonly'};
      if (info.videoDetails.liveBroadcastDetails && info.videoDetails.liveBroadcastDetails.isLiveNow) {
        params = { highWaterMark: 1 << 25, liveBuffer: 1000, quality: [91, 92, 93, 94, 95] };
      }
      const stream = ytdl(link, params).on('error', e => {
        channel.send("Shit broke. Re-check if the given link is correct, or try again in a few seconds.");
        console.log(e);
        this.playing = false;
        this.nextQueue(channel, voiceChannel);
        this.player = null;
      }).on('info', function(info) {
        channel.send(":notes: Playing: " + info.videoDetails.title);
      });

      const resource = createAudioResource(stream, {
        inputType: stream.type,
        inlineVolume: true
      });
      connection.subscribe(this.player);
      this.player.play(resource);

      //this.player.on(AudioPlayerStatus.Playing, () => {
      //  console.log('Playing stream');
      //});

      this.player.on('error', error => {
          console.error(error);
          //player.play(getNextResource());
      });
      
      //this.player.on('debug', debug => {
      //  console.error(debug);
        //player.play(getNextResource());
      //});

      this.player.on('stateChange', (oldState, newState) => {
        if (newState.status == "idle") {
          this.playing = false;
          this.nextQueue(channel, voiceChannel);
        }
      });

    });
    } catch(e) {
        console.log(e);
    }
    /**const stream = ytdl(link, { highWaterMark: 1 << 25, liveBuffer: 1000, quality: [91, 92, 93, 94, 95] }).on('error', e => {
      channel.send("Shit broke. Re-check if the given link is correct, or try again in a few seconds.");
      console.log(e);
      thus.playing = false;
      thus.nextQueue(channel, voiceChannel);
      thus.dispatcher = null;
    }).on('info', function(info) {
      channel.send(":notes: Playing: " + info.videoDetails.title);
    });

    this.dispatcher = connection.play(stream);

    this.dispatcher.on('finish', () => {
      thus.playing = false;
      thus.nextQueue(channel, voiceChannel);
      thus.dispatcher = null;
    }); **/
  }

  async nextQueue(channel, voiceChannel) {
    if (this.queue.length > 0) {
      this.play(channel, voiceChannel, this.queue.shift());
    }
  }
}

module.exports = MusicCommand;