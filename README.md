![image](https://user-images.githubusercontent.com/84749026/165859842-91b034a9-6b9a-4e04-ac06-4037b3918a5b.png)

![image](https://img.shields.io/badge/awesome-yes-blue)

Team :lizard:LETS G:boom::boom::boom::exploding_head::boom::boom::boom:'s hackathon

Play the game: <https://super-dodgeball-royale.herokuapp.com/>

# Prerequisites

run `npm install -g browserify`

Run `npm install`

# Running Locally

Open the file `appsettings.js` and change `USE_LOCAL_SETTINGS` to `true`.
Remember to change this back before merging to main.

Start the game server: `npm run start-server`

Make the frontend javascript bundle: `npm run mkbundle`. It's a good habit to rebuild the bundle every time you make changes.

Start the frontend server: `npm run start-client`

App is running on `http://localhost:8080`
Server is running on `ws://localhost:8090`

:)!
