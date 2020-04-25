const fs = require("fs");
const path = require("path");
const arp = require("app-root-path");
const Discord = require("discord.js");

const bot = new Discord.Client();
var botConfig;

bot.once("ready", () => {
    bot.user.setActivity(`${bot.users.cache.size} users - ${botConfig.prefix}help`, { type: 'WATCHING' });
    console.log(`Bot ready at ${(new Date()).toUTCString()}, serving ${bot.guilds.cache.size} guilds with ${bot.channels.cache.size} channels and ${bot.users.cache.size} users.`);
});

bot.on('message', (msg) => {
    if (msg.cleanContent.startsWith(botConfig.prefix) && msg.cleanContent.replace(botConfig.prefix, '').split(' ')[0] === 'help') {
        let configFiles = fs.readdirSync(getPath()).filter(item => item.endsWith('.json'));
        let longestCmd = -1;
        let longestFeat = -1;
        for (let file of configFiles) {
            let contents = JSON.parse(fs.readFileSync(getPath(file)));
            
            if (contents.command) {
                let compareString = botConfig + file;
                if (compareString.length > longestCmd) {
                    longestCmd = compareString.length;
                }
            } else {
                let compareString = file;
                if (compareString.length > longestFeat) {
                    longestCmd = compareString.length;
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
                cmdMessage += `<${(botConfig.prefix + file).padEnd(longestCmd)} ${contents.desc}>\n`;
            } else {
                featMessage += `<${file.padEnd(longestFeat)} ${contents.desc}>\n`;
            }
        }
        msg.channel.send(header + cmdMessage + midder + featMessage + footer);
    } else {
        callModules('message', msg);
    }
});

function callModules(event, ...args) {
    let configFiles = fs.readdirSync(getPath()).filter(item => item.endsWith('.json'));
    for (let file of configFiles) {
        let contents = JSON.parse(fs.readFileSync(getPath(file)));
        if ((contents.command && event === 'message' && args[0].cleanContent.startsWith(botConfig.prefix)) || contents.events.includes(event)) {
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