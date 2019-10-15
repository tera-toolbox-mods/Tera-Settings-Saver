const path = require('path');
const fs = require('fs');

if(!fs.existsSync(path.join(__dirname, './data'))) {
    fs.mkdirSync(path.join(__dirname, './data'));
}

function getJsonData(pathToFile) {
    try {
        return JSON.parse(fs.readFileSync(path.join(__dirname, pathToFile)));
    }catch(e) {
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
        const command = dispatch.command;
        let acceptServer = 0,
            acceptClient = false,
            settingsPath;

        function cmdKeybind(arg) {
            if(!arg) {
                command.message(`You need to include a file path(look in data folder)`);
                return;
            }

            let data;
            if(arg.toLowerCase() === "lock") {
                data = getJsonData(settingsPath);
                if(!data.lock) data.lock = false;
                data.lock = !data.lock;
                command.message(`Keybind lock has been set to ${data.lock}.`);
            }else {
                data = getJsonData(`./data/${arg}.json`);
                if(!data) {
                    command.message(`Invalid file name`);
                    return;
                }
                command.message(`Keybind transferred, relog to get them.`);
            }
            saveJsonData(settingsPath, data);
        }
        command.add(['keybinds', 'key', 'set', 'settings', '!keybinds', '!key', '!set', '!settings'], cmdKeybind);

        function sLoadClientSetting(key, opcode, payload, incoming, fake) {
            if(acceptServer > 0 && !fake) {
                acceptServer--;
                let data = getJsonData(settingsPath);
                if(data && data[key]) {
                    let newPayload = Buffer.from(`${data[key].length}${getPacketInfo(payload).opcode}${data[key].payload}`, 'hex');
                    if(newPayload.toString() === payload.toString()) return true;
                    setTimeout(()=> {command.message(`Your keybinds/settings were reset, fixing it. Note: One(or more) glyph page might be fucked`)}, 5000);
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
                let data = getJsonData(settingsPath);
                if(data.lock) return;
                saveJsonData(settingsPath, Object.assign({}, data || {}, JSON.parse(`{ "${key}": ${JSON.stringify(getPacketInfo(payload))} }`)));
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

        dispatch.game.on('enter_game', () => {
            settingsPath = `./data/${dispatch.game.me.name}-${dispatch.game.serverId}.json`;
            acceptServer = 2;
        });
    }
}


module.exports = KeybindSaver;
