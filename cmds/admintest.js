module.exports = {
    name: 'admintest',
    description: 'tests for given role',
    execute(message){
             
    if (message.member.permissions.has('KICK_MEMBERS' || 'BAN_MEMBERS')) {
        message.channel.trysend('User has moderator permissions.');
    } else {
        message.channel.trysend('User does not have moderator permissions.');
    }
  }
}
