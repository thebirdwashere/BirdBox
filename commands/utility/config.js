const {
	SlashCommandBuilder,
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
	ComponentType,
	ChannelSelectMenuBuilder,
	ChannelType,
	UserSelectMenuBuilder,
	RoleSelectMenuBuilder,
	MentionableSelectMenuBuilder,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
} = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("config")
		.setDescription("Configures server and client settings.")
		.addStringOption((option) =>
			option
				.setName("scope")
				.setDescription(
					"What class of settings you would like to modify."
				)
				.addChoices(
					{ name: "user", value: "user" },
					{ name: "server", value: "server" },
					{ name: "bot", value: "bot" }
				)
		)
		.addStringOption((option) =>
			option
				.setName("name")
				.setDescription(
					"The name of the setting you would like to modify."
				)
				.setAutocomplete(true)
		),
	async autocomplete(interaction) {
		const options =
			getConfigOptions()[
				interaction.options?.getString("scope") ?? "user"
			];
		const choices = Object.keys(options).map((key) => key);

		const focusedOption = interaction.options.getFocused(true);
		const value =
			focusedOption.value.charAt(0).toUpperCase() +
			focusedOption.value.slice(1);
		let filtered = choices.filter((choice) => choice.startsWith(value));
		filtered = filtered.map((choice) => ({ name: choice, value: choice }));
		filtered = filtered.slice(0, 25);

		await interaction.respond(filtered);
	},
	async execute(interaction, { embedColors, prefix, db, admins, client }) {
		admins = admins.map((item) => item.userId);

		const scope = interaction.options?.getString("scope") ?? "user";
		const name = interaction.options?.getString("name") ?? "default";

		// Reject the user if they are not included in the devs list.
		if (scope == "server" && !admins.includes(interaction.user.id))
			return interaction.reply({
				content:
					"sorry, you must be a birdbox admin to modify server settings",
				ephemeral: true,
			});

		// Reject the user if the configuration option does not exist.
		if (!getConfigOptions()[scope][name] && !("default" === name))
			return await interaction.reply(
				"The requested setting option does not exist. Please try again."
			);

		const response = await interaction.reply({
			embeds: await updateEmbed(prefix, scope, name),
			components: await updateRow(interaction, db, scope, name),
		});

		const filter = (i) => i.user.id === interaction.user.id;

		/* RESPOND TO BUTTONS */
		const buttonCollector = response.createMessageComponentCollector({
			componentType: ComponentType.Button,
			time: 3_600_000,
			filter,
		});

		buttonCollector.on("collect", async (interaction) => {
			if (interaction.customId === "modal") {
				await customModal(interaction);
				await interaction.deferUpdate();
				return;
			}

			setSetting(
				interaction,
				db,
				getConfigOptions()[scope][name],
				interaction.customId
			);
		});

		/* RESPOND TO SELECTS */
		const selectCollector = response.createMessageComponentCollector({
			componentType: ComponentType.StringSelect,
			time: 3_600_000,
			filter,
		});

		selectCollector.on("collect", async (interaction) => {
			const nameCollect = interaction.values[0];
			await interaction.deferUpdate();

			if (interaction.customId == "settingSelect") {
				await interaction.message.edit({
					embeds: await updateEmbed(prefix, scope, nameCollect),
					components: await updateRow(
						interaction,
						db,
						scope,
						nameCollect
					),
					content: `setting_${nameCollect}_${interaction.user.id}`,
				});
			} else if (interaction.customId == "settingOptionsSelect") {
				console.log(nameCollect);
			}
		});
	},
};

/* CONFIG OPTIONS */

function getConfigOptions(prefix) {
	return {
		user: {
			notifs: {
				name: "Notifications",
				desc: "Change where bot notifications show up. \nDefaults to reply if not set.",
				displayOptionsAs: "toggle",
				default: "disable",
				value: "notifs",
			},
			buttonTest: {
				name: "Multi-Button Test",
				desc: "lorem ipsum",
				displayOptionsAs: "buttons",
				options: [
					{ name: "test1", value: "test1" },
					{ name: "test2", value: "test2" },
					{ name: "test3", value: "test3" },
				],
				value: "buttonTest",
			},
			selTest: {
				name: "String Select Test",
				desc: "lorem ipsum",
				displayOptionsAs: "select",
				options: [
					{ name: "test1", value: "test1" },
					{ name: "test2", value: "test2" },
					{ name: "test3", value: "test3" },
				],
				value: "selTest",
			},
			channelTest: {
				name: "Channel Select Test",
				desc: "lorem ipsum",
				displayOptionsAs: "channel",
				value: "channelTest",
			},
			userTest: {
				name: "User Select Test",
				desc: "lorem ipsum",
				displayOptionsAs: "user",
				value: "userTest",
			},
			mentionableTest: {
				name: "Mentionable Select Test",
				desc: "lorem ipsum",
				displayOptionsAs: "mentionable",
				value: "mentionableTest",
			},
			roleTest: {
				name: "Role Select Test",
				desc: "lorem ipsum",
				displayOptionsAs: "role",
				value: "roleTest",
			},
			modalTest: {
				name: "Modal Test",
				desc: "lorem ipsum",
				displayOptionsAs: "modal",
				options: [
					// TODO: Each object within this array should be parsed as a text thingy within a row and added to the modal.
					{
						name: "test1",
						type: "short",
						placeholder: "test1",
						value: "test1",
					},
					{
						name: "test2",
						type: "paragraph",
						placeholder: "test2",
						value: "test2",
					},
				],
				value: "modalTest",
			},
			errorTest: {
				name: "Error Test",
				desc: "lorem ipsum",
				displayOptionsAs: "",
				value: "errorTest",
			},
		},
		server: {
			notifs: {
				name: "Notifications Channel",
				desc: "Change the channel notification logs are sent to. \nIf not set, logs will be disabled.",
				value: "notifs",
			},
		},
		bot: {
			notifs: {
				name: "Test",
				desc: "Testing",
				value: "notifs",
			},
		},
	};
}

/* UTIL FUNCTIONS */

async function updateEmbed(prefix, scope, name) {
	// Returns an updated embed on request.

	let configEmbed = new EmbedBuilder()
		.setColor(0xffffff)
		.setTitle(`${scope.charAt(0).toUpperCase() + scope.slice(1)} Settings`)
		.setFooter({ text: "Made by TheBirdWasHere, with help from friends." });

	if (name == "default") {
		configEmbed.setDescription("Use the menu below to select a setting.");
	} else {
		configEmbed.setDescription(
			`**${getConfigOptions()[scope][name].name}**\n ${
				getConfigOptions()[scope][name].desc
			}`
		);
	}

	return [configEmbed];
}

async function updateRow(interaction, db, scope, name) {
	// Returns an updated row on request.

	/* STRINGSELECT ROW */

	const choices = Object.entries(getConfigOptions()[scope]).map((item) => [
		item[1].value,
		item[1].name,
	]);

	const settingSelect = new StringSelectMenuBuilder()
		.setCustomId("settingSelect")
		.setPlaceholder("Select setting...");

	choices.map((item) => {
		settingSelect.addOptions([
			new StringSelectMenuOptionBuilder()
				.setLabel(item[1])
				.setValue(item[0]),
		]);
	});

	const configSelectRow = new ActionRowBuilder().addComponents(settingSelect);

	if (name == "default") return [configSelectRow];

	/* BUTTON ROW */

	const configButtonRow = new ActionRowBuilder();

	await (
		await optionsBuilder(interaction, db, scope, name)
	).map((item) => {
		configButtonRow.addComponents(item);
	});

	/* LET 'ER RIP */

	return [configSelectRow, configButtonRow];
}

async function optionsBuilder(interaction, db, scope, name) {
	const currentSetting = getConfigOptions()[scope][name];
	const displayOptionsAs = currentSetting.displayOptionsAs; // Get preset option

	switch (
		displayOptionsAs // Switch by preset option  - TODO IN FUTURE: ADD OPTION FOR ADDING CUSTOM MULTI-ROW OPTIONS
	) {
		case "toggle":
			let disableButton = new ButtonBuilder()
				.setCustomId("disable")
				.setLabel("Disable")
				.setStyle(ButtonStyle.Danger)
				.setDisabled(
					(await getSetting(interaction, db, currentSetting)) !=
						"disable"
				);
			let enableButton = new ButtonBuilder()
				.setCustomId("enable")
				.setLabel("Enable")
				.setStyle(ButtonStyle.Success)
				.setDisabled(
					(await getSetting(interaction, db, currentSetting)) !=
						"enable"
				);

			console.log(await getSetting(interaction, db, currentSetting));

			return [disableButton, enableButton];

		case "buttons":
			let buttonArray = [];

			getConfigOptions()[scope][name].options.map((item) => {
				buttonArray.push(
					new ButtonBuilder()
						.setCustomId(item.value)
						.setLabel(item.name)
						.setStyle(ButtonStyle.Primary)
				);
			});

			return buttonArray;

		case "select":
			let settingOptionsSelect = new StringSelectMenuBuilder()
				.setCustomId("settingOptionsSelect")
				.setPlaceholder("Select option...");

			getConfigOptions()[scope][name].options.map((item) => {
				settingOptionsSelect.addOptions([
					new StringSelectMenuOptionBuilder()
						.setLabel(item.name)
						.setValue(item.value),
				]);
			});

			return [settingOptionsSelect];

		case "channel":
			let channelSelect = new ChannelSelectMenuBuilder()
				.setCustomId(`channelSelect`)
				.setChannelTypes(ChannelType.GuildText)
				.setPlaceholder("Select channel...");

			return [channelSelect];

		case "user":
			let userSelect = new UserSelectMenuBuilder()
				.setCustomId(`userSelect`)
				.setPlaceholder("Select user...");

			return [userSelect];

		case "role":
			let roleSelect = new RoleSelectMenuBuilder()
				.setCustomId(`roleSelect`)
				.setPlaceholder("Select role...");

			return [roleSelect];

		case "mentionable":
			let mentionableSelect = new MentionableSelectMenuBuilder()
				.setCustomId(`mentionableSelect`)
				.setPlaceholder("Select mentionable...");

			return [mentionableSelect];

		case "modal":
			let modalButton = new ButtonBuilder()
				.setCustomId("modal")
				.setLabel("Open Modal")
				.setStyle(ButtonStyle.Primary);

			return [modalButton];
	}

	return [
		new ButtonBuilder()
			.setCustomId("error")
			.setLabel("ERROR FETCHING OPTIONS")
			.setStyle(ButtonStyle.Danger)
			.setDisabled(true),
	];
}

async function customModal(interaction) {
	const modal = new ModalBuilder()
		.setCustomId("modal")
		.setTitle("Modal Test");

	const favoriteColorInput = new TextInputBuilder()
		.setCustomId("favoriteColorInput")
		.setLabel("What's your favorite color?")
		.setStyle(TextInputStyle.Short);

	const hobbiesInput = new TextInputBuilder()
		.setCustomId("hobbiesInput")
		.setLabel("What's some of your favorite hobbies?")
		.setStyle(TextInputStyle.Paragraph);

	const firstActionRow = new ActionRowBuilder().addComponents(
		favoriteColorInput
	);
	const secondActionRow = new ActionRowBuilder().addComponents(hobbiesInput);

	modal.addComponents(firstActionRow, secondActionRow);
	await interaction.showModal(modal);
}

async function setSetting(interaction, db, setting, value) {
	await db.set(`setting_${setting.value}_${interaction.user.id}`, value);
}

async function getSetting(interaction, db, setting) {
	let settingValue = await db.get(
		`setting_${setting.value}_${interaction.user.id}`
	);

	if (!settingValue) return setting.default;
	return settingValue;
}
