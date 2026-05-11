import { Command, CommandOption } from "src/utility/command.js";
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ChannelSelectMenuBuilder, ChannelType, ComponentType, EmbedBuilder, MentionableSelectMenuBuilder, MessageActionRowComponentBuilder, MessageComponentInteraction, ModalBuilder, ModalSubmitInteraction, RoleSelectMenuBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, TextInputBuilder, TextInputStyle, UserSelectMenuBuilder 
} from "discord.js";
import config from "src/data/config.json" with { type: "json" };
import { Config, ConfigOptions, ConfigScope } from "src/utility/types.js";
import { Database } from "src/utility/database.js";
import { getAdminIds } from "src/utility/utility.js";

const CONFIG = config as Config;

const NO_DEFAULT_SELECTION = "NO_DEFAULT_SELECTION";

const Config = new Command({
  name: "config",
  description: "Configures user, server, and global settings.",
  options: [
    new CommandOption({
      name: "scope",
      description: "What level you plan to modify. If not set, defaults to \"user\".",
      type: "string",
      optional: true,
      choices: ["user", "server", "bot"],
    }),
    new CommandOption({
      name: "name",
      description: "The name of the setting you would like to modify.",
      type: "string",
      optional: true,
      autocomplete: true,
    }),
  ],
  autocomplete: async (ctx) => {
    const scopeSelection = ctx.interaction.options.get("scope")?.value?.toString();
    const scope = (scopeSelection ?? "user") as ConfigScope;
    await ctx.respond(Object.values(CONFIG[scope]));
  },
  execute: async (ctx, opts) => {
    //MARK: setup

    const scope = (opts.string.get("scope") ?? "user") as ConfigScope;
    let name = opts.string.get("name") ?? NO_DEFAULT_SELECTION;

    // Reject the user if the configuration option does not exist.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!CONFIG[scope][name] && name !== NO_DEFAULT_SELECTION) {
      await ctx.reply("thats not a setting lol, try again");
      return;
    }

    const adminIds = getAdminIds();

    // Reject the user if they are illegitimately modifying bot config.
    if (scope === "bot" && !adminIds.includes(ctx.user.id)) {
      await ctx.reply("sorry, you must be a BirdBox admin to modify those settings");
      return;
    }
    
    if (scope === "server") {
      // Reject the user if they are illegitimately modifying server config.
      if (ctx.guild === null) {
        await ctx.reply("lol you cant change server config outside a server");
        return;
      }

      const guildMember = await ctx.guild.members.fetch(ctx.user.id);
      const hasManageRoles = guildMember.permissions.has("ManageRoles");
      
      if (!hasManageRoles && !adminIds.includes(ctx.user.id)
      ) {
        await ctx.reply("sorry, you need the Manage Roles permission to modify server config");
        return;
      }
    }

    const settingId = scope === "user" ? ctx.user.id : ctx.guild?.id;

    const response = await ctx.reply({
      embeds: [updateEmbed(scope, name)],
      components: await updateRow(settingId, ctx.db, scope, name),
    });

    const filter = (i: MessageComponentInteraction): boolean => i.user.id === ctx.user.id;

    //MARK: button response
    const buttonCollector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 3_600_000,
      filter,
    });

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    buttonCollector.on("collect", async (i) => {
      if (i.customId === "modal") {
        await customModal(i, CONFIG[scope][name]);

        const filter = (i2: ModalSubmitInteraction): boolean => i2.user.id === i.user.id;

        i.awaitModalSubmit({ time: 3_600_000, filter })
          .then(async (i2) => {
            const submittedValue = i2.fields.components[0].components[0].value;

            const MAX_DISPLAY_LENGTH = 25;

            const shortenedSubmit = submittedValue.length > MAX_DISPLAY_LENGTH ? submittedValue.substring(0, 25) + "..." : submittedValue;
            await i2.reply(`Config option set to "${shortenedSubmit}"!`);

            setSetting(scope, i.user.id, ctx.db, CONFIG[scope][name], submittedValue);
          })
          .catch(async () => {await i.followUp("Modal submit timed out.");});
        
        return;
      }

      await i.deferUpdate();

      const settingId = scope == "user" ? i.user.id : i.guild?.id;
      setSetting(scope, settingId, ctx.db, CONFIG[scope][name], i.customId);
      await response.edit({components: await updateRow(settingId, ctx.db, scope, name)});
    });

    //MARK: selector response
    const selectCollector = response.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 3_600_000,
      filter,
    });

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    selectCollector.on("collect", async (i) => {
      const collectedValue = i.values[0];
      await i.deferUpdate();

      if (i.customId == "settingSelect") {
        name = collectedValue;

        const settingId = scope == "user" ? ctx.user.id : ctx.guild?.id;
        await i.message.edit({
          embeds: [updateEmbed(scope, collectedValue)],
          components: await updateRow(settingId, ctx.db, scope, collectedValue),
        });

      } else if (i.customId == "settingOptionsSelect") {
        await i.deferUpdate();

        const settingId = scope == "user" ? i.user.id : i.guild?.id;
        setSetting(scope, settingId, ctx.db, CONFIG[scope][name], collectedValue);
      }
    });
    
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    selectCollector.on("end", async () => {
      await response.edit({ components: [] });
    });

    //MARK: channel responses
    const channelCollector = response.createMessageComponentCollector({
      componentType: ComponentType.ChannelSelect,
      time: 3_600_000,
      filter,
    });

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    channelCollector.on("collect", async (i) => {
      const collectedValue = i.values[0];
      await i.deferUpdate();

      const settingId = scope == "user" ? i.user.id : i.guild?.id;
      setSetting(scope, settingId, ctx.db, CONFIG[scope][name], collectedValue);
    });

    //MARK: mention responses
    const MentionableCollector = response.createMessageComponentCollector({
      componentType: ComponentType.MentionableSelect,
      time: 3_600_000,
      filter,
    });

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    MentionableCollector.on("collect", async (i) => { 
      const collectedValue = i.values[0];
      await i.deferUpdate();

      const settingId = scope == "user" ? i.user.id : i.guild?.id;
      setSetting(scope, settingId, ctx.db, CONFIG[scope][name], collectedValue);
    });

    //MARK: role responses
    const RoleCollector = response.createMessageComponentCollector({
      componentType: ComponentType.RoleSelect,
      time: 3_600_000,
      filter,
    });

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    RoleCollector.on("collect", async (i) => { 
      const collectedValue = i.values[0];
      await i.deferUpdate();

      const settingId = scope == "user" ? i.user.id : i.guild?.id;
      setSetting(scope, settingId, ctx.db, CONFIG[scope][name], collectedValue);
    });

    //MARK: user responses
    const UserCollector = response.createMessageComponentCollector({
      componentType: ComponentType.UserSelect,
      time: 3_600_000,
      filter,
    });

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    UserCollector.on("collect", async (i) => { 
      const collectedValue = i.values[0];
      await i.deferUpdate();

      const settingId = scope == "user" ? i.user.id : i.guild?.id;
      setSetting(scope, settingId, ctx.db, CONFIG[scope][name], collectedValue);
    });
  },
});

export default Config;

/* UTIL FUNCTIONS */
function updateEmbed(scope: ConfigScope, name: string): EmbedBuilder { //MARK: update embed
  // Returns an updated embed on request.
  const configEmbed = new EmbedBuilder()
    .setColor(0xffffff)
    .setTitle(`${scope.charAt(0).toUpperCase() + scope.slice(1)} Config`)
    .setFooter({ text: "Made by TheBirdWasHere, with help from friends." });
  
  if (name == NO_DEFAULT_SELECTION) {
    configEmbed.setDescription("Use the menu below to select a setting.");
  } else {
    configEmbed.setDescription(
      `**${CONFIG[scope][name].name}**\n ${CONFIG[scope][name].desc
      }`
    );
  }

  return configEmbed;
}

//MARK: update row
async function updateRow<T extends ConfigScope>(
  id: string | undefined, 
  db: Database, 
  scope: T, 
  name: keyof Config[T]
): Promise<
  [ActionRowBuilder<StringSelectMenuBuilder>, ActionRowBuilder<MessageActionRowComponentBuilder>] 
  | [ActionRowBuilder<StringSelectMenuBuilder>]
> {
  // Returns an updated row on request.

  /* STRINGSELECT ROW */
  const choices = Object.entries(CONFIG[scope]).map((item) => [
    item[1].value,
    item[1].name,
  ]);

  const settingSelect = new StringSelectMenuBuilder()
    .setCustomId("settingSelect")
    .setPlaceholder("Select a setting...");
  choices.forEach((item) => {
    settingSelect.addOptions([
      new StringSelectMenuOptionBuilder()
        .setLabel(item[1])
        .setValue(item[0]),
    ]);
  });

  const configSelectRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(settingSelect);
  if (name == NO_DEFAULT_SELECTION) return [configSelectRow];

  /* BUTTON ROW */
  const configOptionsRow = new ActionRowBuilder<MessageActionRowComponentBuilder>();
  const optionsList = await optionsBuilder(id, db, scope, name);

  optionsList.forEach((item) => {
    configOptionsRow.addComponents(item);
  });

  /* LET 'ER RIP */
  return [configSelectRow, configOptionsRow];
}

//MARK: options builder
async function optionsBuilder<ScopeType extends ConfigScope>(
  id: string | undefined, 
  db: Database, 
  scope: ScopeType, 
  name: keyof Config[ScopeType],
): Promise<MessageActionRowComponentBuilder[]> {
  const currentSetting = CONFIG[scope][name];
  const currentSelection = await getSetting(scope, id, db, currentSetting);
  
  // Switch by preset option  
  //TODO: IN FUTURE ADD OPTION FOR ADDING CUSTOM MULTI-ROW OPTIONS
  switch (currentSetting.displayOptionsAs) { 
  case "toggle": { 
    const disableButton = new ButtonBuilder()
      .setCustomId("disable")
      .setLabel("Disable")
      .setStyle(ButtonStyle.Danger)
      .setDisabled(currentSelection == "disable");
    const enableButton = new ButtonBuilder()
      .setCustomId("enable")
      .setLabel("Enable")
      .setStyle(ButtonStyle.Success)
      .setDisabled(currentSelection == "enable");
    return [disableButton, enableButton]; 
  } case "buttons": {
    const buttonArray: ButtonBuilder[] = [];
    currentSetting.options.forEach((item) => {
      buttonArray.push(
        new ButtonBuilder()
          .setCustomId(item.value)
          .setLabel(item.name)
          .setStyle(ButtonStyle.Primary)
          .setDisabled(currentSelection == item.value)
      );
    });
    return buttonArray;
  } case "select": { 
    const settingOptionsSelect = new StringSelectMenuBuilder()
      .setCustomId("settingOptionsSelect")
      .setPlaceholder("Select an option...");
    currentSetting.options.forEach((item) => {
      settingOptionsSelect.addOptions([
        new StringSelectMenuOptionBuilder()
          .setLabel(item.name)
          .setValue(item.value),
      ]);
    });
    return [settingOptionsSelect];
  } case "channel": {
    const channelSelect = new ChannelSelectMenuBuilder()
      .setCustomId("channelSelect")
      .setChannelTypes(ChannelType.GuildText)
      .setPlaceholder("Select a channel...");
    return [channelSelect];
  } case "user": {
    const userSelect = new UserSelectMenuBuilder()
      .setCustomId("userSelect")
      .setPlaceholder("Select a user...");
    return [userSelect];
  } case "role": {
    const roleSelect = new RoleSelectMenuBuilder()
      .setCustomId("roleSelect")
      .setPlaceholder("Select a role...");
    return [roleSelect];
  } case "mentionable": {
    const mentionableSelect = new MentionableSelectMenuBuilder()
      .setCustomId("mentionableSelect")
      .setPlaceholder("Select a user or role...");
    return [mentionableSelect];
  } case "modal": {
    const modalButton = new ButtonBuilder()
      .setCustomId("modal")
      .setLabel("Open Modal")
      .setStyle(ButtonStyle.Primary);
    return [modalButton];
  }
  }
}

//MARK: custom modal
async function customModal(i: ButtonInteraction, setting: ConfigOptions): Promise<void> {
  if (!("options" in setting) || setting.options instanceof Array)
    throw new Error();

  const modal = new ModalBuilder()
    .setCustomId("settingsModal")
    .setTitle(setting.name);
  
  const optionInput = new TextInputBuilder()
    .setCustomId(setting.options.value)
    .setLabel(setting.options.name)
    .setPlaceholder(setting.options.placeholder);
  
  switch (setting.options.type) {
  case "short": {
    optionInput.setStyle(TextInputStyle.Short);
    break;
  } case "paragraph": {
    optionInput.setStyle(TextInputStyle.Paragraph);
    break;
  }
  }

  modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(optionInput));

  await i.showModal(modal);
}

//MARK: set/get setting
function setSetting(scope: ConfigScope, id: string | undefined, db: Database, setting: ConfigOptions, value: unknown): void {
  switch (scope) {
  case "user": {
    if (id === undefined)
      throw new Error("Attempted to get setting without a valid ID.");

    db.user.update(id, setting.name, value);
    break;
  } case "server": {
    if (id === undefined)
      throw new Error("Attempted to get setting without a valid ID.");

    db.server.update(id, setting.name, value);
    break;
  } case "bot": {
    db.global.update("global", setting.value, value);
    break;
  }
  }
}

function getSetting(scope: ConfigScope, id: string | undefined, db: Database, setting: ConfigOptions): unknown {
  switch (scope) {
  case "user": {
    if (id === undefined)
      throw new Error("Attempted to get setting without a valid ID.");

    return db.user.fetchOr(id, setting.name, setting.default);
  } case "server": {
    if (id === undefined)
      throw new Error("Attempted to get setting without a valid ID.");

    return db.server.fetchOr(id, setting.name, setting.default);
  } case "bot": {
    return db.global.fetchOr("global", setting.name, setting.default);
  }
  }
}