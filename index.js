require('dotenv').config()

var port = process.env.PORT || 4444;

var express = require("express");

let Ebay = require("ebay-node-api");

var app = express();

let httpServer = app.listen(port, () => {
    console.log("listening for connection to " + port)
})

app.get("/ping", (req, res) => {
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

let ebay = Ebay({
    clientID: process.env.EBAY_APP_ID,
    clientSecret: process.env.EBAY_CLIENT_SECRET,
    env: "SANDBOX",
    headers: {
        // optional
        "X-EBAY-C-MARKETPLACE-ID": "EBAY_IT" // For Great Britain https://www.ebay.co.uk
    },
    body: {
        grant_type: 'client_credentials',
        //you may need to define the oauth scope
        scope: 'https://api.ebay.com/oauth/api_scope'
    }
});

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
                    //console.error(error);
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
    for (let i of query) {
        for (let res of i.results) {
            for (let f of filter) {
                if (res.title.toLowerCase().includes(f.toLowerCase()) == true || res.prices.current_price <= 200) {
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

function parseEbayDataForFilter(data) {
    let promise = new Promise(function (resolve, reject) {
        if (typeof data === 'undefined') resolve([[]])
        if (data[0].searchResult[0]["@count"] == 0) resolve([[]])
        let parsedResults = []
        let results = {
            results: [
            ]
        }
        for (let item of data[0].searchResult[0].item) {
            results.results.push(
                {   
                    title: item.title[0],
                    full_link: item.viewItemURL[0],
                    prices: {current_price: item.sellingStatus[0].currentPrice[0].__value__}
                }
            )
        }
        parsedResults.push(results);
        resolve(parsedResults)
    })
    return promise
}

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
            interaction.reply("ci sto lavorando...")
            function loadQueryRes() {
                return new Promise((resolve, reject) => {
                    let cleanQueryResults = []
                    let calls = 1;

                    let interval = setInterval(async () => {
                        console.log(calls)
                        calls += 1;
                        const result = await querySearchAmazon("ps5+console", calls); //FIXME might be broken, but gotta try again in a month, reached the montly quota, as 27/08/2021
                        cleanQueryResults.push(queryResultClearer(result))

                        if (calls === 6) {
                            clearInterval(interval)
                            resolve(cleanQueryResults)
                        }

                    }, 5000);
                });
            }
            //loadQueryRes().then(function (cleanQueryResults) {
            ebay.findItemsByKeywords('ps5').then(function (data) {
                let cleanQueryResults = [[]] //FIXME patch so you can still use the bot
                let cleanQueryResultsEbay = parseEbayDataForFilter(data)
                cleanQueryResultsEbay.then(function (ebayRes) {
                    let cleanEbayRes = [[]];
                    if (!ebayRes.length == 0) {
                        cleanEbayRes = [];
                        cleanEbayRes.push(queryResultClearer(ebayRes))
                    }
                    console.log("recieved the command");
                    let embed = new Discord.MessageEmbed()
                        .setColor('#dddfe9')
                        .setTitle('Ho trovato questi risultati')
                        .setURL('https://discord.js.org/')
                        .setAuthor('bot')
                        .setDescription('non sono perfetto, potrebbero esserci cose non relazionate')
                        .setTimestamp()
                        .setFooter('Suggerimenti? inviali a M1S0#0001');
                    if (cleanQueryResults[0].length == 0 && cleanEbayRes[0].length == 0) {
                        embed.addField("Non ci sono console disponibili", "o il bot si è rotto, oppure questa console non è in stock")
                    } else {
                        /*for (let cleanQueryResult of cleanQueryResults[0]) {
                            embed.addField(cleanQueryResult.title, cleanQueryResult.full_link)
                        }*/ //FIXME workaround for amazon quota
                        for (let cleanQueryResult of cleanEbayRes[0]) {
                            embed.addField(cleanQueryResult.title, cleanQueryResult.full_link)
                        }
                    }
                    //console.log("embed construction done", embed);
                    interaction.editReply({ embeds: [embed] })

                    setTimeout(function(){interaction.deleteReply()},5000)
                })
            })
            //}, (error) => {
            //console.log(error);
            //});
        }
        if (command == "disp_xbox") {
            if (command == "disp_ps5") {
                interaction.reply("ci sto lavorando...")
                function loadQueryRes() {
                    return new Promise((resolve, reject) => {
                        let cleanQueryResults = []
                        let calls = 1;
    
                        let interval = setInterval(async () => {
                            console.log(calls)
                            calls += 1;
                            const result = await querySearchAmazon("ps5+console", calls); //FIXME might be broken, but gotta try again in a month, reached the montly quota, as 27/08/2021
                            cleanQueryResults.push(queryResultClearer(result))
    
                            if (calls === 6) {
                                clearInterval(interval)
                                resolve(cleanQueryResults)
                            }
    
                        }, 5000);
                    });
                }
                //loadQueryRes().then(function (cleanQueryResults) {
                ebay.findItemsByKeywords('xbox').then(function (data) {
                    let cleanQueryResults = [[]] //FIXME patch so you can still use the bot
                    let cleanQueryResultsEbay = parseEbayDataForFilter(data)
                    cleanQueryResultsEbay.then(function (ebayRes) {
                        let cleanEbayRes = [[]];
                        if (!ebayRes.length == 0) {
                            cleanEbayRes = [];
                            cleanEbayRes.push(queryResultClearer(ebayRes))
                        }
                        console.log("recieved the command");
                        let embed = new Discord.MessageEmbed()
                            .setColor('#dddfe9')
                            .setTitle('Ho trovato questi risultati')
                            .setURL('https://discord.js.org/')
                            .setAuthor('bot')
                            .setDescription('non sono perfetto, potrebbero esserci cose non relazionate')
                            .setTimestamp()
                            .setFooter('Suggerimenti? inviali a M1S0#0001');
                        if (cleanQueryResults[0].length == 0 && cleanEbayRes[0].length == 0) {
                            embed.addField("Non ci sono console disponibili", "o il bot si è rotto, oppure questa console non è in stock")
                        } else {
                            /*for (let cleanQueryResult of cleanQueryResults[0]) {
                                embed.addField(cleanQueryResult.title, cleanQueryResult.full_link)
                            }*/ //FIXME workaround for amazon quota
                            for (let cleanQueryResult of cleanEbayRes[0]) {
                                embed.addField(cleanQueryResult.title, cleanQueryResult.full_link)
                            }
                        }
                        //console.log("embed construction done", embed);
                        interaction.editReply({ embeds: [embed] })
    
                        setTimeout(function(){interaction.deleteReply()},5000)
                    })
                })
                //}, (error) => {
                //console.log(error);
                //});
            }
        }
    })

})

client.login(process.env.DISCORD_TOKEN)