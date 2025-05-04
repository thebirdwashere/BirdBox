const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
		.setName('echo')
		.setDescription('BirdBox replicates a custom message. Not too useful, but certainly fun!')
        .addStringOption(option =>
			option
				.setName('message')
				.setDescription('The message to echo.')
                .setMaxLength(1000)
				.setRequired(true)
        )
        .addBooleanOption(option =>
            option
                .setName('reply')
                .setDescription('Whether or not the bot should reply to your message.')
        ),
    async execute(interaction) {

        const message = interaction.options.getString('message');
        const reply = interaction.options.getBoolean('reply') ?? true;

        if (reply) {
            await interaction.reply(message);
        } else {
            await interaction.channel.send(message);
            await interaction.reply({ content: 'echoing...', ephemeral: true });
            await interaction.deleteReply(); // Janky but it's the best I can do, discord.js doesn't have an inbuilt interaction ender.
        }

    },
    async executeClassic({message, args, strings}) {

        if (strings[0]?.length > 1000) return await message.reply("bruh do you really expect me to say allat");

        if (args[0] !== 'noreply') {
            await message.reply(strings[0] || 'you need to enter an echo message surrounded by quotes');
        } else {
            await message.channel.send(strings[0] || 'you need to enter an echo message surrounded by quotes');
            await message.delete();
        }

    }
}