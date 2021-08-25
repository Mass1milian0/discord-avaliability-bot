require('dotenv').config()

var port = process.env.PORT || 4444;

var express = require("express");

var app = express(); 

httpServer = app.listen(port,()=>{
    console.log("listening for connection to " + port)
})

app.get("/ping",(req,res)=>{
    try {
        res.status(200).send("pong!");
        return;
    } catch (err) {
        console.log(err);
        res.status(400)
        return;
    }
})

var axios = require("axios").default

const Discord = require("discord.js")

const client = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES"] });

const filter = [
    "Controller", "Cuffie", "Accessorio", "Altoparlante", "karaoke", "Arcade",
    "Decorativo", "Custodia", "Supporto", "Stand", "Adesivo", "Borsa", "Headset",
    "Copertura", "Guscio", "Ambiente", "Cover", "Volante", "Compatibile", "Chassis"
]

/**
 * @param {String} keyword keyword to quarry for
 * @param {Number} toPage the page to stop at
 * @returns promise for async
 */
function querySearchAmazon(keyword, toPage) { //keyword uses url format
    let promise = new Promise(function (resolve, reject) {
        var query = [];
        let page = 1
        var options = {
            method: 'GET',
            url: 'https://amazon-products1.p.rapidapi.com/search',
            params: { country: 'IT', query: keyword, page: page },
            headers: {
                'x-rapidapi-host': 'amazon-products1.p.rapidapi.com',
                'x-rapidapi-key': process.env.AMAZON_API_KEY
            }
        };
        for (page; page <= toPage; page++) {
            axios.request(options).then(function (response) {
                query.push(response.data)
                options.params.page = page
            }).then(function () {
                resolve(query)
            })
                .catch(function (error) {
                    console.error(error);
                    reject(error)
                })
        }
    })
    return promise
}

/**
 * clears improbable results from the query
 * @param {Array} query query containing results
 */
function queryResultClearer(query) {
    let cleanQuery = [];
    let clean = true;
    for (i of query) {
        for (res of i.results) {
            for (f of filter) {
                if (res.title.toLowerCase().includes(f.toLowerCase()) == true || res.prices.current_price < 200) {
                    clean = false
                }
            }
            if (clean == true) {
                cleanQuery.push(res)
            }
            clean = true
        }
    }
    return cleanQuery
}
/**
 * 
 * @param {Object} array array with objects to be pharsed
 */

client.on("ready", () => {
    console.log("bot is ready to roll")

    client.api.applications(client.user.id).guilds("678983995551121410").commands.post({
        data: {
            name: "ping",
            description: "risponde con pong"
        }
    })
    client.api.applications(client.user.id).guilds("678983995551121410").commands.post({
        data: {
            name: "disp_ps5",
            description: "controlla la disponibilità della ps5 su amazon (aggiungiero altri)"
        }
    })
    client.api.applications(client.user.id).guilds("678983995551121410").commands.post({
        data: {
            name: "disp_xbox",
            description: "controlla la disponibilità della disp_xbox su amazon (aggiungiero altri)"
        }
    })
    client.on('interactionCreate', async interaction => {
        if (!interaction.isCommand()) return;
        const command = interaction.commandName

        if (command == "ping") {
            interaction.reply("pong!")
        }
        if (command == "disp_ps5") {
            const timer = ms => new Promise(res => setTimeout(res, ms))
            async function loadQueryRes() {
                let cleanQueryResults = []
                for (i = 1; i < 6; i++) {
                    cleanQueryResults.push(queryResultClearer(await querySearchAmazon("ps5+console", i)))
                    await timer(1000);
                }
                return cleanQueryResults;
            }
            let promise = loadQueryRes()
            interaction.reply("ci sto lavorando")
            promise.then(function (cleanQueryResults) {
                console.log("recieved the command");
                let embed = new Discord.MessageEmbed()
                    .setColor('#dddfe9')
                    .setTitle('Ho trovato questi risultati')
                    .setURL('https://discord.js.org/')
                    .setAuthor('bot')
                    .setDescription('non sono perfetto, potrebbero esserci cose non relazionate')
                    .setTimestamp()
                    .setFooter('Suggerimenti? inviali a M1S0#0001');
                if (cleanQueryResults[0].length == 0) {
                    embed.addField("Non ci sono console disponibili", "o il bot si è rotto, oppure questa console non è in stock")
                } else {
                    for (cleanQueryResult of cleanQueryResults[0]) {
                        embed.addField(cleanQueryResult.title, cleanQueryResult.full_link)
                    }
                }
                console.log("embed construction done", embed);
                interaction.editReply({ embeds: [embed] })
            })
        }
        if(command == "disp_xbox"){
            const timer = ms => new Promise(res => setTimeout(res, ms))
            async function loadQueryRes() {
                let cleanQueryResults = []
                for (i = 1; i < 6; i++) {
                    cleanQueryResults.push(queryResultClearer(await querySearchAmazon("Xbox", i)))
                    await timer(1000);
                }
                return cleanQueryResults;
            }
            let promise = loadQueryRes()
            interaction.reply("ci sto lavorando")
            promise.then(function (cleanQueryResults) {
                console.log(cleanQueryResults);
                let embed = new Discord.MessageEmbed()
                    .setColor('#dddfe9')
                    .setTitle('Ho trovato questi risultati')
                    .setURL('https://discord.js.org/')
                    .setAuthor('bot')
                    .setDescription('non sono perfetto, potrebbero esserci cose non relazionate')
                    .setTimestamp()
                    .setFooter('Suggerimenti? inviali a M1S0#0001');
                if (cleanQueryResults[0].length == 0) {
                    embed.addField("Non ci sono console disponibili", "o il bot si è rotto, oppure questa console non è in stock")
                } else {
                    for (cleanQueryResult of cleanQueryResults[0]) {
                        embed.addField(cleanQueryResult.title, cleanQueryResult.full_link)
                    }
                }
                console.log("embed construction done", embed);
                interaction.editReply({ embeds: [embed] })
            })
        }
    })

})

client.login(process.env.DISCORD_TOKEN)