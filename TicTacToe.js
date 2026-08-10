const container = document.getElementById('container');
let turn = 'X';
let turns = 0;
let board_array = new Array(9).fill('E');
const winner = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

// --- NEW STATE VARIABLES ---
let isSinglePlayer = false; 
let isComputerThinking = false; 

// --- GAME MODE SELECTION ---
const btn1p = document.getElementById('btn-1p');
const btn2p = document.getElementById('btn-2p');

btn1p.addEventListener('click', () => {
    isSinglePlayer = true;
    btn1p.classList.add('active');
    btn2p.classList.remove('active');
    restartGame();
});

btn2p.addEventListener('click', () => {
    isSinglePlayer = false;
    btn2p.classList.add('active');
    btn1p.classList.remove('active');
    restartGame();
});

// --- CORE MOVE LOGIC ---
const handleMove = (element) => {
    if(board_array[element.id] === 'E') {

        element.innerText = turn;
        board_array[element.id] = turn;
        element.classList.add(turn);
        
        turn = (turn === 'X') ? 'O' : 'X';
        turns++; 

        let isGameOver = false;

        winner.forEach(([ind1,ind2,ind3]) => {
            if(board_array[ind1] != 'E' && board_array[ind1] === board_array[ind2] && board_array[ind2] === board_array[ind3]) {
                document.getElementById('announce').innerText = `Player ${board_array[ind1]} is Winner`;
                container.removeEventListener('click', call_back);
                isGameOver = true;
            }
        });

        if(turns == 9 && !isGameOver) {
            document.getElementById('announce').innerText = 'Tie';
            isGameOver = true;
        }

        if (!isGameOver && isSinglePlayer && turn === 'O') {
            isComputerThinking = true;
            setTimeout(makeComputerMove, 500); 
        } else {
            isComputerThinking = false;
        }
    }
}

// --- COMPUTER BOT (LEVEL 2: UNBEATABLE MINIMAX) ---
function makeComputerMove() {
    let bestSpot = minimax(board_array, 'O').index;
    let chosenElement = document.getElementById(`${bestSpot}`);
    handleMove(chosenElement);
}

// Helper function to check wins specifically for the algorithm
function checkWinForAlgorithm(board, player) {
    for (let i = 0; i < winner.length; i++) {
        const [a, b, c] = winner[i];
        if (board[a] === player && board[b] === player && board[c] === player) {
            return true;
        }
    }
    return false;
}

// The core Minimax Algorithm
function minimax(newBoard, player) {
    // 1. Find all available spots
    let availSpots = [];
    for (let i = 0; i < newBoard.length; i++) {
        if (newBoard[i] === 'E') availSpots.push(i);
    }

    // 2. Check for terminal states (win, lose, tie) and return a score
    if (checkWinForAlgorithm(newBoard, 'X')) {
        return {score: -10}; // Human wins (Bad for computer)
    } else if (checkWinForAlgorithm(newBoard, 'O')) {
        return {score: 10};  // Computer wins (Good for computer)
    } else if (availSpots.length === 0) {
        return {score: 0};   // Tie
    }

    // 3. Collect scores for all possible moves
    let moves = [];
    for (let i = 0; i < availSpots.length; i++) {
        let move = {};
        move.index = availSpots[i];
        
        // Make the move on the temporary board
        newBoard[availSpots[i]] = player;

        // Call minimax recursively on the new board state
        if (player === 'O') {
            let result = minimax(newBoard, 'X');
            move.score = result.score;
        } else {
            let result = minimax(newBoard, 'O');
            move.score = result.score;
        }

        // Reset the spot for the next loop iteration
        newBoard[availSpots[i]] = 'E';
        moves.push(move);
    }

    // 4. Choose the best move
    let bestMove;
    if (player === 'O') {
        // Computer wants the highest score possible
        let bestScore = -10000;
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].score > bestScore) {
                bestScore = moves[i].score;
                bestMove = i;
            }
        }
    } else {
        // Human wants the lowest score possible
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
    if (isComputerThinking) return; 

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
        document.getElementById(`${i}`).innerText = "";
        document.getElementById(`${i}`).classList.remove('X');
        document.getElementById(`${i}`).classList.remove('O');
    }
    document.getElementById('announce').innerText = '';
    turn = 'X';
    turns = 0;
    isComputerThinking = false;
    
    container.removeEventListener('click', call_back);
    container.addEventListener('click', call_back);
}

const restartBtn = document.getElementById('restart');
restartBtn.addEventListener('click', restartGame);
