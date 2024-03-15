module.exports = {
    name: 'admintest',
    description: 'tests for given role',
    hidden: true,
    execute({message}){
             
    if (message.member.permissions.has('KICK_MEMBERS' || 'BAN_MEMBERS')) {
        message.tryreply('User has moderator permissions.');
    } else {
        message.tryreply('User does not have moderator permissions.');
    }
  }
}
