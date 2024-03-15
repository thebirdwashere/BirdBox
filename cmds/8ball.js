const {EmbedBuilder} = require("discord.js")
const { randomChoice } = require("../utils")

module.exports = {
    name: '8ball',
    description: 'Question the Box and never get a straight answer.',
    execute({message}, {prefix}){
    let responses = [
      'Ask again in Spanish.',
      'bruh im deaf you gotta type it again',
      'Is that your final answer?',
      'How should I know im just an 8ball',
      'Try asking an actually good question',
      'Your abilities are too infant-like for doing much alone. Coriolanus',
      'Please deposit one coin and try again',
      'This is the 8ball that is not.',
      'complete your duolingo lesson',
      'https://www.youtube.com/watch?v=GSV5UDaTXDA - cassiel - r/unixporn discord - 11/21/21',
      'Are you single? Wake up and Meet up Your Princess https://cdn.discordapp.com/attachments/635625889249624095/912118990581682177/image0-2.png - jaamivstheworld - r/unixporn discord - 11/21/21',
      'Club Penguin Waving Emote https://cdn.discordapp.com/attachments/635625889249624095/912127620211159040/750340933526093965.png - Bleyom - r/unixporn discord - 11/21/21',
      'Matty will have your head off by tomorrow for this.',
      'HAVENT YOU LEARNED YOUR LESSON TO NOT BELIEVE ME BY NOW?',
      'I want the debt you people owe me, AND I WANT IT NOW!',
      'You know, you wouldn\'t need me if you were a bit smarter...',
      'I am running out of things to say...',
      'uuuuuh yea maybe how would I know?',
      'nah aint gonna happen unless you pay me more.',
      'Do you want the good news or the bad news?',
      'Do you want the good news or the good news?',
      'Do you want the bad news or the bad news?',
      'You do not want to know. Trust me.',
      'Next question, please.',
      'In order to answer the question, I need to take you back about ten years. Do you have a moment?',
      'That is a really wonderful question. Ummm...',
      'I\'m sure you have that information already.',
      'Have you tried reading the manual?',
      'How much will you pay me if I tell you?',
      'What an impertinent question to ask a bot like myself!',
      'They told me you would ask that.',
      'I\'ll let you know when I figure it out.',
      'Do you want an honest answer or the one you were expecting?',
      'If I answer, will you leave me alone?',
      'Physically? Mentally? Spiritually? Financially? Socioeconomically? I am not sure what you mean.',
      'The answer is love. But only if it\'s eternal love.',
      'The answer is love. But only if it\'s eternal love. \nNowadays love is fleeting and never lasts, but true love is eternal and everlasting.',
      'I had promised myself I would ban the next person who asked me that question...',
      'I was hoping you would be able to tell me that.',
      'Maybe you can Google it.',
      'My lawyer told me not to answer that question.',
      'I plead the fifth.',
      'Keep asking and maybe one day you\'ll get a sensible answer.',
      'On a scale of 1 to 10, I\'d say somewhere between 1 and 10.',
      'I\'ll get back to you tomorrow when the results are in.',
      'Do you really care?',
      'I\'ve heard various opinions.',
      'I\'m trying really hard to avoid ambiguous questions at the moment.',
      'Do you want the short or long version?',
      'It\'s a secret. Only the cool kids know.',
      'I\'ll leave that up to your imagination.',
      'I\'m pretty sure I am not obligated to tell you.',
      'Do I really need to answer that?',
      'Is this some sort of test? Because the answers are way too easy.',
      'You could have answered the question yourself in the time it took to ask it.',
      'Are you actually looking for a truthful answer?',
      'Do you always ask people obvious questions?',
      'I\'m going to give you some time to figure out the answer to that one.',
      'Haven\'t you asked that before?',
      'I\'ll give you a minute to figure it out first, let me know if you\'re still stuck.',
      'Try asking the Hand that Wrote All.',
      'I\'m sorry, why do I care again?',
      'What\'s in it for me?',
      'In English, please.',
      'Sadness obscures this heart of mine, as I know not how to interpret your nonsense.',
      'You could really go any way with that.',
      'Good question.',
      'I don\'t think I quite caught that, can you repeat it?',
      'Do a little dance first - https://www.youtube.com/watch?v=xrBLSmuhTSs',
      'Your call cannot be received at this time. Please hold.',
      'https://www.youtube.com/watch?v=QUcTsFe1PVs',
      'Haven\'t you heard the news?',
      'I cannot confirm or deny that information. In fact, why are you asking it at all?',
      'Oof.',
      'I\'m busy, try again later.',
      'Needless to say, I see this going either one way or another.',
      'Look, can we do this again later?',
      'Now THAT is a lot of damage.',
      'I have a bad feeling about this...',
      'Now that\'s just sad. Try again next time.',
      'Man, there\'s only one tip you need: consume their earlobes. Works every time, trust me.',
      'What would you say if someone asked you that?',
      'It\'s too early to answer such a deep question.',
      'Apologies, but my schedule is packed currently. I\'ll be available this Thursday at 3:00, try again then?',
      'Please email your question to "8ballresponses@birdbox.com," and I’ll reply back as soon as I can.',
      'Sorry, but we\'re full at the moment. We\'ll get back to you eventually.',
      'It could be raining words and I could still not answer your question.',
      'Sorry, have we met before?',
      'I think yes, but the voices in my head say no. You decide which is more trustworthy.',
      'I\'ve dodged every question for years and I\'m not stopping now!',
      'That, I would prefer to leave a mystery.',
      'That’s a secret only the Dark Lord knows.',
      'You go first. Then we can compare answers.',
      'I was looking for a moment of silence, but that is gone now, I guess.',
      'Incorrect question! Try again.',
      'https://www.youtube.com/watch?v=DRSxqfisPGw'
    ]

    const randomResponse = randomChoice(responses)

    const randomFooters = [
      "i be like that wise tree fr fr",
      "1 million billion iq move",
      "big brain",
      "panzer of ze lake",
      "erm it's yr'oue* actually"
    ]

    const youAsked = message.content.replace(`${prefix}8ball`, '').trim() //guys we finally found who asked

    const responseEmbed = new EmbedBuilder()
    .setTitle(randomResponse)
    .setAuthor({ name: 'BirdBox', iconURL: 'https://cdn.discordapp.com/avatars/803811104953466880/5bce4f0ba438015ec65f5b9cac11c8e3.png?size=256' })
    .setColor(0xAA00FF)
    .setFooter({ text: randomChoice(randomFooters) });

    if (youAsked) {responseEmbed.addFields({ name: 'You asked:', value: youAsked})}

    message.reply({ embeds: [responseEmbed] });
    
  }
}