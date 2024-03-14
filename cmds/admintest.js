module.exports = {
    name: 'admintest',
    description: 'tests for given role',
    hidden: true,
    execute({message}){
             
    if (message.member.permissions.has('KICK_MEMBERS' || 'BAN_MEMBERS')) {
        message.channel.tryreply('User has moderator permissions.');
    } else {
        message.channel.tryreply('User does not have moderator permissions.');
    }
  }
}
