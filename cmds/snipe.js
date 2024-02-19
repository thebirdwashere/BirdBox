module.exports = {
  name: 'snipe',
  description: 'fetches last deleted message and displays it',
  async execute(message, args, vars) {
    const EmbedBuilder = vars.EmbedBuilder
    const db = vars.db;

    const snipe = await db.get(`snipe_${message.channel.id}`)

    if (!snipe) return message.channel.trysend('this command is garbage apparently cause i cant find a dang thing here')
    if (!snipe.content || !snipe.timestamp || !snipe.author) return message.channel.trysend('this command is garbage apparently cause the snipe i got is busted')
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
      .setDescription(snipe.content)
      .setAuthor({name: snipe.author.tag, iconURL: sniped.displayAvatarURL()})
      .setColor('Green')
      .setFooter({text: randomfooters[Math.floor(Math.random() * randomfooters.length)]})
      .setTimestamp(messagedate);

    if (snipe.attachment) {
      newEmbed.setImage(snipe.attachment);
    }
    
    message.channel.trysend({embeds: [newEmbed]})
  }
}
