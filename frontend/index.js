const BG_COLOR = "#231F20";
const SNAKE_COLOR1 = "#707070";
const SNAKE_COLOR2 = "#430430";
const FOOD_COLOR = "#E66916";

const socket = io("https://snakegame-y4x1.onrender.com");
socket.on("init", handleInit);
socket.on("gameState", handleGameState);
socket.on("gameOver", handleGameOver);
socket.on("gameCode", handleGameCode);
socket.on("unknowGame", handleUnknowGame);
socket.on("tooManyPlayers", handleTooManyPlayers);

const gameScreen = document.querySelector("#gameScreen");
const initialScreen = document.querySelector("#initialScreen");
const newGameBtn = document.querySelector("#newGameButton");
const joinGameBtn = document.querySelector("#joinGameButton");
const gameCodeInput = document.querySelector("#gameCodeInput");
const gameCodeDisplay = document.querySelector("#gameCodeDisplay");

newGameBtn.addEventListener("click", newGame);
joinGameBtn.addEventListener("click", joinGame);

function newGame() {
    socket.emit("newGame");
    init();
}

function joinGame() {
    const code = gameCodeInput.value;
    socket.emit("joinGame", code);
    init();
}

let canvas, ctx;
let playerNumber;
let gameActive = false;

function init() {
    initialScreen.style.display = "none";
    gameScreen.style.display = "block";

    canvas = document.querySelector("#canvas");
    ctx = canvas.getContext("2d");

    canvas.width = canvas.height = 600;

    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    document.addEventListener("keydown", keydown);
    gameActive = true;
}

function keydown(e) {
    socket.emit("keydown", e.keyCode);
}

function paintGame(state) {
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const food = state.food;
    const gridsize = state.gridsize;
    const size = canvas.width / gridsize;

    ctx.fillStyle = FOOD_COLOR;
    ctx.fillRect(food.x * size, food.y * size, size, size);

    console.log("A");
    paintPlayer(state.players[0], size, SNAKE_COLOR1);
    paintPlayer(state.players[1], size, SNAKE_COLOR2);
}

function paintPlayer(playerState, size, color) {
    console.log(playerState);
    const snake = playerState.snake;

    ctx.fillStyle = color;
    for (let cell of snake) {
        ctx.fillRect(cell.x * size, cell.y * size, size, size);
    }
}

function handleInit(number) {
    playerNumber = number;
}

function handleGameState(gameState) {
    if (!gameActive) return;

    gameState = JSON.parse(gameState);
    requestAnimationFrame(() => paintGame(gameState));
}

function handleGameOver(data) {
    console.log("B");
    if (!gameActive) return;

    data = JSON.parse(data);

    if (data.winner === playerNumber) alert("You Win!");
    else alert("You Lose!");

    gameActive = false;
    reset();
}

function handleGameCode(gameCode) {
    gameCodeDisplay.innerText = gameCode;
}

function handleUnknowGame() {
    reset();
    alert("Unknow game code");
}

function handleTooManyPlayers() {
    reset();
    alert("This game is already in progress");
}

function reset() {
    playerNumber = null;
    gameCodeInput.value = "";
    gameCodeDisplay.innerText = "";
    initialScreen.style.display = "block";
    gameScreen.style.display = "none";
}
