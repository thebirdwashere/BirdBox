module.exports = {
    name: 'embedtest',
    description: 'this is a test of embeds',
    execute(message, args, vars) {
        const EmbedBuilder = vars.EmbedBuilder

        const newEmbed = new EmbedBuilder()
        .setColor('#d32e6b')
        .setTitle('Embed Test')
        .setAuthor({ name: 'BirdBox', iconURL: 'https://cdn.discordapp.com/avatars/803811104953466880/5bce4f0ba438015ec65f5b9cac11c8e3.webp'})
        .setDescription('who knows what this is anymore.')
        .setURL('https://www.youtube.com/watch?v=MlW7T0SUH0E')
        .addFields(
            {name: "Test 1", value: 'This is a cool field'},
            {name: "Test 2", value: 'This is another cool field'},
            {name: "Test 3", value: 'Click the blue title link to see how to make your own bot!'}
        )
        .setImage('https://cdn.discordapp.com/avatars/803811104953466880/5bce4f0ba438015ec65f5b9cac11c8e3.webp')
        .setFooter({text: 'lol get rekt this is best command'})
        message.channel.trysend({embeds: [newEmbed]});
    }


}