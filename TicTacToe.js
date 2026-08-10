const container = document.getElementById('container');
let turn = 'X';
let turns = 0;
let board_array = new Array(9).fill('E');
const winner = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

// --- NEW STATE VARIABLES ---
let isSinglePlayer = false; 
let isComputerThinking = false; 
let isGameOver = false;

// Score Tracking
let scoreX = 0;
let scoreO = 0;
let scoreTies = 0;

// Timer Tracking
let isSpeedMode = false;
let timerInterval;
let timeLeft = 5;

const difficultySelect = document.getElementById('difficulty-selection'); 
const speedCheckbox = document.getElementById('speed-checkbox');

// --- EVENT LISTENERS: MODES & OPTIONS ---
const btn1p = document.getElementById('btn-1p');
const btn2p = document.getElementById('btn-2p');

btn1p.addEventListener('click', () => {
    isSinglePlayer = true;
    btn1p.classList.add('active');
    btn2p.classList.remove('active');
    difficultySelect.style.display = 'block'; 
    restartGame();
});

btn2p.addEventListener('click', () => {
    isSinglePlayer = false;
    btn2p.classList.add('active');
    btn1p.classList.remove('active');
    difficultySelect.style.display = 'none'; 
    restartGame();
});

speedCheckbox.addEventListener('change', (e) => {
    isSpeedMode = e.target.checked;
    document.getElementById('timer-display').style.display = isSpeedMode ? 'block' : 'none';
    restartGame();
});

// --- CORE MOVE LOGIC ---
const handleMove = (element) => {
    if(board_array[element.id] === 'E' && !isGameOver) {

        element.innerText = turn;
        board_array[element.id] = turn;
        element.classList.add(turn);
        element.classList.add('pop'); // Trigger animation
        
        turns++; 

        checkWinCondition();

        if (!isGameOver) {
            turn = (turn === 'X') ? 'O' : 'X';
            
            // Reset and start timer for next player
            startTimer();

            // Trigger Bot if applicable
            if (isSinglePlayer && turn === 'O') {
                isComputerThinking = true;
                setTimeout(makeComputerMove, 500); 
            } else {
                isComputerThinking = false;
            }
        }
    }
}

function checkWinCondition() {
    winner.forEach(([ind1,ind2,ind3]) => {
        if(board_array[ind1] != 'E' && board_array[ind1] === board_array[ind2] && board_array[ind2] === board_array[ind3]) {
            endGame(board_array[ind1], [ind1, ind2, ind3]);
        }
    });

    if(turns === 9 && !isGameOver) {
        endGame('Tie', null);
    }
}

function endGame(result, winningIndices) {
    isGameOver = true;
    clearInterval(timerInterval);
    container.removeEventListener('click', call_back);

    if (result === 'Tie') {
        document.getElementById('announce').innerText = 'Tie Game!';
        scoreTies++;
        document.getElementById('score-ties').innerText = scoreTies;
    } else {
        document.getElementById('announce').innerText = `Player ${result} is Winner!`;
        
        // Highlight winning cards
        if (winningIndices) {
            document.getElementById(`${winningIndices[0]}`).classList.add('winning-card');
            document.getElementById(`${winningIndices[1]}`).classList.add('winning-card');
            document.getElementById(`${winningIndices[2]}`).classList.add('winning-card');
        }

        // Update Scores
        if (result === 'X') {
            scoreX++;
            document.getElementById('score-X').innerText = scoreX;
        } else {
            scoreO++;
            document.getElementById('score-O').innerText = scoreO;
        }
    }
}

// --- TIMER LOGIC ---
function startTimer() {
    clearInterval(timerInterval);
    if (!isSpeedMode || isGameOver) return;
    
    timeLeft = 5;
    document.getElementById('time-left').innerText = timeLeft;
    
    timerInterval = setInterval(() => {
        if (isComputerThinking) return; // Pause timer while bot thinks
        
        timeLeft--;
        document.getElementById('time-left').innerText = timeLeft;
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            let winningPlayer = (turn === 'X') ? 'O' : 'X'; // The player who ran out of time loses
            document.getElementById('announce').innerText = `Time's Up! Player ${winningPlayer} Wins by default.`;
            endGame(winningPlayer, null);
        }
    }, 1000);
}

// --- COMPUTER BOT LOGIC ---
function makeComputerMove() {
    if (isGameOver) return;

    let emptyCells = [];
    for (let i = 0; i < board_array.length; i++) {
        if (board_array[i] === 'E') emptyCells.push(i);
    }
    if (emptyCells.length === 0) return;

    let chosenCellId;
    let perfectPlayProbability = parseFloat(document.getElementById('difficulty').value);
    let randomRoll = Math.random(); 

    if (randomRoll < perfectPlayProbability) {
        chosenCellId = minimax(board_array, 'O').index;
    } else {
        let randomIndex = Math.floor(Math.random() * emptyCells.length);
        chosenCellId = emptyCells[randomIndex];
    }

    let chosenElement = document.getElementById(`${chosenCellId}`);
    handleMove(chosenElement);
}

// Helper function for Minimax
function checkWinForAlgorithm(board, player) {
    for (let i = 0; i < winner.length; i++) {
        const [a, b, c] = winner[i];
        if (board[a] === player && board[b] === player && board[c] === player) {
            return true;
        }
    }
    return false;
}

// Minimax Algorithm
function minimax(newBoard, player) {
    let availSpots = [];
    for (let i = 0; i < newBoard.length; i++) {
        if (newBoard[i] === 'E') availSpots.push(i);
    }

    if (checkWinForAlgorithm(newBoard, 'X')) {
        return {score: -10}; 
    } else if (checkWinForAlgorithm(newBoard, 'O')) {
        return {score: 10};  
    } else if (availSpots.length === 0) {
        return {score: 0};   
    }

    let moves = [];
    for (let i = 0; i < availSpots.length; i++) {
        let move = {};
        move.index = availSpots[i];
        newBoard[availSpots[i]] = player;

        if (player === 'O') {
            let result = minimax(newBoard, 'X');
            move.score = result.score;
        } else {
            let result = minimax(newBoard, 'O');
            move.score = result.score;
        }

        newBoard[availSpots[i]] = 'E';
        moves.push(move);
    }

    let bestMove;
    if (player === 'O') {
        let bestScore = -10000;
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].score > bestScore) {
                bestScore = moves[i].score;
                bestMove = i;
            }
        }
    } else {
        let bestScore = 10000;
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].score < bestScore) {
                bestScore = moves[i].score;
                bestMove = i;
            }
        }
    }
    return moves[bestMove];
}

// --- CLICK LISTENER ---
const call_back = (event) => {
    if (isComputerThinking || isGameOver) return; 

    const element = event.target;
    if (element.classList.contains('card')) { 
        handleMove(element);
    }
}
container.addEventListener('click', call_back);

// --- RESTART LOGIC ---
function restartGame() {
    board_array = new Array(9).fill('E');
    for(let i = 0; i < 9; i++) {
        const card = document.getElementById(`${i}`);
        card.innerText = "";
        card.classList.remove('X', 'O', 'pop', 'winning-card');
    }
    document.getElementById('announce').innerText = '';
    
    turn = 'X';
    turns = 0;
    isComputerThinking = false;
    isGameOver = false;
    
    container.removeEventListener('click', call_back);
    container.addEventListener('click', call_back);

    startTimer(); // Reset timer if Speed Mode is on
}

const restartBtn = document.getElementById('restart');
restartBtn.addEventListener('click', restartGame);
