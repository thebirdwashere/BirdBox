module.exports = {
    name: 'settings',
    description: "config command but different",
    hidden: true,
    execute({message, args}, vars){
        require(`./config`).execute({message, args}, vars);
    }
}