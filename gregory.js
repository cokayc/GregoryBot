const config = require("./assets/settings.json");
const mysql = require('mysql');
const Discord = require('discord.js')
const client = new Discord.Client()

var con = mysql.createConnection({
  host: config.mysql.host,
  user: config.mysql.user,
  password: config.mysql.password,
  database: config.mysql.database,
});

con.connect(function(err) {
  if (err) throw err;

client.on("ready", () => {
  // this event will run if the bot starts, and logs in, successfully.
  console.log(`Connected as ${client.user.tag}, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`);
  client.user.setActivity(`on ${client.guilds.size} servers`);
});

client.on("guildCreate", guild => {
  // this event triggers when the bot joins a guild.
  console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
  client.user.setActivity(`on ${client.guilds.size} servers`);
});

client.on("guildDelete", guild => {
  // this event triggers when the bot is removed from a guild.
  console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
  client.user.setActivity(`on ${client.guilds.size} servers`);
});

client.on("message", async message => {
  // this event will run on every single message received, from any channel or DM.

  // ignores other bots
  if(message.author.bot) return;

  if(message.content === "t!dailies") {
    const toad = client.emojis.find("name", "toad");
    message.react(toad);
    return;
  }

  if(message.content === "@anyone") {
    message.channel.send(`${message.guild.members.random()}`);
    return;
  }

  // ignores messages with incorrect prefix
  if(message.content.indexOf(`+`) !== 0) return;

  const args = message.content.slice(1).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  if(command === "help") {
    message.channel.send('Hi, this is Zawghu\'s personal discord bot! Here are its commands:\n' +
                         '\n 1. Basic: `help` `ping` `say` `listemojis` `setactivity`' +
                         '\n 2. Fun: `points` `ranking` `@anyone` `yoshi`'+
                         '\n 3. Secret: `???`');
  }

  if(command === "ping") {
    const m = await message.channel.send("Ping?");
    m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms`);
  }

  if(command === "say") {
    const sayMessage = args.join(" ");
    message.delete().catch(O_o=>{});
    message.channel.send(sayMessage);
  }

  if(command === "listemojis") {
    const emojiList = message.guild.emojis.map(e=>e.toString()).join(" ");
    if (emojiList.length > 0) {
      message.channel.send(emojiList);
    } else {
      message.channel.send("No custom emojis found!");
    }
  }

  if(command === "anyone") {
    console.log(`${message.guild.members.random()}`);
    message.channel.send(`${message.guild.members.random()}`);
  }

  if(command === "setactivity") {
    const newActivity = args.join(" ");
    client.user.setActivity(`${newActivity}`);
  }

  if(command === "yoshi") {
    const yoshi = client.emojis.find("name", "yoshi");
    const joinedMessage = args.join(" ");
    var num = parseInt(joinedMessage);
    if (!(num < 20 && num > 0)) {
      if (num > 20) {
        message.channel.send('Too many yoshters!');
      } else {
        message.channel.send(`${yoshi}`);
      }
      num = 0;
    }
    var timeout;
    timeout = setInterval (function() {
         if (num <= 0) {
           clearInterval(timeout);
         } else {
           message.channel.send(`${yoshi}`);
           num--;
         }
    }, 2000);
  }

  if(command === "points") {
    //figures out user, id, and # of points to add
    var name = message.mentions;
    var cid = 0;
    var points = parseInt(args[1]);
    var user = message.author;
    if(typeof name.users.first() === "undefined") {
      cid = message.author.id;
      points = parseInt(args[0]);
    } else {
      cid = name.users.first().id;
      user = name.users.first();
    }
    con.query(`SELECT id FROM users WHERE id = ${cid}`, function (err, result) {
      if (err) throw err;
      if(points) {
        if (result === undefined || result.length == 0) {
          con.query(`INSERT INTO users (id, points, username) VALUES ('${cid}', '${points}', '${user.username}')`, function (err, result) {
            if (err) throw err;
          });
          message.channel.send(`${user} has ${points} points`);
        } else {
          con.query(`UPDATE users SET points = points + ${points} WHERE id = ${cid}`);
          con.query(`SELECT points FROM users WHERE id = ${cid}`, function (err, result) {
            if (err) throw err;
            message.channel.send(`${user} has ${result[0].points} points`);
          });
        }
      } else {
        if (result === undefined || result.length == 0) {
          con.query(`INSERT INTO users (id, points, username) VALUES ('${cid}', '0', '${user.username}')`, function (err, result) {
            if (err) throw err;
          });
          message.channel.send(`${user} has 0 points`);
        }
        else {
          con.query(`SELECT points FROM users WHERE id = ${cid} limit 1`, function (err, result) {
            if (err) throw err;
            message.channel.send(`${user} has ${result[0].points} points`);
          });
        }
      }
    });
  }

  if(command === "ranking") {
    var members = message.guild.members.array();
    var rankedMember;
    var rankedMembers = [];
    con.query(`SELECT * FROM users`,  function (err, result) {
      if (err) throw err;
      var ids = [];
      for (var i = 0; i < members.length; i++) {
        ids[i] = parseInt(members[i].id);
      }
      for (var j = 0; j < result.length; j++) {
        if (ids.includes(result[j].id)) {
          rankedMember = {name: result[j].username, points: result[j].points};
          rankedMembers.push(rankedMember);
        }
      }
      rankedMembers.sort((a,b) => (a.points < b.points) ? 1 : (a.points > b.points) ? -1 : 0);
      var ranking = `\`Ranking: \n`;
      for (var k = 0; k < rankedMembers.length; k++) {
        ranking += `${rankedMembers[k].name}: ${rankedMembers[k].points}\n`;
      }
      ranking += `\``;
      message.channel.send(ranking);
    });
  }
});

});

client.login(config.token)
