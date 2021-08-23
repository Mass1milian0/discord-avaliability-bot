const Discord = require("discord.js")

const client = new Discord.Client({intents: ["GUILDS","GUILD_MESSAGES"]});

const prefix = '.'

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

client.login("ODc5NDYwMDQ4MDc2NjkzNTM0.YSQC_w.H1f670zTuLYhsziELGZ818VuQT0")