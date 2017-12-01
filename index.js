const path = require('path');
const fs = require('fs');

class KeybindSaver {
    constructor(dispatch) {
        this.ready = false;
        
        dispatch.hook('S_LOAD_CLIENT_ACCOUNT_SETTING', 'raw', (opcode, payload, incoming, fake)=> {
            if(!this.ready || fake) return;
            let payloadString = payload.toString('hex');
            let actualKeybinds = getJsonData(this.accountSettingPath);
            if(actualKeybinds !== undefined) {
                dispatch.toClient(Buffer.from(actualKeybinds.length + payloadString.slice(4, 8) + actualKeybinds.payload, "hex"));
                return false;
            }else {
                saveJsonData(this.accountSettingPath, {
                    length: payloadString.slice(0, 4),
                    opcode: payloadString.slice(4, 8),
                    payload: payloadString.slice(8)
                });
            }
        });
        
        dispatch.hook('C_SAVE_CLIENT_ACCOUNT_SETTING', 'raw', (opcode, payload, incoming, fake)=> {
            let payloadString = payload.toString('hex');
            saveJsonData(this.accountSettingPath, {
                length: payloadString.slice(0, 4),
                opcode: payloadString.slice(4, 8),
                payload: payloadString.slice(8)
            });
        });
        
        dispatch.hook('S_LOAD_CLIENT_USER_SETTING', 'raw', (opcode, payload, incoming, fake)=> {
            if(!this.ready || fake) return;
            let actualKeybinds = getJsonData(this.userSettingsPath);
            let payloadString = payload.toString('hex');
            if(actualKeybinds !== undefined) {
                dispatch.toClient(Buffer.from(actualKeybinds.length + payloadString.slice(4, 8) + actualKeybinds.payload, "hex"));
                return false;
            }else {
                saveJsonData(this.userSettingsPath, {
                    length: payloadString.slice(0, 4),
                    opcode: payloadString.slice(4, 8),
                    payload: payloadString.slice(8)
                });
            }
        });
        
        dispatch.hook('C_SAVE_CLIENT_USER_SETTING', 'raw', (opcode, payload, incoming, fake)=> {
            let payloadString = payload.toString('hex');
            saveJsonData(this.userSettingsPath, {
                length: payloadString.slice(0, 4),
                opcode: payloadString.slice(4, 8),
                payload: payloadString.slice(8)
            });
        });
        
        dispatch.hook('S_RETURN_TO_LOBBY', e=> {
            this.ready = false;
        });
        
        dispatch.hook('S_LOGIN', 9, e=> {
            let id = e.playerId.toString() + e.serverId.toString();
            this.accountSettingPath = './data/' + id + '.0.json';
            this.userSettingsPath = './data/' + id + '.1.json';
            this.ready = true;
        });
    }
}

function getJsonData(pathToFile) {
    try {
        return require(pathToFile);
    }catch(e) {
        return undefined;
    }
}

function saveJsonData(pathToFile, data) {
    fs.writeFileSync(path.join(__dirname, pathToFile), JSON.stringify(data, null, "    "));
}

module.exports = KeybindSaver;