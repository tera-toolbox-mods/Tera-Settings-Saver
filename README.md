## Tera-Settings-Saver 2.1

Tera settings saver is a module for TeraToolbox which stops your settings from getting reset, aswell as it allows you to easily transfer settings between characters/servers/region

# Commands
Note, if using the commands in the proxy channel or `/8`, ignore the `!` prefix

Command | Argument(s) | Example | Description
---|---|---|---
**!settings** | lock | !settings lock | locks your current settings
**!settings** | Filename | !settings name-4001 | replaces your current settings with the settings of the desired file name which can be found below

available aliases instead of `!settings` are `!keybinds`, `!key` and `!set` kept as a "legacy" option for those that may have used one of them in the past

more clear example for those that need it, say for example you had a character named "Kaseatard" that you wanted to have the settings of on another character, you would go to the folder below and find its file name and use the command `/8 settings Kaseatard-4001`

(note, make sure to actually look at the file name and not use the numbers used in this example since they will 100% be different)

## File names can be found by going to `[toolbox folder]/mods/Tera-Settings-Saver/data`
or by clicking `Show Mods Folder` in the toolbox ui and going to `/Tera-Settings-Saver/data` from there

### Bugs:
Can potentially reset a glyph & item set page if the settings has been reset(it will print in the chat)
