module.exports = {
    name: 'neofetch',
    description: 'Run neofetch on the host server.',


execute({message}) {
    const { exec } = require("child_process");
    function neofetchCode(message){
    exec("neofetch --stdout", (error, stdout, stderr) => {
      if (error) {
          //console.log(`error: ${error.message}`);
          message.tryreply("Could not run neofetch")
          return;
      }
      if (stderr) {
          message.tryreply(`There was an error: ${stderr}`)
          console.log(`stderr: ${stderr}`);
          return;
      }
      message.tryreply(`\`\`\`\n${stdout}\n\`\`\``);
    })};

    neofetchCode(message)
  }
} 