import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField, ComponentType, Message, Channel, Client, TextBasedChannel, Colors, ButtonInteraction } from "discord.js";
import { Command } from "@src/utility/command.js";
import { CommandContext } from "@src/utility/context.js";
import { fetchConfigOption } from "@src/utility/utility.js";

const GuessWho = new Command({
  name: "guesswho",
  description: "Guess the original author of a randomly chosen message.",
  async execute(ctx) {
    const randomMessage = await getRandomMessage(ctx, 0);

    console.log(randomMessage);

    const messageEmbed = new EmbedBuilder()
      .setAuthor({ name: "???????????", iconURL: "https://cdn.discordapp.com/embed/avatars/0.png" })
      .setColor(Colors.Blue)
      .setDescription(randomMessage.content)
      .setFooter({ text: "Guess who sent this!" });

    const lifelinesButton = new ButtonBuilder()
      .setCustomId("guesswho-lifelines")
      .setLabel("Lifelines")
      .setStyle(ButtonStyle.Primary);

    const buttonRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(lifelinesButton);

    const response = await ctx.reply({embeds: [messageEmbed], components: [buttonRow]});

    const buttonCollector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 600000 });

    //MARK: button handlers
    async function handleButtonInteraction(i: ButtonInteraction): Promise<void> {
      await i.deferReply();

      switch (i.customId) {
      case "guesswho-lifelines": {

        const lifelines = [
          {emoji: "⏰", id: "guesswho-stopwatch", name: "⏰ Stopwatch", value: "Displays the original send date", inline: true},
          {emoji: "🔛", id: "guesswho-banda", name: "🔛 Before & After", value: "Adds two messages of context from the same person", inline: true}
        ];

        const lifelinesEmbed = new EmbedBuilder()
          .setTitle("Lifelines")
          .setColor(Colors.Blue)
          .addFields(lifelines);

        const lifelinesRows = [new ActionRowBuilder<ButtonBuilder>()];

        for (let i = 0; i < lifelines.length; i++) {
          const button = new ButtonBuilder()
            .setEmoji(lifelines[i].emoji)
            .setStyle(ButtonStyle.Success)
            .setCustomId(lifelines[i].id);

          lifelinesRows[Math.floor(i/3)].addComponents(button);
        }

        const lifelinesMessage = await ctx.send({embeds: [lifelinesEmbed], components: lifelinesRows});

        const lifelinesCollector = lifelinesMessage.createMessageComponentCollector({ componentType: ComponentType.Button, time: 600000 });

        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        lifelinesCollector.on("collect", async buttoni => {
          switch (buttoni.customId) {
          case "guesswho-stopwatch": {
            messageEmbed.setTimestamp(randomMessage.createdTimestamp);
            await response.edit({embeds: [messageEmbed]});

            break;
          }
          case "guesswho-banda": {
            //TODO
            await response.edit({embeds: [messageEmbed]});
            break;
          }

          }
        });

        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        lifelinesCollector.on("end", async () => {
          //disable the buttons
          lifelinesRows.forEach(item => { item.components.forEach(item => item.setDisabled(true)); });
          await response.edit({ components: [buttonRow] });
        });

        break;
      }
      }

      await response.edit({embeds: [messageEmbed], components: [buttonRow]});
    }
                    
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    buttonCollector.on("collect", async (i) => {await handleButtonInteraction(i);});

    async function handleButtonTimeout(): Promise<void> {
      //disable the buttons
      buttonRow.components.forEach(item => item.setDisabled(true));
      await response.edit({ components: [buttonRow] });
    }

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    buttonCollector.on("end", async () => {await handleButtonTimeout();});
  }
});

export default GuessWho;

// async function getRandomChannel(interaction, client) {
//     const serverChannels = await interaction.guild.channels.fetch()
//     const serverTextChannels = await serverChannels
//         .filter(channel => ![4, 13, 14].includes(channel.type)) //disallow non-text channels
//         .filter(async channel => {
//             const permissions = await channel.permissionsFor(client.user)
//             return permissions.has(PermissionsBitField.Flags.ReadMessageHistory) && permissions.has(PermissionsBitField.Flags.ViewChannel)
//         }) //test for reading perms
//         .map(item => item) //make into array

//     if (serverTextChannels.length) {
//         const randomChannel = serverTextChannels[Math.floor(Math.random() * serverTextChannels.length)]
//         return randomChannel
//     } else {
//         return "could not find a channel"
//     }

// }

async function getRandomMessage(ctx: CommandContext, recursionCount: number): Promise<Message> {
  if (ctx.guild === null || ctx.channel === null)
    //TODO: implement this behavior maybe
    throw new Error("Attempted to search for message outside guild or channel."); 

  if (recursionCount > 100)
    throw new Error("Recursion count exceeded.");

  const searchedChannelId = (fetchConfigOption(ctx.db, "server", "guesswho", ctx.guild.id) ?? ctx.channel.id) as string;
  let searchedChannel = ctx.data.client.channels.cache.get(searchedChannelId);

  if (searchedChannel === undefined)
    throw new Error("Failed to locate channel.");
  else if (!searchedChannel.isTextBased()) {
    searchedChannel = ctx.channel;
  };

  searchedChannel = await getThreadIfPresent(ctx.data.client, searchedChannel);

  if (!searchedChannel.isTextBased())
    throw new Error("Chosen channel is not text-based.");

  console.log("name" in searchedChannel ? searchedChannel.name : "DM channel");

  const first = Number((await searchedChannel.messages.fetch({limit:1,after:"0"})).first()?.id);
  const last = Number((await searchedChannel.messages.fetch({limit:1})).first()?.id);

  if (isNaN(first) || isNaN(last))
    throw new Error("One or more messages found had a non-numerical ID.");

  const MIN_MESSAGE_CHARS = 50;

  const randomId = (Math.floor(Math.random() * (last - first + 1) + first)).toString();

  const collectedArray = (await searchedChannel.messages.fetch({around:randomId,limit:100}))
    .map(msg => msg)
    .filter(msg => msg.content.length > 0)                   //no empty messages
    .filter(msg => !msg.author.bot)                          //no messages from bots
    .filter(msg => msg.content.length >= MIN_MESSAGE_CHARS)  //only messages that are long enough
    .filter(msg => !msg.content.includes("https://"));       //no messages with links;

  console.log(collectedArray);

  if (collectedArray.length) {
    const randomCollect = collectedArray[Math.floor(Math.random() * collectedArray.length)];
    return randomCollect;
  } else {
    return getRandomMessage(ctx, recursionCount+1);
  }
}

async function getThreadIfPresent(client: Client, channel: TextBasedChannel): Promise<Channel> {
  if (!("threads" in channel))
    return channel;

  if (client.user === null)
    throw new Error("Could not locate own client user.");
  const clientGuildMember = await channel.guild.members.fetch(client.user.id);

  let channelThreads = (await channel.threads.fetch()).threads;
  channelThreads = channelThreads.filter(thread => {
    const permissions = thread.permissionsFor(clientGuildMember);
    return permissions.has(PermissionsBitField.Flags.ReadMessageHistory) && permissions.has(PermissionsBitField.Flags.ViewChannel);
  });

  //need to decide if we search a thread or the main channel
  const numberOfThreads = channelThreads.size;
  const channelDecision = Math.floor(Math.random() * (numberOfThreads+1));

  if (channelDecision === numberOfThreads && channel.isTextBased()) {
  //search this channel
    return channel;
  } else {
    const threadMessageCounts = channelThreads.map(item => item.messageCount ?? 0);

    if (numberOfThreads > 0) {
    //https://stackoverflow.com/questions/43566019/how-to-choose-a-weighted-random-array-element-in-javascript
      let i;

      for (i = 1; i < threadMessageCounts.length; i++)
        threadMessageCounts[i] += threadMessageCounts[i - 1];

      const randomDecision = Math.random() * threadMessageCounts[threadMessageCounts.length - 1];

      for (i = 0; i < threadMessageCounts.length; i++)
        if (threadMessageCounts[i] > randomDecision)
          break;

      const chosenThread = channelThreads.at(i);
      if (chosenThread === undefined)
        throw new Error("Chosen thread could not be located.");
      return chosenThread;
    } else {
      throw new Error("Could not find a thread.");
    }
  }
}