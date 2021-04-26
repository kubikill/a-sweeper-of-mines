"use strict";
class Tile {
    uncovered = false;
    hasMine = false;
    numOfNearbyMines = 0;
    markedAsEmpty = false;
}

const settings = {
    board: {
        rows: 10,
        columns: 10,
        numOfMines: 20
    }
}

const gameVars = {
    state: "initial", // 3 states available: initial (new game started, waiting for player to uncover first tile), underway (game in progress), finished (game won or lost, no input allowed on board)
    minesLeft: 20,
    time: {
        minutes: 0,
        seconds: 0
    },
    rowMineCount: [],
    columnMineCount: []
}

let board = [];

function byId(id) {
    return document.getElementById(id);
}
const DOM = {
    nav: {
        menuBtn: byId("menu-btn"),
        newGameBtn: byId("newgame-btn"),
        mineCounter: document.querySelector("#mine-counter > span"),
        timer: {
            minutes: byId("#timer-minutes"),
            seconds: byId("#timer-seconds")
        }
    },
    playarea: {
        columnNums: byId("column-nums"),
        rowNums: byId("row-nums"),
        board: {
            tiles: null,
            container: byId("board")
        },
        winOverlay: {
            container: byId("win-overlay"),
            newGameBtn: byId("win-new-game-btn"),
            viewBoardBtn: byId("win-view-board-btn")
        },
        loseOverlay: {
            container: byId("lose-overlay"),
            newGameBtn: byId("lose-new-game-btn"),
            viewBoardBtn: byId("lose-view-board-btn")
        },
    },
    modals: {
        menu: byId("menu-modal")
    }
}

function createEmptyBoard() {
    board = [];
    for (let i=0; i < settings.board.rows; i++) {
        board[i] = [];
        for (let j=0; j < settings.board.columns; j++) {
            board[i][j] = new Tile;
        }
    }
}

function populateBoard(firstTileRow, firstTileColumn, numOfMines) {
    let values = [];
    for (let i=0; i < settings.board.rows; i++) {
        for (let j=0; j < settings.board.columns; j++) {
            values.push({row: i, column: j});
        }
    }
    gameVars.rowMineCount = new Array(settings.board.rows).fill(0);
    gameVars.columnMineCount = new Array(settings.board.columns).fill(0);
    
    let firstTile = values.findIndex(tile => {
        return tile.row == firstTileRow && tile.column == firstTileColumn
    })

    if (firstTile != -1) {
        values.splice(firstTile, 1);
    }
    board[firstTileRow][firstTileColumn].hasMine = true;

    for (let i=1; i < numOfMines; i++) {
        let random = Math.floor(Math.random() * values.length);
        board[values[random].row][values[random].column].hasMine = true;
        values.splice(random, 1);
    }

    // Assign numbers to each tile, and count mines in each row and column
    for (let row in board) {
        for (let column in board[row]) {
            countNearbyMines(parseInt(row), parseInt(column));
            if (board[row][column].hasMine) {
                gameVars.rowMineCount[row]++;
                gameVars.columnMineCount[column]++;
            }
        }
    }
}

function checkIfTileHasMine(row, column) {
    if (row < 0 || row >= settings.board.rows || column < 0 || column >= settings.board.columns || !board[row][column].hasMine) {
        return 0;
    } else {
        return 1;
    }
}

function countNearbyMines(row, column) {
    let count = 0;
    for (let i= -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            if (i==0 && j==0) {
                continue;
            }
            count += checkIfTileHasMine(row+i, column+j);
        }
    }
    board[row][column].numOfNearbyMines = count;
}

function displayEmptyBorderNums() {
    let html = "";

    for (let i=0; i < settings.board.rows; i++) {
        html += `<div>#</div>`;
    }
    DOM.playarea.rowNums.innerHTML = html;
    html = "";

    for (let i=0; i < settings.board.columns; i++) {
        html += `<div>#</div>`;
    }
    DOM.playarea.columnNums.innerHTML = html;
}

function displayBorderNums() {
    let html = "";

    for (let row of gameVars.rowMineCount) {
        html += `<div>${row}</div>`;
    }
    DOM.playarea.rowNums.innerHTML = html;
    html = "";

    for (let column of gameVars.columnMineCount) {
        html += `<div>${column}</div>`;
    }
    DOM.playarea.columnNums.innerHTML = html;
}
function displayBoard() {
    let html = "";
    for (let row in board) {
        html += `<div>`;
        for (let column in board[row]) {
            html += `<div data-row="${row}" data-column="${column}"></div>`
        }
        html += "</div>";
    }
    DOM.playarea.board.container.innerHTML = html;
    DOM.playarea.board.tiles = document.querySelectorAll("[data-row][data-column]");

    for (let tile of DOM.playarea.board.tiles) {
        tile.addEventListener("mousedown", evt => {
            switch(evt.which) {
                case 1:
                    tileClick(parseInt(tile.dataset.row), parseInt(tile.dataset.column));
                    break;
                case 3:
                    tileMark(parseInt(tile.dataset.row), parseInt(tile.dataset.column));
                    break;
            }
        })
        tile.addEventListener("contextmenu", evt => {
            evt.preventDefault();
            return false;
        })
        tile.addEventListener("mouseenter", evt => {
            if (evt.which == 3) {
                tileMark(parseInt(tile.dataset.row), parseInt(tile.dataset.column));
            }
        })
    }
}

function tileClick(row, column) {
    if (gameVars.state == "initial") {
        gameVars.state = "underway";
        populateBoard(row, column, settings.board.numOfMines);
        displayBorderNums();
        uncoverTile(row, column);
        DOM.nav.mineCounter.innerHTML = gameVars.minesLeft;
        if (gameVars.nothingToSeeHere) {
            superSecret();
        }
    } else if (gameVars.state == "underway") {
        uncoverTile(row, column);
        DOM.nav.mineCounter.innerHTML = gameVars.minesLeft;
    }
}
function tileMark(row, column) {
    if (gameVars.state == "underway" && !board[row][column].uncovered) {
        board[row][column].markedAsEmpty = !board[row][column].markedAsEmpty;
        if (board[row][column].markedAsEmpty) {
            getDOMTile(row, column).innerHTML = "X";
        } else {
            getDOMTile(row, column).innerHTML = "";
        }
    }
}
function getDOMTile(row, column) {
    return DOM.playarea.board.container.querySelector(`[data-row="${row}"][data-column="${column}"]`);
}

function uncoverTile(row, column, fromMineClick = false, override = false) {
    if ((gameVars.state != "underway" && !override) || row < 0 || row >= settings.board.rows || column < 0 || column >= settings.board.columns || board[row][column].uncovered) {
        return null;
    }
    if (board[row][column].hasMine && !board[row][column].markedAsEmpty) {
        getDOMTile(row, column).innerHTML = "<i class='icon-mine'></i>";
        getDOMTile(row, column).dataset.clickable = "false";
        board[row][column].uncovered = true;
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i==0 && j==0) {
                    continue;
                }
                uncoverTile(row+i, column+j, true, override)
            }
        }
        gameVars.minesLeft--;
        if (gameVars.minesLeft == 0 && gameVars.state == "underway") {
            DOM.playarea.winOverlay.container.classList.remove("fade");
            DOM.playarea.winOverlay.container.classList.add("visible");
            DOM.playarea.board.container.classList.add("no-input");
            gameVars.state = "finished";
        }
    } else if (fromMineClick) {
        board[row][column].uncovered = true;
        board[row][column].markedAsEmpty = false;
        getDOMTile(row, column).innerHTML = board[row][column].numOfNearbyMines;
        getDOMTile(row, column).dataset.clickable = "false";
    } else if (!board[row][column].markedAsEmpty && gameVars.state == "underway") {
        getDOMTile(row, column).classList.add("wrong-tile");
        DOM.playarea.loseOverlay.container.classList.remove("fade");
        DOM.playarea.loseOverlay.container.classList.add("visible");
        DOM.playarea.board.container.classList.add("no-input");
        gameVars.state = "finished";
    }
}

function uncoverBoard() {
    for (let row in board) {
        for (let column in board[row]) {
            if (board[row][column].hasMine && !board[row][column].uncovered) {
                board[row][column].markedAsEmpty = false;
                uncoverTile(parseInt(row), parseInt(column), false, true);
            } else if (!board[row][column].hasMine && board[row][column].numOfNearbyMines == 0) {
                getDOMTile(row, column).innerHTML = "#";
            }
        }
    }
}

function newGame() {
    createEmptyBoard();
    displayBoard();
    displayEmptyBorderNums();
    gameVars.state = "initial";
    DOM.playarea.board.container.classList.remove("no-input");
    DOM.nav.mineCounter.innerHTML = gameVars.minesLeft = settings.board.numOfMines;
}

DOM.nav.newGameBtn.addEventListener("click", () => {
    newGame();
});

DOM.nav.menuBtn.addEventListener("click", () => {
    DOM.modals.menu.classList.remove("fade");
    DOM.modals.menu.classList.add("visible");
})
document.querySelectorAll(".modal-close").forEach(el => {
    el.addEventListener("click", () => {
        el.parentNode.parentNode.classList.add("fade");
        el.parentNode.parentNode.classList.remove("visible");
    })
})

DOM.playarea.winOverlay.newGameBtn.addEventListener("click", () => {
    newGame();
    DOM.playarea.winOverlay.container.classList.add("fade");
    DOM.playarea.winOverlay.container.classList.remove("visible");
})
DOM.playarea.winOverlay.viewBoardBtn.addEventListener("click", () => {
    DOM.playarea.winOverlay.container.classList.add("fade");
    DOM.playarea.winOverlay.container.classList.remove("visible");
})
DOM.playarea.loseOverlay.newGameBtn.addEventListener("click", () => {
    newGame();
    DOM.playarea.loseOverlay.container.classList.add("fade");
    DOM.playarea.loseOverlay.container.classList.remove("visible");
})
DOM.playarea.loseOverlay.viewBoardBtn.addEventListener("click", () => {
    DOM.playarea.loseOverlay.container.classList.add("fade");
    DOM.playarea.loseOverlay.container.classList.remove("visible");
    uncoverBoard();
})
newGame();

let foo = "xyzzy";
let bar = 0;
let nullllun = byId("foobar");
document.onkeydown = evt => {
    if (evt.key == foo[bar]) {
        bar++;
    } else {
        bar = 0;
    }
    if (bar >= 5) {
        superSecret();
        gameVars.nothingToSeeHere = true;
        document.onkeydown = evt => {
            if (evt.key == "Shift") {
                gameVars.moveAlong = true;
            }
        }
        document.onkeyup = evt => {
            if (evt.key == "Shift") {
                gameVars.moveAlong = false;
            }
        }
    }
}

function superSecret() {
    DOM.playarea.board.tiles.forEach(el => {
        el.addEventListener("mouseover", () => {
            if (gameVars.moveAlong) {
                if (board[el.dataset.row][el.dataset.column].hasMine) {
                    nullllun.style.backgroundColor = "#000";
                } else {
                    nullllun.style.backgroundColor = "#FFF";
                }
            }
        })
    })
}