var Discord = require("discord.js");
var YouTube = require('youtube-node');
const request = require('request');
const cheerio = require('cheerio');
var fs = require('fs');
var https = require('https');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

var youTube = new YouTube();

youTube.setKey(process.env.YOUTUBE_TOKEN);

var ytdl = require('ytdl-core');
var mybot = new Discord.Client();
var paused = false;
var playing = false;
var indev = false;
var queue = [];


mybot.on("message", function(message) {
    //var isAdmin = mybot.memberHasRole(message.author, getRole("admins", message.channel.server.roles));
	var isAdmin = true;
    //var isAdmin = mybot.memberHasRole(message.author, getRole("admins", message.channel.server.roles));
    if(!message.author.bot) {

      if(message.content.indexOf("reddit.com") != -1) {
        var message_split = message.content.split(" ");
        for(var i=0;i<message_split.length;i++) {
          if(message_split[i].indexOf("reddit.com") != -1) {
            var url = message_split[i];
            if(!url.startsWith("http"))
              url = "https://" + url;
            request(url, function (error, response, body) {
              if(error) {
                console.error('error:', error);
              } else if(body) {
                const $ = cheerio.load(body);
                if($("video source")) {
                  console.log("Downloading: " + $("video source")[0].attribs.src);

                  var url_parts = $("video source")[0].attribs.src.split("/");
                  url_parts[url_parts.length-1] = "HLS_360.ts";
                  var video = url_parts.join("/");
                  url_parts[url_parts.length-1] = "HLS_AUDIO_160_K.ts";
                  var audio = url_parts.join("/");

                   ffmpeg(video)
                   .input(audio)
                   .outputOptions("-c:v", "copy")
                   .save($("video source")[0].attribs.src.replace(/[^0-9a-z]/gi, '') + '.mp4')
                   .on('end', function() {
                    console.log('Converted and sending');

                      mybot.sendMessage(message.channel.id, "", {
                        file: $("video source")[0].attribs.src.replace(/[^0-9a-z]/gi, '') + '.mp4'
                      }).then(function() {
                        fs.unlink($("video source")[0].attribs.src.replace(/[^0-9a-z]/gi, '') + '.mp4', function() {});
                      });
                    })
                    .on('error', function(err) {
                       console.log('an error happened: ' + err.message);
                   }); 
                }
              } 
            });
          }
        }
      }


      if(message.content.includes("( ͡° ͜ʖ ͡°)")) { // "The best command" - fer22f
        mybot.sendMessage(message.channel.id, "( ͡°( ͡° ͜ʖ( ͡° ͜ʖ ͡°)ʖ ͡°) ͡°)");
      }
      if(message.content.startsWith("!commands")
      || message.content.startsWith("!help")) {
        mybot.reply(message, "Bot commands: \n\nJukebox:\n- !play [youtube url] ~ Request song to bot\n- !queue ~ View queue\n- !time ~ View current time stamp of current playing\n- !pause ~ [ADMIN COMMAND] Pause current song\n- !resume ~ [ADMIN COMMAND] Resume current song\n- !next ~ [ADMIN COMMAND] Skip to next song in queue");
      }
      if(message.content.toLowerCase().includes("medic!")) {
        var msgs = ["Here, take a load off breh", "Here ya go", "This'll heal yeh right up", "gotchu breh", "ba da bing, the code red has arrived", "Drink this and you'll be good as new, if not better tbh", "succ", "drink up bubby"];
        mybot.sendMessage(message.channel.id, msgs[Math.floor(Math.random() * 8)], {
            file: "https://i.imgur.com/EWdC60g.png"
        });
      }
      var jbr = process.env.MUSIC_CHAT_CHANNEL; // jukeboxrequest channel id
      if(message.channel.id == jbr) { // If message is coming from the jukeboxrequest channel
        if(message.content.startsWith("!play")) {
          if(!mybot.voiceConnection.playing) {
            playSong(message.content.split(' ')[1]);
          }
          else {
            if(message.content.split(' ')[1]) {
              var regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
              var match = message.content.split(' ')[1].match(regExp);
              if(match) {
                var id = match[2];
                youTube.getById(id, function(error, result) {
                    if(!error) {
                      queue.push({url: message.content.split(' ')[1], title: result.items[0].snippet.title});
                      mybot.reply(message, "Your song has been added to the queue.");
                    }
                    else {
                       mybot.sendMessage(jbr, "[JUKEBOX] Invalid YouTube URL");
                    }
                });
              }
            }
          }
        }
        if(isAdmin && message.content.startsWith("!pause")) {
          if(playing) {
            mybot.voiceConnection.pause();
            mybot.sendMessage(jbr, "[JUKEBOX] Paused music");
            paused = true;
          }
        }
        if(isAdmin && message.content.startsWith("!resume")) {
          if(paused) {
            mybot.voiceConnection.resume();
            mybot.sendMessage(jbr, "[JUKEBOX] Resuming music");
            paused = false;
          }
        }
        if(message.content.startsWith("!time")) {
          if(playing) {
            var ms = mybot.voiceConnection.streamTime,
            min = Math.floor(ms / 60000),
            sec = ((ms % 60000) / 1000).toFixed(0);
            mybot.sendMessage(jbr, "[JUKEBOX] Song has been playing for: " + min + ":" + (sec < 10 ? '0' : '') + sec);
          }
        }
        if(isAdmin && message.content.startsWith("!next")) {
          if(paused)
            mybot.voiceConnection.resume();
          paused = false;
          if(queue.length > 0) {
            mybot.voiceConnection.stopPlaying();
          }
        }
        if(message.content.startsWith("!queue")) {
          if(queue.length > 0) {
            mybot.sendMessage(jbr, "[JUKEBOX] Current Songs in Queue: \n- " + queue.map(function(e) {
              return e.title;
            }).join("\n- "));
          }
          else
              mybot.sendMessage(jbr, "[JUKEBOX] The queue is currently empty. Feel free to play a song. :slight_smile:");
        }
      }
    }
});

mybot.on("presenceUpdate", (oldMember, newMember) => {
    if(oldMember.presence.status !== newMember.presence.status){
        console.log(`${newMember.user.username} is now ${newMember.presence.status}`);
    }
});

mybot.loginWithToken(process.env.BOT_TOKEN, function(err) { console.log(err ? "Error: " + err : "Logged in"); });

mybot.on('ready', () => {
	//mybot.joinVoiceChannel(process.env.MUSIC_CHANNEL, function(err) {
	//if(!err) {
	//   mybot.voiceConnection.playRawStream(ytdl("https://www.youtube.com/watch?v=RAP0fzBsjQk", {filter: 'audioonly'}).on('error', e => {
	//	 console.log(e);
	//	}).on('info',function(info){
	//	}));
   // }
    //else
   //   console.log(err);
 // });
});

mybot.on('disconnect', function(msg, code) {
    if (code === 0) return console.error(msg);
    mybot.connect();
});

function getChannel(name, type) {
  for(var i=0;i<mybot.channels.length;i++) {
    var channel = mybot.channels[i];
    if(channel.name == name && channel.type == type)
      return channel;
  }
}

function getRole(name, roles) {
  for(var i=0;i<roles.length;i++) {
    var role = roles[i];
    if(role.name == name)
      return role;
  }
}

function playSong(url) {
  var jbr = process.env.MUSIC_CHANNEL;
  if(paused) // Turn stream on again so it doesn't crash
    mybot.voiceConnection.resume();
  mybot.voiceConnection.stopPlaying();
  try {
   var requestUrl = url;
   mybot.sendMessage(jbr, "[JUKEBOX] Grabbing video...");
   mybot.voiceConnection.playRawStream(ytdl(requestUrl, {filter: 'audioonly'}).on('error', e => {
     mybot.sendMessage(jbr, "[JUKEBOX] Error while grabbing video. Please recheck if the given link is correct.");
   }).on('info',function(info){
     mybot.setStatus("online", info.title);
     mybot.sendMessage(jbr, "[JUKEBOX] :notes: Playing: " + info.title);
     mybot.setChannelTopic(jbr, ":notes: Currently playing: " + info.title);
   }), function(err, stream) {
       if(queue.map(function(e) {
         return e.url;
       }).indexOf(url) != -1)
        queue.splice(queue.map(function(e) {
          return e.url;
        }).indexOf(url), 1);
       playing = true;
       var check = setInterval(function() {
         if(!paused && !mybot.voiceConnection.playing) {
           mybot.sendMessage(jbr, "[JUKEBOX] Music done playing");
           if(queue.length > 0)
             playSong(queue[0].url);
          clearInterval(check);
         }
       }, 1000);
   });
 }
 catch(err) {
   mybot.sendMessage(jbr, "[JUKEBOX] Error while grabbing video. Please recheck if the given link is correct.");
 }
}
