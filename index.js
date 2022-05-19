//Imports bot token and prefix for easy access
const Settings = require('./files/settings.js');

//Array of emojis
const emojis = [':one:', ':two:', ':three:', ':four:', ':five:', ':six:', ':seven:', ':eight:', ':nine:', ':keycap_ten:'];

//Load discord.js and creates a bot
const Discord = require('discord.js');
const { Client, Intents } = require('discord.js');
const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES]
});

//Load discor music player and creates a player
const { RepeatMode } = require('discord-music-player');
const { Player, Song } = require("discord-music-player");
const player = new Player(client, {
    leaveOnEmpty: false,
    leaveOnEnd: true,
    timeout: 30000,
});
client.player = player;

//Bot write on logs whem connects to a server
client.on('ready', () => {
    console.log('Bot online')
});

client.on('messageCreate', async (message) => {
    //Checks to see if message has the right 'PREFIX' or if it was set by a bot
    if (!message.content.startsWith(Settings.PREFIX) || message.author.bot) {
        return;
    }

    //Separetes the message sent by its spaces
    const args = message.content.slice(Settings.PREFIX.length).trim().split(/ +/g);

    //Gets the first word from the message sent (the command to execute)
    const command = args.shift().toLowerCase();


    let guildQueue = client.player.getQueue(message.guild.id);

    //If the user is not in a voice channel gives an erro!
    if (!message.member.voice.channel) {
        return message.channel.send(":no_entry_sign: Please connect to a voice channel!");
    };

    //Based on the command given executes the right code
    switch (command) {
        //Adds a song or playlist to a the queue or if non existing, creates a queue
        case ('play'):
            //Gets the song to play from the message
            let songLink = args.join(' ');

            //If there is no song gives an erro!
            if (!songLink) {
                return message.channel.send(":x: You need to provide a link or title!");
            };


            //Gets the queue 
            let queue = client.player.createQueue(message.guild.id);
            await queue.join(message.member.voice.channel);

            //Checks to see if link it's a playlist or a song
            if (songLink.includes('youtube.com/playlist') || songLink.includes('spotify.com/playlist')) {
                //Adds the playlist to queue and plays if queue is not in play
                let song = await queue.playlist(songLink).catch(_ => {
                    if (!guildQueue)
                        queue.stop();
                });
                message.channel.send(`:notes: Playlist added to the queue: \n\n ${song}`);
            }
            else {
                //Adds the song to queue and plays if queue is not in play
                let song = await queue.play(songLink).catch(_ => {
                    if (!guildQueue)
                        queue.stop();
                });
                message.channel.send(`:musical_note: Song added to the queue: \n\n ${song}`);
            };
            break;

        //If the queue existes and is playing skips the current song
        case ('skip'):
            if (guildQueue) {
                if (guildQueue.isPlaying) {
                    let skipped = guildQueue.skip();
                    return message.channel.send(`:fast_forward: Song skipped: \n\n${skipped}`);
                }
            }
            message.channel.send(":x: No music playing!");
            break;

        //If the queue existes and is playing stops the queue and delets it
        case ('stop'):
            if (guildQueue) {
                guildQueue.stop();
                return message.channel.send(':octagonal_sign: Queue stoped!');
            }
            message.channel.send(":x: No music playing!");
            break;

        //If the queue existes and is playing pauses the queue
        case ('pause'):
            if (guildQueue) {
                guildQueue.setPaused(true);
                return message.channel.send(':pause_button: Queue paused!');
            }
            message.channel.send(":x: No music playing!");
            break;

        //If the queue existes and is paused resumes the queue
        case ('resume'):
            if (guildQueue) {
                guildQueue.setPaused(false);
                return message.channel.send(`:arrow_forward: Queue resumed! \n\nNow playing: \n\n${guildQueue.nowPlaying}`);
            }
            message.channel.send(":x: No music playing!");
            break;

        //If the queue existes clears it
        case ('clearqueue'):
            if (guildQueue) {
                guildQueue.clearQueue();
                return message.channel.send(":free: Queue as been cleared!");
            }
            message.channel.send(":x: No music playing!");
            break;

        //If the queue existes and is playing shuffles it
        case ('shuffle'):
            if (guildQueue) {
                guildQueue.shuffle();
                return message.channel.send(":twisted_rightwards_arrows: Queue as been shuffled!");
            }
            message.channel.send(":x: No music playing!");
            break;

        //If the queue existes and is playing displais the current song and its time
        case ('nowplaying'):
            if (guildQueue) {
                const ProgressBar = guildQueue.createProgressBar();

                return message.channel.send(`:arrow_forward::musical_note: Now playing: \n\n ${guildQueue.nowPlaying} \n${ProgressBar.times}`);
            }
            message.channel.send(":x: No music playing!");
            break;

        //Displays the current bot volume
        case ('getvolume'):
            if (guildQueue) {
                return message.channel.send(`:loud_sound: Current volume: ${guildQueue.volume}`);
            }
            message.channel.send(":x: No music playing!");
            break;

        //Sets the current bot volume
        case ('setvolume'):
            if (guildQueue) {
                guildQueue.setVolume(parseInt(args[0]));
                return message.channel.send(`:loud_sound: Volume changed to: ${guildQueue.volume}`);
            }
            message.channel.send(":x: No music playing!");

            break;

        //If the queue existes displays the firt 10 songs
        case ('queue'):
            if (guildQueue) {

                let songs = guildQueue.songs;
                let max = 10;
                if (songs.length == 1) {
                    return message.channel.send(`The first song is: \n\n ${songs[0]}`);
                }

                if (songs.length < 10) {
                    max = songs.length;
                }
                let songsList = '';
                for (cont = 0; cont < max; cont++) {
                    songsList = songsList.concat(`${emojis[cont]} ${songs[cont]} \n`);
                }
                return message.channel.send(`The first ${max} songs are: \n\n${songsList}`);
            }
            message.channel.send(":x: No music playing!");

            break;

        //Verificar se arg e possivel////////////////////////////
        case ('remove'):
            if (guildQueue) {
                let numero = parseInt(args[0]) - 1;
                let songs = guildQueue.songs;
                if (numero < 0 || numero > songs.length) {
                    return message.channel.send(`:x: Impossible to remove song number ${numero + 1}`);
                }
                guildQueue.remove(numero);
                return message.channel.send(`Removed song: \n ${songs[numero]}`);
            }
            message.channel.send(":x: No music playing!");
            break;

        //Done
        case ('prefix'):
            message.channel.send(`To use commands directed at me start them with: ${Settings.PREFIX}`);
            break;

        //
        case ('help'):
            //Gets the second commad 
            let command2 = args[0];

            if (!command2) {
                return message.channel.send('List of comands: \nplay, skip, stop, pause, resume, \nclearqueue, shuffle, nowplaying, \ngetvolume, setvolume, prefix, help \n \nFor extra help type !help (command)');
            };

            // switch (command2) {
            //     case ('play'):

            //         break;
            //     case ('skip'):

            //         break;
            //     case ('stop'):

            //         break;
            //     case ('pause'):

            //         break;
            //     case ('resume'):

            //         break;
            //     case ('play'):

            //         break;
            //     case ('play'):

            //         break;
            //     case ('play'):

            //         break;
            //     case ('play'):

            //         break;
            // }
            break;

        //Done
        default:
            message.channel.send(":x: I coundn't recognise the command!");
            break;
    }
});

client.login(Settings.TOKEN);