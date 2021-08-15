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
			mineBtn: byId("mine-btn"),
			markBtn: byId("mark-btn")
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
				time: byId("win-time"),
				newBestTime: byId("new-best-time"),
				newGameBtn: byId("win-new-game-btn"),
				viewBoardBtn: byId("win-view-board-btn"),
			},
			loseOverlay: {
				container: byId("lose-overlay"),
				minesLeft: byId("lose-mines-left"),
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
				theme: byId("settings-theme")
			},
			statistics: {
				select: byId("stats-select"),
				gamesPlayed: byId("stats-gamesplayed"),
				gamesWon: byId("stats-gameswon"),
				gamesLost: byId("stats-gameslost"),
				winPercent: byId("stats-winpercent"),
				bestTime: byId("stats-besttime"),
				longestWinningStreak: byId("stats-longestwinstreak"),
				longestLosingStreak: byId("stats-longestlosestreak"),
				currentStreak: byId("stats-currentstreak")
			},
			newGameWarning: {
				container: byId("newgamewarning-modal"),
				confirm: byId("newgamewarning-confirm")
			}
		}
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
		markMode: "none",
		clickSwap: false,
		timeStart: null,
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
		maxMines: 50,
		tileSize: 32,
		theme: "auto"
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
		veryLarge: {
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
			bestTime: null,
			longestWinningStreak: 0,
			longestLosingStreak: 0,
			currentStreak: 0,
			streakMode: "N/A"
		},
		medium: {
			gamesWon: 0,
			gamesLost: 0,
			bestTime: null,
			longestWinningStreak: 0,
			longestLosingStreak: 0,
			currentStreak: 0,
			streakMode: "N/A"
		},
		large: {
			gamesWon: 0,
			gamesLost: 0,
			bestTime: null,
			longestWinningStreak: 0,
			longestLosingStreak: 0,
			currentStreak: 0,
			streakMode: "N/A"
		},
		veryLarge: {
			gamesWon: 0,
			gamesLost: 0,
			bestTime: null,
			longestWinningStreak: 0,
			longestLosingStreak: 0,
			currentStreak: 0,
			streakMode: "N/A"
		},
		custom: {
			gamesWon: 0,
			gamesLost: 0,
			longestWinningStreak: 0,
			longestLosingStreak: 0,
			currentStreak: 0,
			streakMode: "N/A"
		},
	};

	let clockInterval;

	function createEmptyBoard() {
		board = [];
		for (let i = 0; i < gameVars.board.rows; i++) {
			board[i] = [];
			for (let j = 0; j < gameVars.board.columns; j++) {
				board[i][j] = new Tile();
			}
		}
	}

	function populateBoardWithMines(firstTileRow, firstTileColumn, numOfMines) {
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
		for (let row = 0; row < board.length; row++) {
			for (let column = 0; column < board[row].length; column++) {
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
			populateBoardWithMines(row, column, gameVars.board.numOfMines);
			displayBorderNums();
			clockInterval = setInterval(() => {
				let delta = Date.now() - gameVars.timeStart; // milliseconds elapsed since start
				let currentSeconds = Math.floor(delta / 1000) // in seconds
				let minutes = Math.floor(currentSeconds / 60);
				let seconds = currentSeconds % 60;
				if (minutes <= 9) {
					DOM.nav.timer.minutes.innerHTML = `0${minutes}`;
				} else {
					DOM.nav.timer.minutes.innerHTML = minutes;
				}
				if (seconds <= 9) {
					DOM.nav.timer.seconds.innerHTML = `0${seconds}`;
				} else {
					DOM.nav.timer.seconds.innerHTML = seconds;
				}
			}, 200);
			gameVars.timeStart = Date.now();
			uncoverTile(row, column);
			DOM.nav.mineCounter.innerHTML = gameVars.minesLeft;
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

	function tileMark(row, column) {
		if (gameVars.state == "underway" && !board[row][column].uncovered) {
			if (!board[row][column].markedAsEmpty) {
				if (gameVars.markMode == "none") {
					gameVars.markMode = "mark";
				}
				if (gameVars.markMode == "mark") {
					board[row][column].markedAsEmpty = true;
					getTileElement(row, column).innerHTML = '<i class="icon-flag"></i>';
				}
			} else {
				if (gameVars.markMode == "none") {
					gameVars.markMode = "remove";
				}
				if (gameVars.markMode == "remove") {
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
				winGame();
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
			loseGame();
		}
	}

	function winGame() {
		// Calculate time it took to win
		let endTime = Date.now() - gameVars.timeStart; // milliseconds elapsed since start
		let currentSeconds = Math.floor(endTime / 1000) // in seconds
		let minutes = Math.floor(currentSeconds / 60);
		let seconds = currentSeconds % 60;
		let milliseconds = endTime % 1000;
		if (minutes <= 9) {
			minutes = `0${minutes}`;
		}
		if (seconds <= 9) {
			seconds = `0${seconds}`;
		}
		if (milliseconds <= 100) {
			milliseconds = `${"0".repeat(3 - milliseconds.toString().length)}${milliseconds}`;
		}
		DOM.playarea.winOverlay.time.innerHTML = `${minutes}:${seconds}.${milliseconds}`;

		// Update stats
		statistics[gameVars.boardSize].gamesWon++;
		if (statistics[gameVars.boardSize].streakMode != "winning") {
			statistics[gameVars.boardSize].currentStreak = 1;
			statistics[gameVars.boardSize].streakMode = "winning";
		} else {
			statistics[gameVars.boardSize].currentStreak++;
		}
		if (statistics[gameVars.boardSize].currentStreak > statistics[gameVars.boardSize].longestWinningStreak) {
			statistics[gameVars.boardSize].longestWinningStreak = statistics[gameVars.boardSize].currentStreak;
		}
		if (endTime <= statistics[gameVars.boardSize].bestTime || statistics[gameVars.boardSize].bestTime === null) {
			statistics[gameVars.boardSize].bestTime = endTime;
			DOM.playarea.winOverlay.newBestTime.style.display = "block";
		} else {
			DOM.playarea.winOverlay.newBestTime.style.display = "NONE";
		}

		localStorage.setItem("sweeperofmines-statistics", JSON.stringify(statistics));

		DOM.playarea.winOverlay.container.classList.remove("fade");
		DOM.playarea.winOverlay.container.classList.add("visible");
		DOM.playarea.board.container.classList.add("no-input");
		gameVars.state = "finished";
		clearInterval(clockInterval);
	}

	function loseGame() {
		// Update stats
		statistics[gameVars.boardSize].gamesLost++;
		if (statistics[gameVars.boardSize].streakMode != "losing") {
			statistics[gameVars.boardSize].currentStreak = 1;
			statistics[gameVars.boardSize].streakMode = "losing";
		} else {
			statistics[gameVars.boardSize].currentStreak++;
		}
		if (statistics[gameVars.boardSize].currentStreak > statistics[gameVars.boardSize].longestLosingStreak) {
			statistics[gameVars.boardSize].longestLosingStreak = statistics[gameVars.boardSize].currentStreak;
		}

		localStorage.setItem("sweeperofmines-statistics", JSON.stringify(statistics));

		DOM.playarea.loseOverlay.minesLeft.innerHTML = gameVars.minesLeft;
		DOM.playarea.loseOverlay.container.classList.remove("fade");
		DOM.playarea.loseOverlay.container.classList.add("visible");
		DOM.playarea.board.container.classList.add("no-input");
		gameVars.state = "finished";
		clearInterval(clockInterval);
	}

	function uncoverBoard() {
		for (let row = 0; row < board.length; row++) {
			for (let column = 0; column < board[row].length; column++) {
				if (board[row][column].hasMine) {
					getTileElement(row, column).innerHTML = "<i class='icon-mine'></i>";
					getTileElement(row, column).dataset.clickable = "false";
				} else {
					getTileElement(row, column).innerHTML = board[row][column].numOfNearbyMines;
				}
			}
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

	function showStats(board) {
		DOM.modals.statistics.gamesPlayed.innerHTML = statistics[board].gamesWon + statistics[board].gamesLost;
		DOM.modals.statistics.gamesWon.innerHTML = statistics[board].gamesWon;
		DOM.modals.statistics.gamesLost.innerHTML = statistics[board].gamesLost;
		if (statistics[board].gamesWon + statistics[board].gamesLost != 0) {
			let percent = statistics[board].gamesWon / (statistics[board].gamesWon + statistics[board].gamesLost) * 100;
			DOM.modals.statistics.winPercent.innerHTML = `${percent.toFixed(2)}%`;
		} else {
			DOM.modals.statistics.winPercent.innerHTML = "N/A"
		}
		DOM.modals.statistics.longestWinningStreak.innerHTML = statistics[board].longestWinningStreak;
		DOM.modals.statistics.longestLosingStreak.innerHTML = statistics[board].longestLosingStreak;
		DOM.modals.statistics.currentStreak.innerHTML = `${statistics[board].currentStreak} (${statistics[board].streakMode})`;
		if (board != "custom") {
			if (statistics[board].bestTime != null) {
				let minutes = Math.floor(statistics[board].bestTime / 1000 / 60);
				let seconds = Math.floor((statistics[board].bestTime / 1000) % 60);
				let milliseconds = statistics[board].bestTime % 1000;
				DOM.modals.statistics.bestTime.innerHTML = `${minutes}:${seconds}.${milliseconds}`;
			} else {
				DOM.modals.statistics.bestTime.innerHTML = "N/A";
			}

			DOM.modals.statistics.bestTime.parentNode.style.removeProperty("display");
		} else {
			DOM.modals.statistics.bestTime.parentNode.style.display = "none";
		}
	}

	let multiTouch = false;
	let markTouch = false;

	function displayBoard() {
		let html = "";
		for (let row = 0; row < board.length; row++) {
			html += `<div>`;
			for (let column = 0; column < board[row].length; column++) {
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
				} else if (evt.button == 2 || gameVars.clickSwap) {
					markTouch = true;
					tileMark(parseInt(tile.dataset.row), parseInt(tile.dataset.column));
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
				markTouch = false;
				if (!gameVars.clickSwap && evt.button == 0) {
					tileClick(parseInt(tile.dataset.row), parseInt(tile.dataset.column));
				}
			});
			tile.addEventListener("contextmenu", (evt) => {
				evt.preventDefault();
				return false;
			});
			tile.addEventListener("pointerenter", (evt) => {
				if (!evt.isPrimary) {
					return;
				}
				if (markTouch || evt.buttons == 2) {
					tileMark(parseInt(tile.dataset.row), parseInt(tile.dataset.column));
				}
			});
			tile.addEventListener("pointercancel", evt => {
				markTouch = false;
				gameVars.markMode = "none";
			})
		}
	}

	document.body.addEventListener("pointerup", () => {
		markTouch = false;
		gameVars.markMode = "none";
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
		DOM.nav.timer.minutes.innerHTML = DOM.nav.timer.seconds.innerHTML = "00";
		DOM.playarea.board.container.classList.remove("no-input");
		DOM.nav.mineCounter.innerHTML = gameVars.minesLeft = gameVars.board.numOfMines;
	}

	DOM.nav.mineBtn.addEventListener("click", () => {
		gameVars.clickSwap = false;
		DOM.playarea.board.container.classList.remove("no-scroll");
		DOM.nav.mineBtn.classList.add("active");
		DOM.nav.markBtn.classList.remove("active");
	})

	DOM.nav.markBtn.addEventListener("click", () => {
		gameVars.clickSwap = true;
		DOM.playarea.board.container.classList.add("no-scroll")
		DOM.nav.markBtn.classList.add("active");
		DOM.nav.mineBtn.classList.remove("active");
	})

	DOM.nav.newGameBtn.addEventListener("click", evt => {
		if (gameVars.state === "underway") {
			DOM.modals.container.classList.add("visible");
			DOM.modals.container.classList.remove("fade");
			DOM.modals.newGameWarning.container.classList.add("visible");
			DOM.modals.newGameWarning.container.classList.remove("fade");
		} else {
			newGame();
		}
	});

	DOM.modals.newGameWarning.confirm.addEventListener("click", evt => {
		statistics[gameVars.boardSize].gamesLost++;
		if (statistics[gameVars.boardSize].streakMode != "losing") {
			statistics[gameVars.boardSize].currentStreak = 1;
			statistics[gameVars.boardSize].streakMode = "losing";
		} else {
			statistics[gameVars.boardSize].currentStreak++;
		}
		if (statistics[gameVars.boardSize].currentStreak > statistics[gameVars.boardSize].longestLosingStreak) {
			statistics[gameVars.boardSize].longestLosingStreak = statistics[gameVars.boardSize].currentStreak;
		}

		localStorage.setItem("sweeperofmines-statistics", JSON.stringify(statistics));

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

	document.querySelectorAll('[data-modalopen="#statistics-modal"]').forEach(el => {
		el.addEventListener("click", () => {
			showStats(DOM.modals.statistics.select.value);
		});
	});

	DOM.modals.settings.container.addEventListener("click", () => {
		localStorage.setItem("sweeperofmines-settings", JSON.stringify(settings));
		if (gameVars.state != "underway") {
			newGame();
		}
	})

	DOM.modals.settings.container.querySelector(".modal-close").addEventListener("click", () => {
		localStorage.setItem("sweeperofmines-settings", JSON.stringify(settings));
		if (gameVars.state != "underway") {
			newGame();
		}
	})

	document.querySelectorAll(".modal").forEach(el => {
		el.addEventListener("click", evt => {
			if (evt.target === evt.currentTarget) {
				if (DOM.modals.settings.container.classList.contains("visible")) {
					localStorage.setItem("sweeperofmines-settings", JSON.stringify(settings));
				}
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
		}
		settings.board.numOfMines = parseInt(evt.target.value);
		if (gameVars.state == "underway") {
			DOM.modals.settings.boardApplyWarning.style.display = "block";
		} else {
			gameVars.board.numOfMines = parseInt(evt.target.value);
		}
	})

	DOM.modals.settings.customBoard.numOfMines.addEventListener("blur", evt => {
		if (evt.target.value < 2 || !evt.target.value) {
			evt.target.value = 2;
		}
		settings.board.numOfMines = parseInt(evt.target.value);
		if (gameVars.state == "underway") {
			DOM.modals.settings.boardApplyWarning.style.display = "block";
		} else {
			gameVars.board.numOfMines = parseInt(evt.target.value);
		}
	})

	DOM.modals.statistics.select.addEventListener("change", evt => {
		showStats(evt.target.value);
	})

	function calculateMaxMines() {
		let maxMines = Math.floor(settings.board.columns * settings.board.rows / 2);
		if (maxMines < 12) {
			maxMines = 12;
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

	const root = document.documentElement;

	DOM.modals.settings.tileSize.addEventListener("input", evt => {
		settings.tileSize = evt.target.value;
		root.style.setProperty('--tile-size', `${evt.target.value}px`);
	})

	DOM.modals.settings.theme.addEventListener("change", evt => {
		settings.theme = evt.target.value;
		switch (settings.theme) {
			case "auto":
				root.classList.add("auto");
				root.classList.remove("dark");
				break;
			case "light":
				root.classList.remove("auto");
				root.classList.remove("dark");
				break;
			case "dark":
				root.classList.add("dark");
				root.classList.remove("auto");
				break;
		}
	})

	// Load stats and options

	let tempSettings = localStorage.getItem("sweeperofmines-settings");
	let tempStats = localStorage.getItem("sweeperofmines-statistics");

	if (tempSettings != null) {
		settings = JSON.parse(tempSettings);
		DOM.modals.settings.boardSize.value = settings.boardSize;
		if (settings.boardSize == "custom") {
			DOM.modals.settings.customBoard.container.classList.add("open");
		}
		DOM.modals.settings.customBoard.columns.value = settings.board.columns;
		DOM.modals.settings.customBoard.rows.value = settings.board.rows;
		DOM.modals.settings.customBoard.numOfMines.value = settings.board.numOfMines;
		DOM.modals.settings.customBoard.maxMines.value = settings.maxMines;
		DOM.modals.settings.tileSize.value = settings.tileSize;
		DOM.modals.settings.theme.value = settings.theme;
		DOM.modals.settings.theme.dispatchEvent(new Event("change"));
		root.style.setProperty('--tile-size', `${settings.tileSize}px`);
	}
	if (tempStats != null) {
		statistics = JSON.parse(tempStats);
	}

	// Remove custom board limits if url has ?customBoardUnlimited

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
		bubble.style.left = `calc(${newVal}% + (${10 - newVal * 0.19}px))`;
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
			el.addEventListener("pointerover", () => {
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

	// Start new game on startup
	newGame();
})();