class SceneLobby extends Phaser.Scene {

    constructor() {
        super('lobby');

        this.GameConstants = SDRGame.GameConstants;
        this.playerGraphicsList = [];
    }

    preload ()
    {
        this.load.html('playerInputForm', '../htmlAssets/playerNameInput.html');
    }

    create({ network, code }) {
        this.network = network;

        const container = document.getElementById('lobby-controls');
        container.style.display = 'none';

        network.joinLobby(
            code,
            () => console.log('joined lobby'),
            () => this.scene.start('home', {
                network,
                messages: ['Failed to join lobby']
            }),
            this.handleLobbyUpdate.bind(this)
        );

        this.add.text(20, 20, 'Lobby Scene');

        this.codeLabel = this.add.text(20, 50, 'Code:')
        this.playersLabel = this.add.text(20, 80, 'Players:');

        this.playerGraphicsList = [];

        this.createStartButton();
    }

    handleLobbyUpdate(msg) {
        switch (msg.type) {
            case SDRGame.Messaging.LobbyUpdates.NEW_STATE:
                this.receiveNewState(msg.state);
                break;
            case SDRGame.Messaging.LobbyUpdates.GAME_STARTING:
                console.log('switching scenes');
                this.scene.start('active-game', {
                    network: this.network,
                    initialState: msg.initialState
                });
                break;
        }
    }

    receiveNewState(lobbyState) {
        // code
        // host
        // members [{ id, name, playerColor, shieldColor }]

        const codeStr = `Code: ${lobbyState.code}`;
        this.codeLabel.setText(codeStr);
        console.log(codeStr);

        this.playerGraphicsList.forEach(p => p.destroy());
        this.playerGraphicsList = [];
        lobbyState.members.forEach((m, i) => {
            const playerShield = this.add.rectangle(40, -15, this.GameConstants.PLAYER_HITBOX_RADIUS*1.8, 25, m.shieldColor);
            const playerBall = this.add.circle(40, 0, this.GameConstants.PLAYER_HITBOX_RADIUS, m.playerColor);

            const name = m.id === this.network.playerId
                ? `${m.name} (you)`
                : m.name;
            const playerLabel = this.add.text(80, -10, name);

            const playerObjects = [playerShield, playerBall, playerLabel];

            if (m.id === lobbyState.host) {
                const hostIndicator = this.add.rectangle(0, 0, 10, 10, 0xe8d210);
                playerObjects.push(hostIndicator);
            }

            const container = this.add.container(40, 130 + 50 * i, playerObjects);

            this.playerGraphicsList.push(container);
        });
        
        this.createPlayerNameInput(lobbyState, 600, 200);
        this.createColorPicker(lobbyState, "Select Player Color:", "playerColor", 600, 300);
        this.createColorPicker(lobbyState, "Select Shield Color:", "shieldColor", 600, 450);

        if (this.network.playerId === lobbyState.host) {
            this.showStartButton();
        } else {
            this.hideStartButton();
        }
    }

    /**
     * Create color picker options
     * @param {Lobby} lobbyState                Lobby object with informatio 
     * @param {string} pickerTitle              Title to be displayed above color picker
     * @param {string} playerPropertyToUpdate   Property of player updated by color options - should be 'playerColor' or 'shieldColor' 
     * @param {int} containerX                  X coordinate of where picker's containter is placed
     * @param {int} containerY                  Y coordinate of where picker's containter is placed
     */
    createColorPicker(lobbyState, pickerTitle, playerPropertyToUpdate, containerX, containerY)
    {
        const pickerObjects = [];
        let currentPlayerState = lobbyState.members.find(m => m.id === this.network.playerId);
        this.GameConstants.COLOR_PICKER_CONSTANTS.DEFAULT_COLOR_OPTIONS.forEach((color, idx) => {
            if (idx < this.GameConstants.COLOR_PICKER_CONSTANTS.COLORS_AVAILABLE)
            {
                const padding = 2*this.GameConstants.PLAYER_HITBOX_RADIUS + 10;
                const columnIndex = idx % this.GameConstants.COLOR_PICKER_CONSTANTS.COLORS_PER_ROW;
                const rowIndex = Math.floor(idx / this.GameConstants.COLOR_PICKER_CONSTANTS.COLORS_PER_ROW);
                let memberUsingColor = lobbyState.members.find(m => m[playerPropertyToUpdate] === color);

                let colorCircle = this.add.circle(columnIndex * padding, 50 + rowIndex * (padding), this.GameConstants.PLAYER_HITBOX_RADIUS, color)
                    .setInteractive()
                    .on('pointerdown', () => {
                        if (!memberUsingColor)
                        {
                            currentPlayerState[playerPropertyToUpdate] = color;
                            const updateLobbyMemberCommand = SDRGame.Messaging.LobbyCommands.createUpdateLobbyMember(currentPlayerState);
                            this.network.sendLobbyCommand(updateLobbyMemberCommand);
                        }
                    });

                if (memberUsingColor)
                {
                    if (memberUsingColor.id !== currentPlayerState.id) 
                    {
                        colorCircle.setAlpha(0.01);
                    }
                    else
                    {
                        /*const indicator = this.add.circle(columnIndex * padding, rowIndex * padding, this.GameConstants.PLAYER_HITBOX_RADIUS*1.1, 0xffffff);
                        colorOptions.push(indicator);*/
                        colorCircle.setStrokeStyle(0.1, 0xffffff)
                        colorCircle.strokeColor = 0xffffff;
                        colorCircle.lineWidth = 0.1 * this.GameConstants.PLAYER_HITBOX_RADIUS;
                    }
                }
                pickerObjects.push(colorCircle);
            }
        });

        const title = this.add.text(0, 0, pickerTitle);
        pickerObjects.push(title);
        const playerColorContainer = this.add.container(containerX, containerY, pickerObjects);
        this.playerGraphicsList.push(playerColorContainer);
    }

    createPlayerNameInput(lobbyState, containerX, containerY)
    {
        let nameInputForm = this.add.dom(0, 0).createFromCache('playerInputForm');
        nameInputForm.originX = 0;
        nameInputForm.addListener('click');
        nameInputForm.on('click', this.updatePlayerName.bind(this, lobbyState));
        this.playerNameInput = nameInputForm;

        const nameFormContainer = this.add.container(containerX, containerY, nameInputForm);
        this.playerGraphicsList.push(nameFormContainer);
    }

    getPlayerNameText()
    {
        if (!this.playerNameInput)
        {
            return null;
        }
        else
        {
            let nameInput = this.playerNameInput.getChildByName('playerName');
            return nameInput.value;
        }
    }

    updatePlayerName(lobbyState, event) {
        console.log(`updateing`)
        console.log(lobbyState)
        console.log(event)
        if (event.target.name === 'changeNameButton')
        {
            let playerName = this.getPlayerNameText();
            console.log(playerName)
            let currentPlayerState = lobbyState.members.find(m => m.id === this.network.playerId);
            if (currentPlayerState && playerName)
            {
                currentPlayerState.name = playerName;
                const updateLobbyMemberCommand = SDRGame.Messaging.LobbyCommands.createUpdateLobbyMember(currentPlayerState);
                console.log(`before: ${playerName}`)
                this.network.sendLobbyCommand(updateLobbyMemberCommand);
                console.log(`after: ${this.getPlayerNameText()}`)
            }
        }
    }

    createStartButton() {
        const btnBack = this.add.rectangle(0, 0, 140, 40, 0x109ce8)
            .setInteractive()
            .on('pointerdown', () => {
                const command = SDRGame.Messaging.LobbyCommands.createStartGame();
                this.network.sendLobbyCommand(command);
            });
        const btnText = this.add.text(-50, -10, 'Start Game');
        this.startGameBtn = this.add.container(600, 50, [btnBack, btnText]);

        this.hideStartButton();
    }

    hideStartButton() {
        this.startGameBtn.setActive(false);
        this.startGameBtn.setVisible(false);
    }

    showStartButton() {
        this.startGameBtn.setActive(true);
        this.startGameBtn.setVisible(true);
    }
}
