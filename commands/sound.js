const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');

const tokens = require('../tokens');

class SoundCommand {
  constructor() {
    this.command = "-sound";

    this.queue = [];
    this.playing = false;
    this.player;

    this.ytOpts = {
      maxResults: 1,
      type: 'video',
      key: tokens.YOUTUBE
    };
  }

  validTimestamp(str) {
    return /^(:\d+(?::[0-5][0-9]:[0-5][0-9])?|[0-5]?[0-9]:[0-5][0-9](.+[0-9])?)$/.test(str);
  }

  run(client, msg, data) {
    const args = data.args;

    if (args.length < 1) return msg.channel.send("Command must contain a YouTube link.");

    var regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    var match = args[0].match(regExp);

    if (match) {
        const channel = msg.channel;
        const link = args[0];
        let start;
        let end;

        if(args.length >= 2)
            start = args[1];
        if(args.length === 3)
            end = args[2];

        // Check if user's supplied timestamps are valid before continuing
        if(start && !this.validTimestamp(start))
            return channel.send("Invalid START timestamp. (Examples of valid timestamps: 1:02, 12:34, 4:55.2)");
        else if(end && !this.validTimestamp(end))
            return channel.send("Invalid END timestamp. (Examples of valid timestamps: 1:02, 12:34, 4:55.2)");
            
        // Retrieve audio stream from YouTube link
        let stream = ytdl(link, {
            filter: 'audioonly'
        }).on('error', e => {
            channel.send("Shit broke. Re-check if the given link is correct, or try again in a few seconds.");
            console.log(e);
        }).on('info', function(info) {
            // Generate a random filename for the temp file using a combination of seconds since epoch + a random number
            // (actual file attachment sent to Discord will be the video title)
            const filename = `soundboard_${Math.round(Date.now() / 1000)}${Math.floor(Math.random()*99999)}`;

            // Convert audio to mp3 (and cut between timestamps if supplied)
            const file = ffmpeg(stream);
            if(start)
                file.setStartTime(start);
            if(end)
                file.setDuration(end);
            file.audioBitrate(128)
            .save(`temp_files/${filename}.mp3`)
            .on('error', (err) => {
                channel.send(`Error retrieving sound (${err})`);
            })
            .on('end', () => {
                channel.send({content: "", files: [{attachment: `./temp_files/${filename}.mp3`, name: `${info.videoDetails.title}.mp3`}]}).then(function() {
                    // Delete temporary audio file
                    fs.unlink(`temp_files/${filename}.mp3`, ()=>{});
                });
            });
        });
    } else {
        msg.channel.send("Invalid YouTube link.");
    }
}
}

module.exports = SoundCommand;