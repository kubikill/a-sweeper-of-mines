class Tile {
    uncovered = false;
    hasMine = false;
    numOfNearbyMines = 0;
    markedAsEmpty = false;
}

let board = [];
let boardRows = 10;
let boardColumns = 10;
let numOfMines = 20;
let boardRowMineCount = [];
let boardColumnMineCount = [];
let gameInProgress = false;

function byId(id) {
    return document.getElementById(id);
}
const DOM = {
    playarea: {
        columnNums: byId("column-nums"),
        rowNums: byId("row-nums"),
        board: {
            tiles: null,
            container: byId("board")
        }
    }
}

function createEmptyBoard() {
    board = [];
    for (let i=0; i < boardRows; i++) {
        board[i] = [];
        for (let j=0; j < boardColumns; j++) {
            board[i][j] = new Tile;
        }
    }
}

function populateBoard(firstTileRow, firstTileColumn, numOfMines) {
    let values = [];
    for (let i=0; i < boardRows; i++) {
        for (let j=0; j < boardColumns; j++) {
            values.push({row: i, column: j});
        }
    }
    boardRowMineCount = new Array(boardRows).fill(0);
    boardColumnMineCount = new Array(boardColumns).fill(0);
    
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
                boardRowMineCount[row]++;
                boardColumnMineCount[column]++;
            }
        }
    }
}

function checkIfTileHasMine(row, column) {
    if (row < 0 || row >= boardRows || column < 0 || column >= boardColumns || !board[row][column].hasMine) {
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

function displayBorderNums() {
    let html = "";

    for (let row of boardRowMineCount) {
        html += `<div>${row}</div>`;
    }
    DOM.playarea.rowNums.innerHTML = html;
    html = "";

    for (let column of boardColumnMineCount) {
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
    if (!gameInProgress) {
        gameInProgress = true;
        populateBoard(row, column, numOfMines);
        displayBorderNums();
        console.log(board);
    }
    uncoverTile(row, column);
}
function tileMark(row, column) {
    if (gameInProgress && !board[row][column].uncovered) {
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

function uncoverTile(row, column, fromMineClick = false) {
    if (row < 0 || row >= boardRows || column < 0 || column >= boardColumns || board[row][column].uncovered) {
        return null;
    }
    if (board[row][column].hasMine && !board[row][column].markedAsEmpty) {
        getDOMTile(row, column).innerHTML = "#";
        board[row][column].uncovered = true;
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i==0 && j==0) {
                    continue;
                }
                uncoverTile(row+i, column+j, true)
            }
        }
    } else if (fromMineClick) {
        board[row][column].uncovered = true;
        board[row][column].markedAsEmpty = false;
        getDOMTile(row, column).innerHTML = board[row][column].numOfNearbyMines;
    }
    return null;
}

createEmptyBoard();
displayBoard();