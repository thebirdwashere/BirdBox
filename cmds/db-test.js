module.exports = {
    name: 'db-test',
    description: 'testing quick.db',
    async execute(message, args, vars){
        const EmbedBuilder = vars.EmbedBuilder
        const db = vars.db
        const allowedUsers = vars.devs

        await db.init
        const msg = await db.get('board_message')
        
        if(args[0] == 'new-message') {
            if (allowedUsers.includes(message.author.id)) {
                const rawMessage = message.content.replace(`${vars.prefix}db-test ${args[0]} `, '')
                db.set('board_message', {
                content: rawMessage
            })
            message.reply('Message stored!') 
            } else {
                message.reply('You are not allowed to add new messages.')
            }
        } else {
            const newEmbed = new EmbedBuilder()
            .setColor('#d32e6b')
            .setTitle('The Maybe Pile ALPHA')
            .setAuthor({ name: 'BirdBox', iconURL: 'https://cdn.discordapp.com/avatars/803811104953466880/5bce4f0ba438015ec65f5b9cac11c8e3.png?size=256' })
            .setDescription('Pending features that may or may not happen.')
            .addFields(
                {name: "Message 1", value: msg.content}
            )
            .setFooter({text: 'Also an actually working bot.'});
            message.reply({embeds: [newEmbed]})  
        }
    }
}