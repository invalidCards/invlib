import fs from "fs";
import path from "path";
import arp from "app-root-path";
import Discord from "discord.js";

const bot = new Discord.Client();
var botConfig;

bot.once("ready", () => {
    bot.user.setActivity(`${but.users.cache.size} users - ${botConfig.prefix}help`, { type: 'WATCHING' });
    console.log(`Bot ready at ${(new Date()).toUTCString()}, serving ${bot.guilds.cache.size} guilds with ${bot.channels.cache.size} channels and ${bot.users.cache.size} users.`);
});

bot.on("raw", async packet => {
    if (["HELLO", "READY", "RESUMED", "RECONNECT", "INVALID_SESSION"].includes(packet.t)) {
        return; //These are internal events, and no functionality should be hooked into them through raw events
    }

    if (packet.t === "MESSAGE_CREATE" && packet.d.type === 0 && packet.d.content.startsWith(botConfig.prefix + "help")) {
        let allFileContents = [];
        let header = "```md\nCOMMAND LIST\n\n";
        let footer = "```";
        let cmdlist = "";
        let longest = -1;
        for (let file of fs.readdirSync(getPath()).filter(file => file.endsWith(".ic"))) {
            allFileContents.push(fs.readFileSync(getPath(file)));
            let compareString = botConfig.prefix + file.split(".")[0];
            if (compareString.length > longest) {longest = compareString.length;}
        }
        for (let fc of allFileContents) {
            let fco = JSON.parse(fc);
            cmdlist += `<${(botConfig.prefix + file.split(".")[0]).padEnd(longest)} ${fco.desc}>\n`
        }
        let channel = await bot.channels.fetch(packet.d.channel_id, true);
        if (channel && ['dm', 'text'].includes(channel.type)) {
            channel.send(header + cmdlist + footer);
        }
    } else {
        for (let file of fs.readdirSync(getPath()).filter(file => file.endsWith(".ic"))) {
            fs.readFile(getPath(file), (err, data) => {
                if (err) {
                    console.error(`Internal error: ${err.message}`)
                } else {
                    try {
                        let config = JSON.parse(data);
                        if (config.command && packet.t === "MESSAGE_CREATE" && packet.d.type === 0 && packet.d.content.startsWith(botConfig.prefix + file.split(".")[0])) {
                            let args = packet.d.content.split(" ");
                            args.shift();
                            rnc(getCounterpartPath(file)).execute(bot, packet, args);
                        } else if (!config.command && config.events.includes(packet.t)) {
                            rnc(getCounterpartPath(file)).execute(bot, packet);
                        }
                    } catch {
                        console.warn(`Error parsing ${file} to JSON, skipping`);
                    }
                }
            });
        }
    }
});

function rnc(module) {
    delete require.cache[require.resolve(module)];
    return require(module);
}

function getPath(filename) {
    if (filename) {
        return path.join(arp.toString(), "functions", filename);
    } else {
        return path.join(arp.toString(), "functions");
    }
}

function getCounterpartPath(filename) {
    if (filename.endsWith(".js")) {
        return getPath(filename.split(".")[0] + ".ic");
    } else if (filename.endsWith(".ic")) {
        return getPath(filename.split(" ")[0] + ".js");
    } else {
        console.warn(`getCounterpartPath called with invalid or no file extension - filename is ${filename}`);
    }
}

export function run(config) {
    if (!config.token || !config.prefix) {
        console.error("The supplied configuration is missing either the bot token or the prefix! This is a fatal error, terminating.");
        process.exit(-1);
    }

    for (let file of fs.readdirSync(path.join(arp.toString(), "functions"))) {
        if (file.endsWith(".js") && !fs.existsSync(getCounterpartPath(file))) {
            console.warn(`File ${file} does not have an associated .ic (config) file, and its functionality will never run.`);
        } else if (file.endsWith(".ic") && !fs.existsSync(getCounterpartPath(file))) {
            console.warn(`File ${file} is a config file without associated script.`);
        }
    }

    botConfig = config;
    bot.login(config.token);
}