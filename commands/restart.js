const { replyNoMention } = require("../func/misc.js");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

// Load the keys from the keys.json file....
const keys = require(path.resolve(__dirname, "../server/keys.json"));

module.exports = {
    name: "restart-bot-server",
    description: "Restarts the bot. I haven't (can't) thoroughly tested this, so sorry if it doesn't work",
    aliases: ["rs", "restart", "restart-server"],
    usage: `\`${ops.prefix}rs\``,
    guildOnly: true,
    type: "Admin",
    execute(message) {
        console.log(`${message.author.username}${message.author} force quit the server at ${message.createdAt.toLocaleString()}.`);
        const currentDir = process.cwd();
        console.log(`Current working directory: ${currentDir}`);

        const gitRepoPath = keys.dir || currentDir; // Use the current directory as fallback
        console.log(`Git repository path from keys.json: ${keys.dir}`);
        console.log(`Using git repository path: ${gitRepoPath}`);

        const resolvedGitRepoPath = path.resolve(gitRepoPath);
        console.log(`Resolved git repository path: ${resolvedGitRepoPath}`);

        if (!fs.existsSync(path.join(resolvedGitRepoPath, ".git"))) {
            const errorMsg = `No git repository found at specified path: ${resolvedGitRepoPath}`;
            console.error(errorMsg);
            replyNoMention(message, errorMsg);
            return Promise.reject(new Error(errorMsg));
        }

        console.log(`Git repository found at: ${resolvedGitRepoPath}`);

        return replyNoMention(message, "Pulling latest changes from Git and restarting...").then(() => {
            return new Promise((resolve, reject) => {
                console.log(`Executing git pull in directory: ${resolvedGitRepoPath}`);
                exec("git pull", { cwd: resolvedGitRepoPath }, (error, stdout, stderr) => {
                    if (error) {
                        const errorMsg = `Failed to pull from git: ${error.message}`;
                        console.error(`Error during git pull: ${error.message}`);
                        replyNoMention(message, errorMsg);
                        return reject(error);
                    }
                    if (stderr) {
                        console.error(`Git pull stderr: ${stderr}`);
                    }
                    console.log(`Git pull stdout: ${stdout}`);

                    resolve();
                    setTimeout(() => {
                        process.exit(0);
                    }, 10);
                });
            });
        });
    },
};
