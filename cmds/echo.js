module.exports = {
    name: 'echo',
    description: "echo command",
    execute(message, args, vars){
        if (args[0]?.trim() == "noreply") {
            message.channel.trysend(message.content.replace(`${vars.prefix}echo noreply`, '').trim());
        } else {
            message.tryreply(message.content.replace(`${vars.prefix}echo`, '').trim());
        }   
    }
}