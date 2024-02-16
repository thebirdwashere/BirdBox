module.exports = {
    name: 'translate',
    description: "translate command",
    execute(message, args, vars){
        if (args[0] == "codes") { require(`./translatecodes`).execute(message, args, vars); return; }
        const translate = require('google-translate-api-x'); // hook into the translate API

        const langTypeFrom = args[0];
        const langTypeTo = args[1];
        const rawMessage = message.content.replace(`${vars.prefix}translate ${langTypeFrom} ${langTypeTo}`, '');

        translate(rawMessage, {from: langTypeFrom, to: langTypeTo}).then(res => {
            message.tryreply(res.text);
        }).catch(console.error);
    }
}