module.exports = {
    name: 'ping',
    description: "ping pong command",
    execute({message}){
        message.channel.trysend('pong you bumbling pillock');
    }
}