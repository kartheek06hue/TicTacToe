const container = document.getElementById('container');
let turn = 'X';
let turns = 0;
let board_array = new Array(9).fill('E');
const winner = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

// --- NEW STATE VARIABLES ---
let isSinglePlayer = false; 
let isComputerThinking = false; // Prevents human clicks during bot turn

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

        // ADDING INNERTEXT 
        element.innerText = turn;
        board_array[element.id] = turn;
        element.classList.add(turn);
        
        turn = (turn === 'X') ? 'O' : 'X';
        turns++; // increment no. of turns.

        let isGameOver = false;

        // CHECKING WINNING CONDITION
        winner.forEach(([ind1,ind2,ind3]) => {
            if(board_array[ind1] != 'E' && board_array[ind1] === board_array[ind2] && board_array[ind2] === board_array[ind3]) {
                document.getElementById('announce').innerText = `Player ${board_array[ind1]} is Winner`;
                container.removeEventListener('click', call_back);
                isGameOver = true;
            }
        });

        // CHECKING DRAW CONDITION
        if(turns == 9 && !isGameOver) {
            document.getElementById('announce').innerText = 'Tie';
            isGameOver = true;
        }

        // TRIGGER COMPUTER MOVE
        if (!isGameOver && isSinglePlayer && turn === 'O') {
            isComputerThinking = true;
            setTimeout(makeComputerMove, 500); // 500ms delay for realism
        } else {
            isComputerThinking = false;
        }
    }
}

// --- COMPUTER BOT (LEVEL 1: RANDOM MOVE) ---
function makeComputerMove() {
    let emptyCells = [];
    for (let i = 0; i < board_array.length; i++) {
        if (board_array[i] === 'E') {
            emptyCells.push(i);
        }
    }

    if (emptyCells.length === 0) return;

    let randomIndex = Math.floor(Math.random() * emptyCells.length);
    let chosenCellId = emptyCells[randomIndex];
    let chosenElement = document.getElementById(`${chosenCellId}`);
    
    // Play the chosen move
    handleMove(chosenElement);
}

// --- CLICK LISTENER ---
const call_back = (event) => {
    if (isComputerThinking) return; // Block clicks while computer is thinking

    const element = event.target;
    if (element.classList.contains('card')) { // Ensure we click a card, not the grid gap
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
    
    // Reset listeners safely
    container.removeEventListener('click', call_back);
    container.addEventListener('click', call_back);
}

const restartBtn = document.getElementById('restart');
restartBtn.addEventListener('click', restartGame);
