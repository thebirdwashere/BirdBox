module.exports = {
    name: 'noreply',
    description: "noreply command",
    execute(message, args, vars){
        message.reply(message.content.replace(`${vars.prefix}noreply`, ''));
    }
}