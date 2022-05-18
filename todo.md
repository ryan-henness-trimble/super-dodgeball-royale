# Potential Todo Items

## Priority

- Ryan: Host the game as it is and try playing it
  - need to move hardcoded settings process variables or env
  - hardcoded settings:
    - server url (SceneMain.js)
    - cors and server port (testserver.js)
- Ryan: maps
  - have more maps
  - be able to choose map from lobby
- Cole: finish the flow for a full game
  - show a winner/scoreboard
  - return to lobby screen
- Huy: sound fx + music
- Lane: lobby customization
  - player color/image (provide a restricted amount of options)
  - player name (restrict # of characters)
  - shield color/image (provide a restricted amount of options)

## Features

Difficulty: 1-5 (5 highest)
Value: 1-5

- leave lobby button (1 D, 3 V)
- show when, where, what direction the next ball is spawning (3 D, 3 V)
- make it easier to join a lobby (3 D, 2 V)
  - option: shorter/simpler string of characters
  - option: add a button that copies the code to clipboard
  - option: inject html into phaser window (maybe possible)?
- implement powerups/upgrades in the game (5 D, 5 V)
- try implement entity interpolation in the client and lower the server broadcast rate to 20 Hz (3 D, 2 V)

## Polish

** Changes would be well isolated

- **make home scene look nice
  - maybe also show what the controls are for playing the game
- **make game screen (when the game is playing) look nice
- make lobby scene look nice
  - dependencies: lobby customization, leave lobby functionality
- use a more rounded shield instead of a rectangle
  - requires changes to both server simulation and client rendering of shield
- **animations
  - getting eliminated
  - ball spawning
  - getting hit
