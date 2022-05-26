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
- Huy: sound fx + music

## Features

Difficulty: 1-5 (5 highest)
Value: 1-5

- show when, where, what direction the next ball is spawning (3 D, 3 V)
- make it easier to join a lobby (3 D, 2 V)
  - option: shorter/simpler string of characters
  - option: add a button that copies the code to clipboard
  - option: inject html into phaser window (maybe possible)?
- implement powerups/upgrades in the game (5 D, 5 V)
- Possible add images for player icon/shield (5 D, 2 V)
- try implement entity interpolation in the client and lower the server broadcast rate to 20 Hz (3 D, 2 V)

## Polish

** Changes would be well isolated

- **make home scene look nice
  - maybe also show what the controls are for playing the game
- **make game screen (when the game is playing) look nice
- make lobby scene look nice
  - dependencies: lobby customization
- use a more rounded shield instead of a rectangle
  - requires changes to both server simulation and client rendering of shield
- **animations
  - getting eliminated
  - ball spawning
  - getting hit
