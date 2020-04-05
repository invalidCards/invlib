import fs from "fs";
import path from "path";
import arp from "app-root-path";
import Discord from "discord.js";

const bot = new Discord.Client();
var botConfig;

bot.once("ready", () => {
    console.log(`Bot ready at ${(new Date()).toUTCString()}, serving ${bot.guilds.cache.size} guilds with ${bot.channels.cache.size} channels and ${bot.users.cache.size} users.`);
});

bot.on("raw", packet => {
    if (["HELLO", "READY", "RESUMED", "RECONNECT", "INVALID_SESSION"].includes(packet.t)) {
        return; //These are internal events, and no functionality should be hooked into them through raw events
    }

    for (let file of fs.readdirSync(path.join(arp.toString(), "functions")).filter(file => file.endsWith(".ic"))) {
        fs.readFile(path.join(arp.toString(), "functions", file), (err, data) => {
            if (err) {
                console.error(`Internal error: ${err.message}`)
            } else {
                try {
                    let config = JSON.parse(data);
                    if (config.command && packet.t === "MESSAGE_CREATE" && packet.d.type === 0 && packet.d.content.startsWith(botConfig.prefix + file.split(".")[0])) {
                        let args = packet.d.content.split(" ");
                        args.shift();
                        rnc(path.join(arp.toString(), "functions", file.split(".")[0] + ".js")).execute(bot, packet, args);
                    } else if (!config.command && config.events.includes(packet.t)) {
                        rnc(path.join(arp.toString(), "functions", file.split(".")[0] + ".js")).execute(bot, packet);
                    }
                } catch {
                    console.warn(`Error parsing ${file} to JSON, skipping`);
                }
            }
        });
    }
});

function rnc(module) {
    delete require.cache[require.resolve(module)];
    return require(module);
}

export function run(config) {
    if (!config.token || !config.prefix) {
        console.error("The supplied configuration is missing either the bot token or the prefix! This is a fatal error, terminating.");
        process.exit(-1);
    }

    for (let file of fs.readdirSync(path.join(arp.toString(), "functions"))) {
        if (file.endsWith(".js") && !fs.existsSync(path.join(arp.toString(), "functions", file.split(".")[0] + ".ic"))) {
            console.warn(`File ${file} does not have an associated .ic (config) file, and its functionality will never run.`);
        } else if (file.endsWith(".ic") && !fs.existsSync(path.join(arp.toString(), "functions", file.split(".")[0] + ".js"))) {
            console.warn(`File ${file} is a config file without associated script.`);
        }
    }

    botConfig = config;
    bot.login(config.token);
}