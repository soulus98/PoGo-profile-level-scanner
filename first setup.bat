@echo off
echo This script will overwrite keys.json and config.json, if they exist.
echo Use ctrl+c to cancel now if you already have either file
pause
pause
call npm install --omit=dev
mkdir server
copy serverTemplate\keys.json server\keys.json
copy serverTemplate\config.json server\config.json
copy serverTemplate\messagetxt.js server\messagetxt.js
echo(
echo(
echo(
echo ========================
echo      Setup complete
echo ========================
echo(
echo Now edit server\keys.json and server\config.json, then run npm run register-commands before starting the bot.
echo(
pause
