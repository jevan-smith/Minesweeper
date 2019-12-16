// Author: Jevan Smith
// Assignment: Project 1
// Date: Fall 2019

var gameOver = false;
var gameStarted = false;
var myTimer = null;

function createTimer() {
    let minutes = 0, seconds = 0;
    // place the digits of the timer in the item whose
    // class-name is main-svg.
    const clock = d3.select('.main-svg').append('g')
        .attr('class', 'clock')
        .attr('transform', `translate(242, 40)`)
        .append('text')
        .attr('class', 'clock-text')
        .attr('text-anchor', 'middle')
        .attr('font-size', 40)
        .attr('stroke', 'black')
        .attr('fill', 'black');

    function updateClock(clock, minutes, seconds) {
        // format the timer's text.
        clock.text(`${d3.format("02d")(minutes)}:${d3.format('02d')(seconds)}`);
    }

    updateClock(clock, 0, 0);  // display 0:0
    return function() {
        return d3.interval(() => {
            // Every second, add one to the seconds variable,
            // update the minute variable if necessary, and
            // update the text of the timer.
            seconds += 1;
            minutes += Math.floor(seconds / 60);
            seconds %= 60;
            updateClock(clock, minutes, seconds);
        }, 1000);
    };
}

function timerDemo() {
    d3.select('main-svg');
    const timerFunction = createTimer();  // create and display the timer (doesn't start the timer.)
    myTimer = timerFunction(); // start the timer.
    //d3.timer(() => myTimer.stop(), 10000);  // stop it after 3 seconds.

}

function createConfigurationParameters(numRows, numColumns) {

    const configAttributes = {
        svg_width: 800,
        svg_height: 800,
        margins: {
            left: 20,
            right: 20,
            top: 50,
            bottom: 30
        },
        svg_margins: {
            top: 0,
            left: 0
        },
        board_cell_size: 40,
        board_cell_gap: 5,
        board_cell_stroke: 'gray',
        board_cell_fill: 'white',
        main_board_stroke: 'black',
        mine_circle_radius: 8,
        mine_size: 5,
    };

    configAttributes['svg_width'] = configAttributes.margins.left + configAttributes.margins.right +
        (configAttributes.board_cell_size + configAttributes.board_cell_gap) * numRows;
    configAttributes['svg_height'] = configAttributes.margins.top + configAttributes.margins.bottom +
        (configAttributes.board_cell_size + configAttributes.board_cell_gap) * numColumns;

    return configAttributes;
}

// Checks the boundries of the board, returning true if row and col are within bounds.
function checkBounds(board, row, col) {
    if((row >= 0 && row < board.length) && (col >= 0 && col < board[0].length)) {
        return true;
    }
    else {
        return false;
    }
}

// Update board cells to reflect the bombs added to the game, determined by bombs
function updateNabors(board, row, col) {

    const cords = [   [-1, -1], [0, -1], [1, -1],
                    [-1, 0], [0, 0], [1, 0],
                    [-1, 1], [0, 1], [1, 1]];

    for(let i = 0; i < cords.length; i++) {
        let cord = cords[i];
        var tempRow = row + cord[0];
        var tempCol = col + cord[1];

        if(checkBounds(board, tempRow, tempCol) === true) {
            board[tempRow][tempCol]['adjacent_mines'] += 1;
        }
    }
}

// Function takes clicked location and updates the opened cells
function openCells(board, row, col) {
    const cords = [   [-1, -1], [0, -1], [1, -1],
                    [-1, 0], [0, 0], [1, 0],
                    [-1, 1], [0, 1], [1, 1]];
    
    var q = [[row, col]];
    var banList = []

    if(board[row][col]['adjacent_mines'] > 0) {
        board[row][col]['opened'] = true;
        return;
    }

    while(q.length > 0) {
        for(let i = 0; i < cords.length; i++) {

            let cord = cords[i];
            var tempRow = q[0][0] + cord[0];
            var tempCol = q[0][1] + cord[1];

            found = false;

            for(let j = 0; j < banList.length; j++) {
                if(banList[j][0] === tempRow && banList[j][1] === tempCol) {
                    found = true;
                }
            }

            if(found === true) {
                continue;
            }
            
            if(checkBounds(board, tempRow, tempCol) === true) {
                banList.push([tempRow, tempCol]);
                board[tempRow][tempCol]['opened'] = true;
                if(board[tempRow][tempCol]['adjacent_mines'] === 0) {
                    q.push([tempRow, tempCol]); // Push
                    banList.push([tempRow, tempCol]);
                }
            }
        }
        q.shift(); // Pop
    }
}

function checkWin(board) {
    var numOpened = 0;
    var numBombs = 0;
    var sizeOfBoard = board.length * board[0].length;
    for(var i = 0; i < board.length; i++) {
        for(var j = 0; j < board[0].length; j++) {
            if(board[i][j]['opened'] === true) {
                numOpened += 1;
            }
            if(board[i][j]['is_mine_cell'] === true) {
                numBombs += 1;
            }
        }
    }
    if(numOpened === sizeOfBoard - numBombs) {
        console.log("hit true")
        return true;
    }
    else {
        return false;
    }
    
}

// Main driver function
function playMinesweeper(rows, columns, percentageOfMines, showBombs) {
    const board = d3.range(rows).map(d => []).map((row, i) => {
        return d3.range(columns).map((col, j) => ({
            row: i,
            column: j,
            adjacent_mines: 0,
            opened: false,
            drawn: false,
            is_mine_cell: Math.random() <= percentageOfMines
        }))
    });

    for (let i = 0; i < board.length; i++) {
        for( let j = 0; j < board[0].length; j++) {
            if(board[i][j]['is_mine_cell'] > 0) {
                updateNabors(board, i, j)
            }
        }
    }

    const numMines = board.reduce((rowAccu, row) => rowAccu + row.reduce((colAccu, v) => colAccu + (v.is_mine_cell ? 1 : 0), 0), 0);
    console.log(`${numMines} mines were added to the board.`);
    console.log(board);

    const configAttrs = createConfigurationParameters(rows, columns);

    const svg = d3.select('body')
        .append('svg')
        .attr('class', 'main-svg')
        .attr('width', configAttrs.svg_width)
        .attr('height', configAttrs.svg_height)
        .attr('transform', `translate(${configAttrs.svg_margins.left}, ${configAttrs.svg_margins.top})`);


    // create the board
    const rowGroups = svg
        .selectAll('.row-group')
        .data(board)
        .enter()
        .append('g')
        .attr('class', 'row-group')
        .attr('transform', (d, i) => `translate(${configAttrs.margins.left}, 
                    ${configAttrs.margins.top + i * (configAttrs.board_cell_size + configAttrs.board_cell_gap)})`);

    const allCells = rowGroups.selectAll('.board-cell')
        .data(d => d)
        .enter()
        .append('g')
        .attr('class', d => `board-cell board-cell-g-${d.row}-${d.column}`)
        .attr('transform', (d, i) => `translate(${i * (configAttrs.board_cell_size + configAttrs.board_cell_gap)}, 0)`);

    // append rectangles and add click handlers.
    allCells.append('rect')
        .attr('width', configAttrs.board_cell_size)
        .attr('height', configAttrs.board_cell_size)
        .attr('stroke', configAttrs.board_cell_stroke)
        .attr('fill', configAttrs.board_cell_fill)
        .attr('class', 'board-rect')
        .on("click", function(d) {
            d3.event.preventDefault();
            if(gameStarted === false) {
                gameStarted = true;
                timerDemo();
            }
            if(gameOver === false) {
                if(d.is_mine_cell === true) { // Checks if game is over
                    gameOver = true;
                }
                if(d.is_mine_cell === false) {
                    var emptyFlag = d3.select(`.flag-${d.row}-${d.column}`).empty();
                    //d3.select(this).attr('fill', 'white');
                    const g = d3.select(`.board-cell-g-${d.row}-${d.column}`);
                    if(emptyFlag === true) {
                        showCellContent(d, g)
                    }
                    else {
                        showCellContent(d, g)
                        removeFlag(d.row, d.column);
                    }
                }
                else {
                    d3.select(this).attr('fill', 'red');
                    showEntireBoard(d);
                }
            }
        })
        .on("contextmenu", function(d) {  // right-click
            d3.event.preventDefault();
            if(gameOver === false) {
                const g = d3.select(`.board-cell-g-${d.row}-${d.column}`);
                var isEmpty = d3.select(`.flag-${d.row}-${d.column}`).empty();
                if(isEmpty === true && d.opened === false) {
                    g.append('path')
                        .attr('d', "M 0 0 L 3 0 L 3 25 M 3 0 L 15 8 L 3 15 L 3 25 L 0 25 L 0 0")
                        .attr('transform', 'translate(12, 8)')
                        .attr('stroke', 'white')
                        .attr('stroke-width', 1)
                        .attr('fill', 'red')
                        .attr('class', `flag-${d.row}-${d.column}`)
                }
                else {
                    removeFlag(d.row, d.column);
                }
            }
        });

    d3.selectAll('.board-rect')
        .attr('fill', 'gray');

    // Show all bombs
    if(showBombs === true) {
        d3.selectAll('.board-rect')
            .filter(d => d.is_mine_cell === true)
            .attr('fill', 'red');
    }
    
    function showEntireBoard(d) {
        d3.selectAll('.board-rect')
            .attr('fill', 'white');

        d3.selectAll('.board-cell')
        .append('text')
            .filter(d => d.opened === false)
            .style("fill", "black")
            .attr('transform', 'translate(19, 19)')
            .attr("dy", ".35em")
            .attr("text-anchor", "middle")
            .filter(d => d.is_mine_cell != true)
            .text(d => d.adjacent_mines)

        d3.selectAll('.board-rect')
            .filter(d => d.is_mine_cell === true)
            .attr('fill', 'red');

        for(let i = 0; i < board.length; i++) {
            for(let j = 0; j < board[0].length; j++) {
                removeFlag(i, j);
            }
        }
        //alert("YOU LOST!!!")
        myTimer.stop();
    }

    function showCellContent(d, g) {

        openCells(board, d.row, d.column);

        d3.selectAll('.board-rect')
            .filter(d => d.opened === true)
            .attr('fill', 'white');

        d3.selectAll('.board-cell')
            .append('text')
                .filter(d => d.opened === true && d.drawn === false)
                .style("fill", "black")
                .attr('transform', 'translate(19, 19)')
                .attr("dy", ".35em")
                .attr("text-anchor", "middle")
                .filter(d => d.is_mine_cell != true)
                .text(d => d.adjacent_mines)

        for(let i = 0; i < board.length; i++) {
            for(let j = 0; j < board[0].length; j++) {
                if(board[i][j]['opened'] === true) {
                    board[i][j]['drawn'] = true;
                    removeFlag(i, j);
                }
            }
        }
        if(checkWin(board) === true) { // Checks to see if you win
            myTimer.stop();
            gameOver = true;
            alert("YOU WIN!!!")
            d3.selectAll('.board-rect')
            .filter(d => d.is_mine_cell === true)
            .attr('fill', 'blue');
            for(let i = 0; i < board.length; i++) {
                for(let j = 0; j < board[0].length; j++) {
                    removeFlag(i, j);
                }
            }
        }
    }

    function removeFlag(row, col) {
        d3.select(`.flag-${row}-${col}`)
            .remove();
    }
}