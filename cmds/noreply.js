module.exports = {
    name: 'noreply',
    description: "noreply command",
    execute({message}, {prefix}){
        message.reply(message.content.replace(`${prefix}noreply`, ''));
    }
}