module.exports = {
    name: 'debug',
    description: "grabs values from the database at request (may get more features one day)",
    hidden: true,
    async execute({message, args}, {devs, db}){
        if (!devs.includes(message.author.id)) {
            //aborts because user does not have dev perms
            message.channel.trysend("sorry, you must be a dev to use the debug command"); return; }

        const item = args[0]
        const database_item = await db.get(item)
        
        if (database_item) {
            let itemstring = JSON.stringify(database_item)
            itemstring = itemstring.match(/.{1,2000}/g)
            itemstring.forEach(element => {
                message.channel.trysend(element)
            });
        }
        else (message.channel.trysend(`failed to locate ${item}`))
    }
}