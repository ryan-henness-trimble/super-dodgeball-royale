class SceneLobby extends Phaser.Scene {

    constructor() {
        super('lobby');

        this.GameConstants = SDRGame.GameConstants;
        this.playerGraphicsList = [];
    }

    preload ()
    {
        this.load.html('playerInputForm', '../assets/html/playerNameInput.html');
    }

    create({ network }) {
        if (!network.lobby) {
            this._startNewScene('home', { network, messages: ['unable to access lobby'] });
        }

        const container = document.getElementById('lobby-controls');
        container.style.display = 'none';

        this.network = network;

        this.network.lobby.subscribeToLobbyUpdates(this.renderLobbyState.bind(this));
        this.network.lobby.subscribeToGameUpdates(this.handleGameUpdate.bind(this));

        this.add.text(20, 20, 'Lobby');

        this.codeLabel = this.add.text(20, 50, 'Code:')
        this.copyCodeButton = this.createButtonObject(107.5, 100, "Copy Lobby Code", () => {
            navigator.clipboard.writeText(this.network.lobby.lobbyState.code);
        })
        this.playersLabel = this.add.text(20, 130, 'Players:');

        this.playerGraphicsList = [];

        console.log(this._formatLobbyCodeString(this.network.lobby.lobbyState.code));

        this.createStartButton();
        this.createLeaveLobbyButton();
        this.renderLobbyState(this.network.lobby.lobbyState);
    }

    handleGameUpdate(msg) {
        switch (msg.type) {
            case SDRGame.Messaging.GameUpdates.GAME_STARTING:
                this._startNewScene('active-game', {
                    network: this.network,
                    initialState: msg.initialState
                });
                break;
            default:
                break;
        }
    }

    renderLobbyState(lobbyState) {
        // code
        // host
        // members [{ id, name, playerColor, shieldColor }]

        this.codeLabel.setText(this._formatLobbyCodeString(lobbyState.code));

        this.playerGraphicsList.forEach(p => p.destroy());
        this.playerGraphicsList = [];
        lobbyState.members.forEach((m, i) => {
            const playerShield = this.add.rectangle(40, -15, this.GameConstants.PLAYER_HITBOX_RADIUS*1.8, 25, m.shieldColor);
            const playerBall = this.add.circle(40, 0, this.GameConstants.PLAYER_HITBOX_RADIUS, m.playerColor);

            const name = m.id === this.network.lobby.playerId
                ? `${m.name} (you)`
                : m.name;
            const playerLabel = this.add.text(80, -10, name);

            const playerObjects = [playerShield, playerBall, playerLabel];

            if (m.id === lobbyState.host) {
                const hostIndicator = this.add.rectangle(0, 0, 10, 10, 0xe8d210);
                playerObjects.push(hostIndicator);
            }

            const container = this.add.container(40, 180 + 50 * i, playerObjects);

            this.playerGraphicsList.push(container);
        });

        this.createPlayerNameInput(lobbyState, 600, 200);
        this.createColorPicker(lobbyState, "Select Player Color:", "playerColor", 600, 300);
        this.createColorPicker(lobbyState, "Select Shield Color:", "shieldColor", 600, 450);

        if (this.network.lobby.playerId === lobbyState.host) {
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
        let currentPlayerState = lobbyState.members.find(m => m.id === this.network.lobby.playerId);
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
                            this.network.lobby.sendLobbyCommand(updateLobbyMemberCommand);
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
        if (event.target.name === 'changeNameButton')
        {
            let playerName = this.getPlayerNameText();
            let currentPlayerState = lobbyState.members.find(m => m.id === this.network.lobby.playerId);
            if (currentPlayerState && playerName)
            {
                currentPlayerState.name = playerName;
                const updateLobbyMemberCommand = SDRGame.Messaging.LobbyCommands.createUpdateLobbyMember(currentPlayerState);
                this.network.lobby.sendLobbyCommand(updateLobbyMemberCommand);
            }
        }
    }

    createStartButton() {
        this.startGameBtn = this.createButtonObject(600, 50, 'Start Game', () => {
            const command = SDRGame.Messaging.GameCommands.createStartGame();
            this.network.lobby.sendGameCommand(command);
        });

        this.hideStartButton();
    }

    createLeaveLobbyButton() {
        this.leaveLobbyBtn = this.createButtonObject(800, 50, 'Leave Lobby', () => {
            const command = SDRGame.Messaging.LobbyCommands.createLeaveLobby();
            this.network.lobby.sendLobbyCommand(command);

            this._startNewScene('home', { network: this.network, messages: [] });
        });
    }

    createButtonObject(x, y, label, onClick) {
        const btnText = this.add.text(0, 0, label);
        btnText.setOrigin(0.5, 0.5);
        const btnBack = this.add.rectangle(0, 0, btnText.width + 30, 40, 0x109ce8)
            .setInteractive({ cursor: 'pointer' })
            .on('pointerover', () => {
                btnBack.setFillStyle(0x4fb9f3);
            })
            .on('pointerout', () => {
                btnBack.setFillStyle(0x109ce8);
            })
            .on('pointerdown', onClick);

        return this.add.container(x, y, [btnBack, btnText]);
    }

    hideStartButton() {
        this.startGameBtn.setActive(false);
        this.startGameBtn.setVisible(false);
    }

    showStartButton() {
        this.startGameBtn.setActive(true);
        this.startGameBtn.setVisible(true);
    }

    _startNewScene(sceneName, sceneData) {
        this.network.lobby.unsubscribeFromAll();

        this.scene.start(sceneName, sceneData);
    }

    _formatLobbyCodeString(code) {
        return `Code: ${code}`;
    }
}
