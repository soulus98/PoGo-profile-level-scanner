@echo off
echo This script will overwrite keys.json and config.json, if they exist.
echo Use ctrl+c to cancel now if you already have either file
pause
pause
call npm install
mkdir server
echo {"token":""} > server\keys1.json
echo {"toggles":{"saveLocalCopy":false,"deleteScreens":true,"welcomeMsg":false,"testMode":true,"performanceMode":false,"blacklistOneOff":false,"tagModOneOff":true,"screenshotScanning":true,"dmScanning":true,"dmMail":true,"attachmentURLs":false,"debugMode":false,"dmAutoReply":false,"respondVerify":true,"dmSymbolDenial":true},"numbers":{"threshold":225,"msgDeleteTime":5,"blacklistTime":1,"targetLevel":30},"chars":{"prefix":"]","prefix2":""},"ids":{"screenshotChannel":"","logsChannel":"","profileChannel":"","targetLevelRole":"","level40Role":"","level50Role":"","verifiedRole":"","modRole":"","serverID":"","blacklistRole":"","mailCategory":"","mailLogChannel":""}} > server\config1.json
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
