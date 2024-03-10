module.exports = {
    name: 'echo',
    description: "Make the bot say dumb things. Use echo noreply for no message reply!",
    execute({message, args}, {prefix}){
        if (args[0]?.trim() == "noreply") {
            message.channel.trysend(message.content.replace(`${prefix}echo noreply`, '').trim());
        } else {
            message.tryreply(message.content.replace(`${prefix}echo`, '').trim());
        }   
    }
}