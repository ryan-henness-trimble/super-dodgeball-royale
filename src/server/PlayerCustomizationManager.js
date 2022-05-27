const { gameconstants } = require('../shared/gameconstants');

class PlayerCustomizationManager {

    constructor() {
        this.playerCustomizations = new Map();  // key: playerId    value: PlayerCustomization object 
        this.playerNames = new Map();           // key: name        value: playerId using name    
        this.playerColors = new Map();          // key: hexColor    value: playerId using color 
        this.shieldColors = new Map();          // key: playerI     value: playerId using color

        this.initializeDefaultColors(this.playerColors);
        this.initializeDefaultColors(this.shieldColors);
    }

    generateValidPlayerCustomization(nameToTry)
    {
        let newPlayerCustomization = new PlayerCustomization();
        newPlayerCustomization.name = this.getAvailableName.call(this, nameToTry);
        newPlayerCustomization.playerColor = this.getAvailableColor.call(this, this.playerColors);
        newPlayerCustomization.shieldColor = this.getAvailableColor.call(this, this.shieldColors);
        return newPlayerCustomization;
    }

    getPlayerCustomization(lobbyMemberId)
    {
        return this.playerCustomizations.get(lobbyMemberId);
    }

    setPlayerCustomization(lobbyMemberObject)
    {
        if (this.isCustomizationValid(lobbyMemberObject))
        {
            this.playerCustomizations.set(lobbyMemberObject.playerId, new PlayerCustomization().initializeFromObject(lobbyMemberObject));
            this.replaceExistingMapping.call(this, this.playerNames, lobbyMemberObject.name, lobbyMemberObject.playerId, false);
            this.replaceExistingMapping.call(this, this.playerColors, lobbyMemberObject.playerColor, lobbyMemberObject.playerId, true);
            this.replaceExistingMapping.call(this, this.shieldColors, lobbyMemberObject.shieldColor, lobbyMemberObject.playerId, true);
            return true;
        }
        else
        {
            return false;
        }
    }

    removePlayerCustomization(playerId)
    {
        this.playerCustomizations.delete(playerId);
        this.removeExistingMapping.call(this, this.playerNames, playerId, false);
        this.removeExistingMapping.call(this, this.playerColors, playerId, true);
        this.removeExistingMapping.call(this, this.shieldColors, playerId, true);
    }

    isCustomizationValid(lobbyMemberObject)
    {
        return this.isMappingAvailable.call(this, this.playerNames, lobbyMemberObject.name, lobbyMemberObject.playerId) &&
                this.isMappingAvailable.call(this, this.playerColors, lobbyMemberObject.playerColor, lobbyMemberObject.playerId) &&
                this.isMappingAvailable.call(this, this.shieldColors, lobbyMemberObject.shieldColor, lobbyMemberObject.playerId);
    }

    getAvailableColor(colorMapping)
    {
        const colors = [...colorMapping.entries()];
        const availableColors = colors.filter(colors => colors[1] === null);             // Each element is an array of [color, playerIdUsing]
        const na = colors.filter(colors => colors[1] !== null);
        return availableColors[Math.floor(Math.random()*availableColors.length)][0];    // For a random avaible color, take the key (color) 
    }

    getAvailableName(nameToTry)
    {
        let newName = nameToTry;
        let alternateInitials = "ABCDEFGHIJK";
        let i = 0;
        while (!this.isMappingAvailable.call(this, this.playerNames, newName, null) && i < alternateInitials.length)
        {
            newName = `Player ${alternateInitials[i]}`;
            i++;
        }
        return newName;
    }

    initializeDefaultColors(colorMapping)
    {
        gameconstants.COLOR_PICKER_CONSTANTS.DEFAULT_COLOR_OPTIONS.forEach((color, idx) => {
            if (idx < gameconstants.COLOR_PICKER_CONSTANTS.COLORS_AVAILABLE)
            {
                colorMapping.set(color, null);
            }
        });
    }
   
    // Method to determine if color mapping from key to playerId is allowed
    // Mapping is allowed if the color is not in use (has no value) or in use by the updating player
    isMappingAvailable(mapObject, key, updatingPlayerId)
    {
        const matchingValue = mapObject.get(key);
        return !matchingValue || matchingValue === updatingPlayerId;
    }

    removeExistingMapping(mapObject, playerId, nullOutOldValue)
    {
        const existingMapping = this.getMappingByValue(mapObject, playerId);
        if (existingMapping !== null)
        {
            if (nullOutOldValue)
            {
                mapObject.set(existingMapping.key, null);
            }
            else
            {
                mapObject.delete(existingMapping.key);
            }
        }
    }

    replaceExistingMapping(mapObject, newKey, playerId, nullOutOldValue)
    {
        this.removeExistingMapping.call(this, mapObject, playerId, nullOutOldValue);
        mapObject.set(newKey, playerId);
    }

    mapHasValue(mapObject, value)
    {
        const values = [...mapObject.values()];
        return values.includes(value)
    }

    getMappingByValue(mapObject, value)
    {
        const keyValuePairs = [...mapObject.entries()];
        const matchingKeyValue = keyValuePairs.find(v => v[1] === value);
        if (matchingKeyValue !== undefined)
        {
            return {
                key: matchingKeyValue[0],
                value: matchingKeyValue[1]
            };
        }
        else
        {
            return null;
        }
    }


}

class PlayerCustomization
{
    constructor()
    {
        this.name = "NO CUSTOM NAME";
        this.playerColor = "NO CUSTOM PLAYER COLOR";
        this.shieldColor = "NO CUSTOM SHIELD COLOR"
    }

    initializeFromObject(lobbyMemberObject)
    {
        this.name = lobbyMemberObject.name;
        this.playerColor = lobbyMemberObject.playerColor;
        this.shieldColor = lobbyMemberObject.shieldColor;
        return this;
    }
}

exports.PlayerCustomizationManager = PlayerCustomizationManager;