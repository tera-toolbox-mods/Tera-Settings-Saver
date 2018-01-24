const path = require('path');
const fs = require('fs');

function getJsonData(pathToFile) {
    try {
        return JSON.parse(fs.readFileSync(path.join(__dirname, pathToFile)));
    }catch(e) {
        console.log(e);
        return undefined;
    }
}

function saveJsonData(pathToFile, data) {
    fs.writeFileSync(path.join(__dirname, pathToFile), JSON.stringify(data, null, "    "));
}

function getPacketInfo(payload) {
    let tmp = payload.toString('hex');
    return {
        length: tmp.slice(0, 4),
        opcode: tmp.slice(4, 8),
        payload: tmp.slice(8)
    };
}

class KeybindSaver {
    constructor(dispatch) {
        const command = require('command')(dispatch);
        let acceptServer = 0,
            acceptClient = false,
            settingsPath;
        
        function cmdKeybind(arg) {
            if(!arg) {
                command.message(`You need to include a file path(look in data folder)`);
                return;
            }
            let data = getJsonData(`./data/${arg}.json`);
            if(!data) {
                command.message(`Invalid file name`);
                return;
            }

            saveJsonData(settingsPath, data);
            command.message(`Keybind transferred, relog to get them.`);
        }
        command.add(['keybind', 'key'], cmdKeybind);

        function sLoadClientSetting(key, opcode, payload, incoming, fake) {
            if(acceptServer > 0 && !fake) {
                acceptServer--;
                let data = getJsonData(settingsPath);
                if(data && data[key]) {
                    let newPayload = Buffer.from(`${data[key].length}${getPacketInfo(payload).opcode}${data[key].payload}`, 'hex');
                    if(newPayload.toString() === payload.toString()) return true;
                    setTimeout(()=> {command.message(`You're keybinds/settings were reset, fixing it. Note: One(or more) glyph page might be fucked`)}, 5000);
                    dispatch.toClient(newPayload);
                    return false;
                }else{
                    saveJsonData(settingsPath, Object.assign({}, data || {}, JSON.parse(`{ "${key}": ${JSON.stringify(getPacketInfo(payload))} }`)));
                }
            }
        }
        dispatch.hook('S_LOAD_CLIENT_ACCOUNT_SETTING', 'raw', sLoadClientSetting.bind(null, 'accountSettings'));
        dispatch.hook('S_LOAD_CLIENT_USER_SETTING', 'raw', sLoadClientSetting.bind(null, 'userSettings'));
        
        function cSaveClientSetting(key, opcode, payload, incoming, fake) {
            if(acceptClient && !fake) {
                saveJsonData(settingsPath, Object.assign({}, getJsonData(settingsPath) || {}, JSON.parse(`{ "${key}": ${JSON.stringify(getPacketInfo(payload))} }`)));
            }
        }
        dispatch.hook('C_SAVE_CLIENT_ACCOUNT_SETTING', 'raw', cSaveClientSetting.bind(null, 'accountSettings'));
        dispatch.hook('C_SAVE_CLIENT_USER_SETTING', 'raw', cSaveClientSetting.bind(null, 'userSettings'));
        
        function noMoreAccept() {
            acceptClient = false;
        }
        dispatch.hook('S_RETURN_TO_LOBBY', 'raw', noMoreAccept);
        dispatch.hook('S_LOAD_TOPO', 'raw', noMoreAccept);

        function acceptNow() {
            acceptClient = true;
        }
        dispatch.hook('C_LOAD_TOPO_FIN', 'raw', acceptNow);
        
        dispatch.hook('S_LOGIN', 9, e=> {
            settingsPath = `./data/${e.name}-${e.serverId}.json`;
            acceptServer = 2;
        });
    }
}


module.exports = KeybindSaver;