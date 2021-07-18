"use strict";

(function () {
	function byId(id) {
		return document.getElementById(id);
	}
	const DOM = {
		nav: {
			menuBtn: byId("menu-btn"),
			settingsBtn: byId("settings-btn"),
			newGameBtn: byId("newgame-btn"),
			mineCounter: document.querySelector("#mine-counter > span"),
			timer: {
				minutes: byId("timer-minutes"),
				seconds: byId("timer-seconds"),
			},
			hintBtn: byId("hint-btn"),
			markSwapBtn: byId("mark-btn")
		},
		playarea: {
			columnNums: byId("column-nums"),
			rowNums: byId("row-nums"),
			board: {
				tiles: null,
				container: byId("board"),
			},
			winOverlay: {
				container: byId("win-overlay"),
				newGameBtn: byId("win-new-game-btn"),
				viewBoardBtn: byId("win-view-board-btn"),
			},
			loseOverlay: {
				container: byId("lose-overlay"),
				newGameBtn: byId("lose-new-game-btn"),
				viewBoardBtn: byId("lose-view-board-btn"),
			},
		},
		modals: {
			container: byId("modals"),
			menu: {
				container: byId("menu-modal"),
				btns: byId("menu-modal-btns"),
			},
			settings: {
				container: byId("settings-modal"),
				boardSize: byId("settings-boardSize"),
				customBoard: {
					container: byId("settings-customBoard"),
					rows: byId("settings-boardHeight"),
					columns: byId("settings-boardWidth"),
					numOfMines: byId("settings-mineNum"),
					maxMines: byId("settings-maxMines")
				},
				boardApplyWarning: byId("settings-applywarning"),
				tileSize: byId("settings-tileSize"),
			},
		},
		markCircleDiv: byId("markCircle"),
		markCircle: document.querySelector("#markCircle circle"),
	};

	let board = [];

	class Tile {
		uncovered = false;
		hasMine = false;
		numOfNearbyMines = 0;
		markedAsEmpty = false;
	};

	const gameVars = {
		state: "initial", // 3 states available: initial (new game started, waiting for player to uncover first tile), underway (game in progress), finished (game won or lost, no input allowed on board)
		minesLeft: 20,
		hints: 1,
		hintMode: false,
		clickSwap: false,
		time: {
			minutes: 0,
			seconds: 0,
		},
		board: {
			rows: 10,
			columns: 10,
			numOfMines: 20,
		},
		boardSize: "small",
		rowMineCount: [],
		columnMineCount: [],
	};

	let settings = {
		board: {
			rows: 10,
			columns: 10,
			numOfMines: 20,
		},
		boardSize: "small",
		maxMines: 50
	};

	const boardSizes = {
		small: {
			rows: 10,
			columns: 10,
			numOfMines: 20,
		},
		medium: {
			rows: 15,
			columns: 15,
			numOfMines: 50,
		},
		large: {
			rows: 20,
			columns: 20,
			numOfMines: 90
		},
		verylarge: {
			rows: 30,
			columns: 30,
			numOfMines: 200
		}
	}

	let statistics = {
		small: {
			// Games won/lost/played, best time, longest winning/losing streaks, current streak
			gamesWon: 0,
			gamesLost: 0,
			bestTime: "",
			longestWinningStreak: 0,
			longestLosingStreak: 0,
			currentStreak: 0
		},
		medium: {
			gamesWon: 0,
			gamesLost: 0,
			bestTime: "",
			longestWinningStreak: 0,
			longestLosingStreak: 0,
			currentStreak: 0
		},
		large: {
			gamesWon: 0,
			gamesLost: 0,
			bestTime: "",
			longestWinningStreak: 0,
			longestLosingStreak: 0,
			currentStreak: 0
		},
		custom: {
			gamesWon: 0,
			gamesLost: 0,
			longestWinningStreak: 0,
			longestLosingStreak: 0,
			currentStreak: 0
		},
	};

	let clockInterval;

	// Mark circle

	let radius = DOM.markCircle.r.baseVal.value;
	let circumference = radius * 2 * Math.PI;

	DOM.markCircle.style.strokeDasharray = `${circumference} ${circumference}`;
	DOM.markCircle.style.strokeDashoffset = `${circumference}`;

	function setProgress(percent) {
		const offset = circumference - percent / 100 * circumference;
		DOM.markCircle.style.strokeDashoffset = offset;
	}

	function createEmptyBoard() {
		board = [];
		for (let i = 0; i < gameVars.board.rows; i++) {
			board[i] = [];
			for (let j = 0; j < gameVars.board.columns; j++) {
				board[i][j] = new Tile();
			}
		}
	}

	function populateBoard(firstTileRow, firstTileColumn, numOfMines) {
		let values = [];
		for (let i = 0; i < gameVars.board.rows; i++) {
			for (let j = 0; j < gameVars.board.columns; j++) {
				values.push({
					row: i,
					column: j
				});
			}
		}
		gameVars.rowMineCount = new Array(gameVars.board.rows).fill(0);
		gameVars.columnMineCount = new Array(gameVars.board.columns).fill(0);

		let firstTile = values.findIndex((tile) => {
			return tile.row == firstTileRow && tile.column == firstTileColumn;
		});

		if (firstTile != -1) {
			values.splice(firstTile, 1);
		}
		board[firstTileRow][firstTileColumn].hasMine = true;

		for (let i = 1; i < numOfMines; i++) {
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
		if (
			row < 0 ||
			row >= gameVars.board.rows ||
			column < 0 ||
			column >= gameVars.board.columns ||
			!board[row][column].hasMine
		) {
			return 0;
		} else {
			return 1;
		}
	}

	function countNearbyMines(row, column) {
		let count = 0;
		for (let i = -1; i <= 1; i++) {
			for (let j = -1; j <= 1; j++) {
				if (i == 0 && j == 0) {
					continue;
				}
				count += checkIfTileHasMine(row + i, column + j);
			}
		}
		board[row][column].numOfNearbyMines = count;
	}

	function getTileElement(row, column) {
		return DOM.playarea.board.container.querySelector(
			`[data-row="${row}"][data-column="${column}"]`
		);
	}

	function tileClick(row, column) {
		if (gameVars.state == "initial") {
			gameVars.state = "underway";
			populateBoard(row, column, gameVars.board.numOfMines);
			displayBorderNums();
			uncoverTile(row, column);
			DOM.nav.mineCounter.innerHTML = gameVars.minesLeft;
			clockInterval = setInterval(tickClock, 1000);
			if (gameVars.xyzzyActivated) {
				xyzzyInit();
			}
		} else if (gameVars.state == "underway") {
			if (gameVars.hintMode == true) {
				uncoverTile(row, column, true);
				gameVars.hints -= 1;
				DOM.nav.hintBtn.dataset.hints = gameVars.hints;
				if (gameVars.hints <= 0) {
					DOM.nav.hintBtn.classList.remove("hint-active");
					DOM.nav.hintBtn.classList.add("hint-disabled");
					gameVars.hintMode = false;
				}
			} else {
				uncoverTile(row, column);
			}
			DOM.nav.mineCounter.innerHTML = gameVars.minesLeft;
		}
	}

	let markMode = "none";

	function tileMark(row, column) {
		if (gameVars.state == "underway" && !board[row][column].uncovered) {
			if (!board[row][column].markedAsEmpty) {
				if (markMode == "none") {
					markMode = "mark";
				}
				if (markMode == "mark") {
					console.log("marking");
					board[row][column].markedAsEmpty = true;
					getTileElement(row, column).innerHTML = '<i class="icon-flag"></i>';
				}
			} else {
				if (markMode == "none") {
					markMode = "remove";
				}
				if (markMode == "remove") {
					console.log("removing");
					board[row][column].markedAsEmpty = false;
					getTileElement(row, column).innerHTML = "";
				}
			}
		}
	}

	function uncoverTile(row, column, fromMineClick = false, override = false) {
		if (
			(gameVars.state != "underway" && !override) ||
			row < 0 ||
			row >= gameVars.board.rows ||
			column < 0 ||
			column >= gameVars.board.columns ||
			board[row][column].uncovered
		) {
			return null;
		}

		if (board[row][column].hasMine && !board[row][column].markedAsEmpty) {
			getTileElement(row, column).innerHTML = "<i class='icon-mine'></i>";
			getTileElement(row, column).dataset.clickable = "false";
			board[row][column].uncovered = true;
			for (let i = -1; i <= 1; i++) {
				for (let j = -1; j <= 1; j++) {
					if (i == 0 && j == 0) {
						continue;
					}
					uncoverTile(row + i, column + j, true, override);
				}
			}
			gameVars.minesLeft--;
			if (gameVars.minesLeft == 0 && gameVars.state == "underway") {
				DOM.playarea.winOverlay.container.classList.remove("fade");
				DOM.playarea.winOverlay.container.classList.add("visible");
				DOM.playarea.board.container.classList.add("no-input");
				gameVars.state = "finished";
				clearInterval(clockInterval);
			}
		} else if (fromMineClick) {
			board[row][column].uncovered = true;
			board[row][column].markedAsEmpty = false;
			getTileElement(row, column).innerHTML = board[row][column].numOfNearbyMines;
			getTileElement(row, column).dataset.clickable = "false";
		} else if (
			!board[row][column].markedAsEmpty &&
			gameVars.state == "underway"
		) {
			getTileElement(row, column).classList.add("wrong-tile");
			DOM.playarea.loseOverlay.container.classList.remove("fade");
			DOM.playarea.loseOverlay.container.classList.add("visible");
			DOM.playarea.board.container.classList.add("no-input");
			gameVars.state = "finished";
			clearInterval(clockInterval);
		}
	}

	function uncoverBoard() {
		for (let row in board) {
			for (let column in board[row]) {
				if (board[row][column].hasMine && !board[row][column].uncovered) {
					getTileElement(row, column).innerHTML = "<i class='icon-mine'></i>";
					getTileElement(row, column).dataset.clickable = "false";
				} else {
					getTileElement(row, column).innerHTML = board[row][column].numOfNearbyMines;
				}
			}
		}
	}

	function tickClock() {
		gameVars.time.seconds++;
		if (gameVars.time.seconds >= 60) {
			gameVars.time.seconds -= 60;
			gameVars.time.minutes++;
		}

		if (gameVars.time.minutes <= 9) {
			DOM.nav.timer.minutes.innerHTML = `0${gameVars.time.minutes}`;
		} else {
			DOM.nav.timer.minutes.innerHTML = gameVars.time.minutes;
		}
		if (gameVars.time.seconds <= 9) {
			DOM.nav.timer.seconds.innerHTML = `0${gameVars.time.seconds}`;
		} else {
			DOM.nav.timer.seconds.innerHTML = gameVars.time.seconds;
		}
	}

	function displayEmptyBorderNums() {
		let html = "";

		for (let i = 0; i < gameVars.board.rows; i++) {
			html += `<div>#</div>`;
		}
		DOM.playarea.rowNums.innerHTML = html;
		html = "";

		for (let i = 0; i < gameVars.board.columns; i++) {
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

	let multiTouch = false;
	let markCircleTimeout;
	let markTouch = false;

	function displayBoard() {
		let html = "";
		for (let row in board) {
			html += `<div>`;
			for (let column in board[row]) {
				html += `<div data-row="${row}" data-column="${column}"></div>`;
			}
			html += "</div>";
		}
		DOM.playarea.board.container.innerHTML = html;
		DOM.playarea.board.tiles = document.querySelectorAll(
			"[data-row][data-column]"
		);

		for (let tile of DOM.playarea.board.tiles) {
			tile.addEventListener("pointerdown", evt => {
				if (!evt.isPrimary || multiTouch) {
					multiTouch = true;
					return;
				} else if (evt.button == 2) {
					tileMark(parseInt(tile.dataset.row), parseInt(tile.dataset.column), true);
				} else {
					markCircleTimeout = setTimeout(() => {
						DOM.markCircleDiv.classList.add("hold");
						setProgress(100);
						DOM.markCircleDiv.style.top = `${evt.clientY - 80}px`;
						DOM.markCircleDiv.style.left = `${evt.clientX - 80}px`;
						markCircleTimeout = setTimeout(() => {
							DOM.markCircle.style.stroke = "#0007";
							markTouch = true;
							DOM.playarea.board.container.style.touchAction = "none";
							tileMark(parseInt(tile.dataset.row), parseInt(tile.dataset.column))
						}, 400)
					}, 300)
				}
				evt.target.releasePointerCapture(evt.pointerId);
			})
			tile.addEventListener("pointerup", (evt) => {
				if (!evt.isPrimary) {
					return;
				} else if (evt.isPrimary && multiTouch) {
					multiTouch = false;
					return;
				}
				if (!markTouch && evt.button == 0) {
					tileClick(parseInt(tile.dataset.row), parseInt(tile.dataset.column));
				}
				clearTimeout(markCircleTimeout);
			});
			tile.addEventListener("contextmenu", (evt) => {
				evt.preventDefault();
				return false;
			});
			tile.addEventListener("pointermove", evt => {
				if (!evt.isPrimary) {
					return;
				}
				DOM.markCircleDiv.style.top = `${evt.clientY - 80}px`;
				DOM.markCircleDiv.style.left = `${evt.clientX - 80}px`;
			})
			tile.addEventListener("pointerenter", (evt) => {
				if (!evt.isPrimary) {
					return;
				}
				if (markTouch || evt.buttons == 2) {
					tileMark(parseInt(tile.dataset.row), parseInt(tile.dataset.column));
				}
			});
			tile.addEventListener("pointercancel", evt => {
				DOM.markCircleDiv.classList.remove("hold");
				DOM.markCircle.style.stroke = "#000F";
				setProgress(0);
				clearTimeout(markCircleTimeout);
				markTouch = false;
				markMode = "none";
			})
		}
	}

	document.body.addEventListener("pointerup", () => {
		DOM.markCircleDiv.classList.remove("hold");
		DOM.markCircle.style.stroke = "#000F";
		setProgress(0);
		markTouch = false;
		DOM.playarea.board.container.style.removeProperty("touch-action");
		clearTimeout(markCircleTimeout);
		markMode = "none";
	})

	function newGame() {
		gameVars.boardSize = settings.boardSize;
		if (settings.boardSize != "custom") {
			Object.assign(gameVars.board, boardSizes[gameVars.boardSize]);
		} else {
			Object.assign(gameVars.board, settings.board);
		}
		DOM.modals.settings.boardApplyWarning.style.removeProperty("display");
		gameVars.hints = 1 + Math.floor(gameVars.board.columns * gameVars.board.rows / 400);
		gameVars.hintMode = false;
		DOM.nav.hintBtn.dataset.hints = gameVars.hints;
		DOM.nav.hintBtn.classList.remove("hint-active");
		DOM.nav.hintBtn.classList.remove("hint-disabled");
		createEmptyBoard();
		displayBoard();
		displayEmptyBorderNums();
		gameVars.state = "initial";
		clearInterval(clockInterval);
		gameVars.time.minutes = gameVars.time.seconds = 0;
		DOM.nav.timer.minutes.innerHTML = DOM.nav.timer.seconds.innerHTML = "00";
		DOM.playarea.board.container.classList.remove("no-input");
		DOM.nav.mineCounter.innerHTML = gameVars.minesLeft = gameVars.board.numOfMines;
	}

	DOM.nav.newGameBtn.addEventListener("click", evt => {
		newGame();
	});

	DOM.nav.hintBtn.addEventListener("click", () => {
		if (gameVars.hints >= 1) {
			DOM.nav.hintBtn.classList.toggle("hint-active");
			gameVars.hintMode = !gameVars.hintMode;
		}
	})

	document.querySelectorAll("[data-modalopen]").forEach(el => {
		el.addEventListener("click", () => {
			DOM.modals.container.classList.add("visible");
			DOM.modals.container.classList.remove("fade");
			document.querySelector(el.dataset.modalopen).classList.add("visible");
			document.querySelector(el.dataset.modalopen).classList.remove("fade");
		});
	});
	document.querySelectorAll(".modal-close").forEach(el => {
		el.addEventListener("click", () => {
			DOM.modals.container.classList.add("fade");
			DOM.modals.container.classList.remove("visible");
			el.parentNode.parentNode.classList.add("fade");
			el.parentNode.parentNode.classList.remove("visible");
		});
	});

	DOM.modals.settings.container.querySelector(".modal-close").addEventListener("click", () => {
		if (gameVars.state != "underway") {
			newGame();
		}
	})

	document.querySelectorAll(".modal").forEach(el => {
		el.addEventListener("click", evt => {
			if (evt.target === evt.currentTarget) {
				DOM.modals.container.classList.add("fade");
				DOM.modals.container.classList.remove("visible");
				el.classList.add("fade");
				el.classList.remove("visible");
			}
		})
	})
	DOM.modals.settings.container.addEventListener("click", () => {
		if (gameVars.state != "underway") {
			newGame();
		}
	})
	DOM.modals.menu.btns.querySelectorAll("button").forEach((el) => {
		el.addEventListener("click", () => {
			DOM.modals.menu.container.classList.add("fade");
			DOM.modals.menu.container.classList.remove("visible");
		});
	});

	DOM.playarea.board.container.addEventListener("scroll", () => {
		DOM.playarea.rowNums.scroll(0, DOM.playarea.board.container.scrollTop);
		DOM.playarea.columnNums.scroll(DOM.playarea.board.container.scrollLeft, 0);
	}, {
		passive: true
	})

	DOM.playarea.winOverlay.newGameBtn.addEventListener("click", () => {
		newGame();
		DOM.playarea.winOverlay.container.classList.add("fade");
		DOM.playarea.winOverlay.container.classList.remove("visible");
	});
	DOM.playarea.winOverlay.viewBoardBtn.addEventListener("click", () => {
		DOM.playarea.winOverlay.container.classList.add("fade");
		DOM.playarea.winOverlay.container.classList.remove("visible");
	});
	DOM.playarea.loseOverlay.newGameBtn.addEventListener("click", () => {
		newGame();
		DOM.playarea.loseOverlay.container.classList.add("fade");
		DOM.playarea.loseOverlay.container.classList.remove("visible");
	});
	DOM.playarea.loseOverlay.viewBoardBtn.addEventListener("click", () => {
		DOM.playarea.loseOverlay.container.classList.add("fade");
		DOM.playarea.loseOverlay.container.classList.remove("visible");
		uncoverBoard();
	});

	// Settings event listeners

	DOM.modals.settings.boardSize.addEventListener("change", evt => {
		settings.boardSize = evt.target.value;
		if (gameVars.state == "underway") {
			DOM.modals.settings.boardApplyWarning.style.display = "block";
		}
	})

	const numbersOnlyRegex = /^[0-9]+$/g;

	DOM.modals.settings.customBoard.columns.addEventListener("input", evt => {
		evt.target.value = evt.target.value.match(numbersOnlyRegex);
		if (!evt.target.value) {
			settings.board.columns = 5;
		} else if (evt.target.value > 100 && !customBoardUnlimited) {
			evt.target.value = 100;
			settings.board.columns = parseInt(evt.target.value);
		} else {
			settings.board.columns = parseInt(evt.target.value);
		}
		calculateMaxMines();
		if (gameVars.state == "underway") {
			DOM.modals.settings.boardApplyWarning.style.display = "block";
		}
	})
	DOM.modals.settings.customBoard.columns.addEventListener("blur", evt => {
		if (!evt.target.value || evt.target.value < 5) {
			evt.target.value = 5;
		} else if (evt.target.value > 100 && !customBoardUnlimited) {
			evt.target.value = 100;
		}
		settings.board.columns = parseInt(evt.target.value);
		calculateMaxMines();
		if (gameVars.state == "underway") {
			DOM.modals.settings.boardApplyWarning.style.display = "block";
		}
	})

	DOM.modals.settings.customBoard.rows.addEventListener("input", evt => {
		evt.target.value = evt.target.value.match(numbersOnlyRegex);
		if (evt.target.value == "") {
			settings.board.rows = 5;
		} else if (evt.target.value > 100 && !customBoardUnlimited) {
			evt.target.value = 100;
			settings.board.rows = parseInt(evt.target.value);
		} else {
			settings.board.rows = parseInt(evt.target.value);
		}
		calculateMaxMines();
		if (gameVars.state == "underway") {
			DOM.modals.settings.boardApplyWarning.style.display = "block";
		}
	})
	DOM.modals.settings.customBoard.rows.addEventListener("blur", evt => {
		if (evt.target.value == "" || evt.target.value < 5) {
			evt.target.value = 5;
		} else if (evt.target.value > 100 && !customBoardUnlimited) {
			evt.target.value = 100;
		}
		settings.board.rows = parseInt(evt.target.value);
		calculateMaxMines();
		if (gameVars.state == "underway") {
			DOM.modals.settings.boardApplyWarning.style.display = "block";
		}
	})

	DOM.modals.settings.customBoard.numOfMines.addEventListener("input", evt => {
		if (evt.target.value > settings.maxMines) {
			evt.target.value = settings.maxMines;
		} else if (evt.target.value < 2 || !evt.target.value) {
			evt.target.value = 2;
		}
		settings.board.numOfMines = parseInt(evt.target.value);
		if (gameVars.state == "underway") {
			DOM.modals.settings.boardApplyWarning.style.display = "block";
		} else {
			gameVars.board.numOfMines = parseInt(evt.target.value);
		}
	})

	DOM.nav.markSwapBtn.addEventListener("click", () => {
		gameVars.clickSwap = !gameVars.clickSwap;
		if (gameVars.clickSwap) {
			DOM.nav.markSwapBtn.innerHTML = '<i class="icon-flag"></i>';
			DOM.playarea.board.container.classList.add("no-scroll");
		} else {
			DOM.nav.markSwapBtn.innerHTML = '<i class="icon-mine"></i>';
			DOM.playarea.board.container.classList.remove("no-scroll");
		}
	})

	const mobileQuery = window.matchMedia('only screen and (max-width: 767px)');
	mobileQuery.addEventListener("change", evt => {
		if (!evt.matches) {
			gameVars.clickSwap = false;
			DOM.playarea.board.container.classList.remove("no-scroll");
			DOM.nav.markSwapBtn.innerHTML = '<i class="icon-mine"></i>'
		}
	})

	function calculateMaxMines() {
		let maxMines = Math.floor(settings.board.columns * settings.board.rows / 2);
		if (maxMines < 25) {
			maxMines = 25;
		}
		DOM.modals.settings.customBoard.maxMines.innerHTML = settings.maxMines = maxMines;
		if (DOM.modals.settings.customBoard.numOfMines.value > settings.maxMines) {
			DOM.modals.settings.customBoard.numOfMines.value = settings.maxMines;
		}
		settings.board.numOfMines = parseInt(DOM.modals.settings.customBoard.numOfMines.value);
	}

	// Handle showing custom board sizes
	DOM.modals.settings.boardSize.addEventListener("change", evt => {
		DOM.modals.settings.customBoard.container.style.height = `${DOM.modals.settings.customBoard.container.scrollHeight}px`;
		if (evt.target.value == "custom") {
			DOM.modals.settings.customBoard.container.classList.add("open");
			DOM.modals.settings.customBoard.container.addEventListener("transitionend", () => {
				DOM.modals.settings.customBoard.container.style.removeProperty("height");
			}, {
				once: true
			})
		} else {
			DOM.modals.settings.customBoard.container.classList.remove("open");
			window.setTimeout(() => {
				DOM.modals.settings.customBoard.container.style.removeProperty("height");
			})
		}
	})

	let root = document.documentElement;

	DOM.modals.settings.tileSize.addEventListener("input", evt => {
		root.style.setProperty('--tile-size', `${evt.target.value}px`);
	})

	newGame();

	const urlParams = new URLSearchParams(window.location.search);
	let customBoardUnlimited = false;
	if (urlParams.has('customBoardUnlimited')) {
		bulkUnlimited = true;
	}


	// Value Bubbles for Range Inputs
	// https://codepen.io/chriscoyier/pen/eYNQyPe

	const allRanges = document.querySelectorAll(".range-wrap");
	allRanges.forEach(wrap => {
		const range = wrap.querySelector('[type="range"]');
		const bubble = wrap.querySelector(".bubble");

		range.addEventListener("input", () => {
			setBubble(range, bubble);
		});
		setBubble(range, bubble);
	});

	function setBubble(range, bubble) {
		const val = range.value;
		const min = range.min ? range.min : 0;
		const max = range.max ? range.max : 100;
		const newVal = Number(((val - min) * 100) / (max - min));
		bubble.innerHTML = val;

		// Sorta magic numbers based on size of the native UI thumb
		bubble.style.left = `calc(${newVal}% + (${8 - newVal * 0.15}px))`;
	}

	// Xyzzy easter egg code

	let xyzzyPassword = "xyzzy";
	let passwordPosition = 0;
	let xyzzyPixel = byId("xyzzypixel");
	document.onkeydown = (evt) => {
		if (evt.key == xyzzyPassword[passwordPosition]) {
			passwordPosition++;
		} else {
			passwordPosition = 0;
		}
		if (passwordPosition >= 5) {
			xyzzyInit();
			gameVars.xyzzyActivated = true;
			document.onkeydown = (evt) => {
				if (evt.key == "Shift") {
					gameVars.xyzzyShift = true;
				}
			};
			document.onkeyup = (evt) => {
				if (evt.key == "Shift") {
					gameVars.xyzzyShift = false;
				}
			};
		}
	};

	function xyzzyInit() {
		DOM.playarea.board.tiles.forEach((el) => {
			el.addEventListener("mouseover", () => {
				if (gameVars.xyzzyShift) {
					if (board[el.dataset.row][el.dataset.column].hasMine) {
						xyzzyPixel.style.backgroundColor = "#000";
					} else {
						xyzzyPixel.style.backgroundColor = "#FFF";
					}
				}
			});
		});
	}
})();