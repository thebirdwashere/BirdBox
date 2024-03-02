module.exports = {
    name: 'netstats',
    description: 'how much garbage has the server sent',


execute({message}) {
    const { exec } = require("child_process");
    function netCode(message){
    exec("ifconfig enp5s0 | grep bytes", (error, stdout, stderr) => {
      if (error) {
          //console.log(`error: ${error.message}`);
          message.tryreply("Could not run ifconfig")
          return;
      }
      if (stderr) {
          message.tryreply(`There was an error: ${stderr}`)
          console.log(`stderr: ${stderr}`);
          return;
      }
      message.tryreply(`\`\`\`\n${stdout}\n\`\`\``
      );
    })};
    
    netCode(message)
  }
} 
