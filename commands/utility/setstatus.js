const { SlashCommandBuilder, ActivityType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
		.setName('setstatus')
		.setDescription('Set the status of the bot.')
        .addStringOption(option =>
			option
				.setName('status')
				.setDescription('Status that you want the bot to display.')
                .setMaxLength(128)
				.setRequired(true)
        ),
    async execute(interaction, {embedColors, devs, db}) {

        const authorized = devs.developer.map(item => item.userId); authorized.push(devs.host[0].userId);
        if (!authorized.includes(interaction.user.id)) interaction.reply({ content: 'Sorry, you must be a dev to use the setstatus command.', ephemeral: true });

        const status = interaction.options.getString('status');
        db.set("status", status);

        interaction.client.user.setPresence({ activities: [{ name: status, type: ActivityType.Custom }] });
        await interaction.reply({ content: `Set status successfully: "${status}"`, ephemeral: true });
        
    }
}