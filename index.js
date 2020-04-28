const fs = require("fs");
const path = require("path");
const arp = require("app-root-path");
const Discord = require("discord.js");

const bot = new Discord.Client();
var botConfig;

bot.once("ready", () => {
    bot.user.setActivity(`${bot.users.cache.size} users - ${botConfig.prefix}help`, { type: 'WATCHING' });
    console.log(`Bot ready at ${(new Date()).toUTCString()}, serving ${bot.guilds.cache.size} guilds with ${bot.channels.cache.size} channels and ${bot.users.cache.size} users.`);
    callModules('ready');
});

bot.on('message', (msg) => {
    if (msg.cleanContent.startsWith(botConfig.prefix) && msg.cleanContent.replace(botConfig.prefix, '').split(' ')[0] === 'help') {
        let configFiles = fs.readdirSync(getPath()).filter(item => item.endsWith('.json'));
        let longestCmd = -1;
        let longestFeat = -1;
        for (let file of configFiles) {
            let contents = JSON.parse(fs.readFileSync(getPath(file)));
            
            if (contents.command) {
                let compareString = botConfig + file.split('.')[0];
                if (compareString.length > longestCmd) {
                    longestCmd = compareString.length;
                }
            } else {
                let compareString = file.split('.')[0];
                if (compareString.length > longestFeat) {
                    longestFeat = compareString.length;
                }
            }
        }
        let header = '```md\n# COMMANDS\n\n';
        let midder = '# FEATURES\n\n';
        let footer = '```';
        let cmdMessage = '';
        let featMessage = '';
        for (let file of configFiles) {
            let contents = JSON.parse(fs.readFileSync(getPath(file)));
            if (contents.command) {
                cmdMessage += `<${(botConfig.prefix + file.split('.')[0]).padEnd(longestCmd)} ${contents.desc}>\n`;
            } else {
                featMessage += `<${file.split('.')[0].padEnd(longestFeat)} ${contents.desc}>\n`;
            }
        }
        msg.channel.send(header + cmdMessage + midder + featMessage + footer);
    } else {
        callModules('message', msg);
    }
});

bot.on('error', error => {
    console.error('Websocket error: ' + error);
    process.exit(-1);
});

bot.on('channelCreate', channel => {callModules('channelCreate', channel)});
bot.on('channelDelete', channel => {callModules('channelDelete', channel)});
bot.on('channelPinsUpdate', (channel, time) => {callModules('channelPinsUpdate', channel, time)});
bot.on('channelUpdate', (oldChannel, newChannel) => {callModules('channelUpdate', oldChannel, newChannel)});
bot.on('emojiCreate', emoji => {callModules('emojiCreate', emoji)});
bot.on('emojiDelete', emoji => {callModules('emojiDelete', emoji)});
bot.on('emojiUpdate', (oldEmoji, newEmoji) => {callModules('emojiUpdate', oldEmoji, newEmoji)});
bot.on('guildBanAdd', (guild, user) => {callModules('guildBanAdd', guild, user)});
bot.on('guildBanRemove', (guild, user) => {callModules('guildBanRemove', guild, user)});
bot.on('guildCreate', guild => {callModules('guildCreate', guild)});
bot.on('guildDelete', guild => {callModules('guildDelete', guild)});
bot.on('guildIntegrationsUpdate', guild => {callModules('guildIntegrationsUpdate', guild)});
bot.on('guildMemberAdd', member => {callModules('guildMemberAdd', member)});
bot.on('guildMemberRemove', member => {callModules('guildMemberRemove', member)});
bot.on('guildMembersChunk', (members, guild) => {callModules('guildMembersChunk', members, guild)});
bot.on('guildMemberSpeaking', (member, speaking) => {callModules('guildMemberSpeaking', member, speaking)});
bot.on('guildMemberUpdate', (oldMember, newMember) => {callModules('guildMemberUpdate', oldMember, newMember)});
bot.on('guildUnavailable', guild => {callModules('guildUnavailable', guild)});
bot.on('guildUpdate', (oldGuild, newGuild) => {callModules('guildUpdate', oldGuild, newGuild)});
bot.on('inviteCreate', invite => {callModules('inviteCreate', invite)});
bot.on('inviteDelete', invite => {callModules('inviteDelete', invite)});
bot.on('messageDelete', message => {callModules('messageDelete', message)});
bot.on('messageDeleteBulk', messages => {callModules('messageDeleteBulk', messages)});
bot.on('messageReactionAdd', (reaction, user) => {callModules('messageReactionAdd', reaction, user)});
bot.on('messageReactionRemove', (reaction, user) => {callModules('messageReactionRemove', reaction, user)});
bot.on('messageReactionRemoveAll', message => {callModules('messageReactionRemoveAll', message)});
bot.on('messageReactionRemoveEmoji', reaction => {callModules('messageReactionRemoveEmoji', reaction)});
bot.on('messageUpdate', (oldMessage, newMessage) => {callModules('messageUpdate', oldMessage, newMessage)});
bot.on('presenceUpdate', (oldPresence, newPresence) => {callModules('presenceUpdate', oldPresence, newPresence)});
bot.on('rateLimit', info => {callModules('rateLimit', info)});
bot.on('roleCreate', role => {callModules('roleCreate', role)});
bot.on('roleDelete', role => {callModules('roleDelete', role)});
bot.on('roleUpdate', (oldRole, newRole) => {callModules('roleUpdate', oldRole, newRole)});
bot.on('typingStart', (channel, user) => {callModules('typingStart', channel, user)});
bot.on('userUpdate', (oldUser, newUser) => {callModules('userUpdate', oldUser, newUser)});
bot.on('voiceStateUpdate', (oldState, newState) => {callModules('voiceStateUpdate', oldState, newState)});

function callModules(event, ...args) {
    let configFiles = fs.readdirSync(getPath()).filter(item => item.endsWith('.json'));
    for (let file of configFiles) {
        let contents = JSON.parse(fs.readFileSync(getPath(file)));
        if ((contents.command && event === 'message' && args[0].cleanContent.startsWith(botConfig.prefix) && args[0].cleanContent.replace(botConfig.prefix, '').split(' ')[0] === file.split('.')[0]) 
            || (contents.events && contents.events.includes(event))) {
            rnc(getCounterpartPath(file)).execute(event, bot, args);
        }
    }
}

function rnc(module) {
    delete require.cache[require.resolve(module)];
    return require(module);
}

function getPath(filename) {
    if (filename) {
        return path.join(arp.toString(), "modules", filename);
    } else {
        return path.join(arp.toString(), "modules");
    }
}

function getCounterpartPath(filename) {
    if (filename.endsWith(".js")) {
        return getPath(filename.split(".")[0] + ".json");
    } else if (filename.endsWith(".json")) {
        return getPath(filename.split(".")[0] + ".js");
    } else {
        console.warn(`getCounterpartPath called with invalid or no file extension - filename is ${filename}`);
    }
}

module.exports.run = (config) => {
    if (!config.token || !config.prefix) {
        console.error("The supplied configuration is missing either the bot token or the prefix! This is a fatal error, terminating.");
        process.exit(-1);
    }

    for (let file of fs.readdirSync(getPath())) {
        if (file.endsWith(".js") && !fs.existsSync(getCounterpartPath(file))) {
            console.warn(`File ${file} does not have an associated .json (config) file, and its functionality will never run.`);
        } else if (file.endsWith(".json") && !fs.existsSync(getCounterpartPath(file))) {
            console.warn(`File ${file} is a config file without associated script.`);
        }
    }

    botConfig = config;
    bot.login(config.token);
}