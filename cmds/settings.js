module.exports = {
    name: 'settings',
    description: "config command but different",
    execute(message, args, vars){
        require(`./config`).execute(message, args, vars);
    }
}