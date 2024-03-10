const { EmbedBuilder } = require("discord.js");
const { randomIntInRange } = require("../utils");

module.exports = {
  name: 'snipe',
  description: 'Fetch a recent deleted message! (does not work with images)',
  async execute({message}, {db}) {
    const snipe = await db.get(`snipe_${message.channel.id}`)

    if (!snipe) return message.channel.trysend('this command is garbage apparently cause i cant find a dang thing here')
    if (!snipe.timestamp || !snipe.author) return message.channel.trysend('this command is garbage apparently cause the snipe i got is busted')
    messagedate = new Date(snipe.timestamp)

    const sniped = await message.guild.members.fetch(snipe.author.id)

    const randomfooters = [
      "can't hide from me", "can't hide from me",
      "can't hide from me", "can't hide from me",
      "can't hide from me", "can't hide from me",
      "lol get sniped", "lol get sniped",
      "lol get sniped", "lol get sniped",
      "lol get sniped", "lol get sniped",
      "ripbozo" //rare response
    ]

    const newEmbed = new EmbedBuilder()
      .setTitle(`${message.channel.name}’s Snipe`)
      .setAuthor({name: snipe.author.tag, iconURL: sniped.displayAvatarURL()})
      .setColor('Green')
      .setFooter({text: randomfooters[randomIntInRange(0, randomfooters.length - 1)]})
      .setTimestamp(messagedate);

    if (snipe.content) {
      newEmbed.setDescription(snipe.content);
    }

    if (snipe.attachment) {
      newEmbed.setImage(snipe.attachment);
    }

    message.channel.trysend({embeds: [newEmbed]})
  }
}
