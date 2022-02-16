@echo off
echo This script will overwrite keys.json and config.json, if they exist.
echo Use ctrl+c to cancel now if you already have either file
pause
pause
call npm install
mkdir server
echo {"token":""} > server\keys.json
echo {"toggles":{"saveLocalCopy":false,"deleteScreens":false,"welcomeMsg":false,"blacklistOneOff":false,"tagModOneOff":true,"screenshotScanning":true,"dmScanning":false,"dmMail":false,"attachmentURLs":true,"testMode":false,"performanceMode":false,"debugMode":false,"processInfoMode":false,"dmAutoReply":false,"respondVerify":true,"dmSymbolDenial":true},"numbers":{"threshold":228,"msgDeleteTime":30,"blacklistTime":24,"targetLevel":30},"chars":{"prefix":"]","prefix2":"="},"ids":{"screenshotChannel":"","logsChannel":"","profileChannel":"","targetLevelRole":"","level40Role":"","level50Role":"","modRole":"","serverID":"","blacklistRole":"","verifiedRole":"","mailCategory":"","mailLogChannel":""}} > server\config.json
copy serverTemplate\messagetxt.js server\messagetxt.js
echo(
echo(
echo(
echo ========================
echo      Setup complete
echo ========================
echo(
echo Now, head to the "server\" directory, put your bot token into "keys.json" and edit the settings and IDs in "config.json" to match your server's
echo(
pause
