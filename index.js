require('dotenv').config()

var axios = require("axios").default

const Discord = require("discord.js")

const client = new Discord.Client({intents: ["GUILDS","GUILD_MESSAGES"]});

const filter = [
    "Controller","Cuffie","Accessorio","Altoparlante","karaoke","Arcade",
    "Decorativo","Custodia","Supporto","Stand","Adesivo","Borsa","Headset",
    "Copertura","Guscio","Ambiente","Cover","Volante","Compatibile","Chassis"
]

/**
 * @param {String} keyword keyword to quarry for
 * @param {Number} toPage the page to stop at
 * @param {Function} callback callback for async
 */
function querySearchAmazon(keyword,toPage,callback){ //keyword uses url format
    var query = [];
    let page = 1
    var options = {
        method: 'GET',
        url: 'https://amazon-products1.p.rapidapi.com/search',
        params: {country: 'IT', query: keyword, page: page},
        headers: {
          'x-rapidapi-host': 'amazon-products1.p.rapidapi.com',
          'x-rapidapi-key': process.env.AMAZON_API_KEY
        }
      };
    for(page;page <= toPage;page++){
        axios.request(options).then(function (response) {
            query.push(response.data)
            options.params.page = page
        }).then(function(){
            callback(query)
        })
        .catch(function (error) {
            console.error(error);
        })
    }
}

/**
 * clears improbable results from the query
 * @param {Array} query query containing results
 */
function queryResultClearer(query){
    let cleanQuery = [];
    let clean = true;
    for(i of query){
        for(res of i.results){
            for(f of filter){
                if(res.title.toLowerCase().includes(f.toLowerCase()) == true || res.prices.current_price < 200){
                    clean = false
                }
            }
            if(clean == true){
                cleanQuery.push(res)
            }
            clean = true
        }
    }
    return cleanQuery
}

/*
querySearchAmazon("ps5+console",1,function(query){
    console.log(queryResultClearer(query))
})
*/

client.on("ready",()=>{
    console.log("bot is ready to roll")
    
    client.api.applications(client.user.id).guilds("678983995551121410").commands.post({
        data: {
            name: "ping",
            description: "risponde con pong"
        }
    })

    client.ws.on("INTERACTION_CREATE", async interaction =>{
        const command = interaction.data.name.toLowerCase()
        const args = interaction.data.options

        if(command == "ping"){
            client.api.interactions(interaction.id,interaction.token).callback.post({
                data: {
                    type: 4,
                    data:{
                        content:"Pong!"
                    }
                }
            })
        }
    })
    
})

client.login(process.env.DISCORD_TOKEN)