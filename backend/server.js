const http = require("http");
const httpServer = http.createServer();

const { initGame, gameLoop, getUpdatedVelocity } = require("./game.js");
const { makeID } = require("./utils.js");
const { FRAMERATE } = require("./constants.js");

const state = {};
const clientRooms = {};

const io = require("socket.io")(httpServer, {
    cors: {
        origin: "*",
    },
});

io.on("connection", (client) => {
    client.on("keydown", handleKeydown);
    client.on("newGame", handleNewGame);
    client.on("joinGame", handleJoinGame);

    function startGameInterval(room) {
        const intervalID = setInterval(() => {
            const winner = gameLoop(state[room]);

            if (!winner) {
                emitGameState(room, state[room]);
            } else {
                emitGameOver(room, winner);
                clearInterval(intervalID);
            }
        }, 1000 / FRAMERATE);
    }

    function handleNewGame() {
        let roomName = makeID(5);
        clientRooms[client.id] = roomName;
        client.emit("gameCode", roomName);

        state[roomName] = initGame();

        client.join(roomName);
        client.number = 1;
        client.emit("init", 1);
    }

    function handleJoinGame(gameCode) {
        const room = io.sockets.adapter.rooms.get(gameCode);

        let numClients = 0;

        if (room) {
            numClients = room.size;
        }

        if (!numClients) {
            client.emit("unknowGame");
            return;
        }

        if (numClients > 1) {
            client.emit("tooManyPlayers");
            return;
        }

        clientRooms[client.id] = gameCode;

        client.join(gameCode);
        client.number = 2;
        client.emit("init", 2);

        startGameInterval(gameCode);
    }

    function handleKeydown(keyCode) {
        const room = clientRooms[client.id];

        if (!room) {
            return;
        }

        try {
            keyCode = parseInt(keyCode);
        } catch (err) {
            console.log(err);
            return;
        }

        const vel = getUpdatedVelocity(keyCode, state[room].players[client.number - 1].vel);

        if (vel) {
            state[room].players[client.number - 1].vel = vel;
        }
    }
});

function emitGameState(room, state) {
    io.to(room).emit("gameState", JSON.stringify(state));
}

function emitGameOver(room, winner) {
    io.to(room).emit("gameOver", JSON.stringify({ winner }));

    for (const key in clientRooms) {
        if (clientRooms[key] === room) {
            delete clientRooms[key];
        }
    }

    delete state[room];

    io.socketsLeave(room);
}

io.listen(3000);
