const container = document.getElementById('container');
let turn = 'X';
let turns = 0;
let board_array = new Array(9).fill('E');
const winner = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

// --- STATE VARIABLES ---
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

// Elements
const difficultySelect = document.getElementById('difficulty-selection'); 
const speedCheckbox = document.getElementById('speed-checkbox');
const themeSelect = document.getElementById('theme-select');
const botDialogue = document.getElementById('bot-dialogue');
const hintBtn = document.getElementById('hint-btn');

// --- WEB AUDIO SYNTHESIZER ---
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new AudioCtx();
    }
}

function playSound(type) {
    try {
        initAudio();
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        const now = audioCtx.currentTime;

        if (type === 'move') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime( turn === 'X' ? 440 : 554.37, now ); // A4 or C#5
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
            osc.start(now);
            osc.stop(now + 0.12);
        } else if (type === 'tick') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(800, now);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
            osc.start(now);
            osc.stop(now + 0.05);
        } else if (type === 'win') {
            // Major triad arpeggio
            [523.25, 659.25, 783.99, 1046.50].forEach((freq, index) => {
                const noteOsc = audioCtx.createOscillator();
                const noteGain = audioCtx.createGain();
                noteOsc.connect(noteGain);
                noteGain.connect(audioCtx.destination);
                noteOsc.frequency.setValueAtTime(freq, now + index * 0.08);
                noteGain.gain.setValueAtTime(0.1, now + index * 0.08);
                noteGain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + 0.2);
                noteOsc.start(now + index * 0.08);
                noteOsc.stop(now + index * 0.08 + 0.2);
            });
        } else if (type === 'lose') {
            // Descending tone
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.exponentialRampToValueAtTime(120, now + 0.4);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
            osc.start(now);
            osc.stop(now + 0.4);
        }
    } catch (e) {
        // Audio fallback if browser blocks autoplay
    }
}

// --- BOT PERSONALITY DIALOGUE ---
const botTaunts = {
    start: ["Let's see what you've got!", "Prepared to lose?", "Good luck, human!"],
    move: ["Bold choice...", "Interesting strategy.", "I saw that coming.", "Is that your best move?"],
    block: ["Nice try!", "Not on my watch!", "Blocked!"],
    win: ["Calculated victory!", "Human error detected.", "Better luck next time!"],
    lose: ["Impossible... A glitch in my matrix!", "You got lucky!", "Rematch immediately!"],
    tie: ["A tie? Impressive defense.", "Equally matched... for now.", "Neither of us wins!"]
};

function triggerBotSpeech(category) {
    if (!isSinglePlayer) return;
    const lines = botTaunts[category];
    if (lines) {
        const randomLine = lines[Math.floor(Math.random() * lines.length)];
        botDialogue.innerText = `"${randomLine}"`;
    }
}

// --- THEME SWITCHER ---
themeSelect.addEventListener('change', (e) => {
    document.body.className = e.target.value;
});

// --- GAME MODE SELECTION ---
const btn1p = document.getElementById('btn-1p');
const btn2p = document.getElementById('btn-2p');

btn1p.addEventListener('click', () => {
    isSinglePlayer = true;
    btn1p.classList.add('active');
    btn2p.classList.remove('active');
    difficultySelect.style.display = 'flex'; 
    botDialogue.style.display = 'block';
    triggerBotSpeech('start');
    restartGame();
});

btn2p.addEventListener('click', () => {
    isSinglePlayer = false;
    btn2p.classList.add('active');
    btn1p.classList.remove('active');
    difficultySelect.style.display = 'none'; 
    botDialogue.style.display = 'none';
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

        clearHints();
        playSound('move');

        element.innerText = turn;
        board_array[element.id] = turn;
        element.classList.add(turn);
        element.classList.add('pop'); 
        
        turns++; 

        checkWinCondition();

        if (!isGameOver) {
            turn = (turn === 'X') ? 'O' : 'X';
            startTimer();

            if (isSinglePlayer && turn === 'O') {
                isComputerThinking = true;
                triggerBotSpeech('move');
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
        playSound('tick');
        triggerBotSpeech('tie');
    } else {
        document.getElementById('announce').innerText = `Player ${result} is Winner!`;
        
        if (winningIndices) {
            document.getElementById(`${winningIndices[0]}`).classList.add('winning-card');
            document.getElementById(`${winningIndices[1]}`).classList.add('winning-card');
            document.getElementById(`${winningIndices[2]}`).classList.add('winning-card');
        }

        if (result === 'X') {
            scoreX++;
            document.getElementById('score-X').innerText = scoreX;
            playSound('win');
            triggerBotSpeech('lose');
        } else {
            scoreO++;
            document.getElementById('score-O').innerText = scoreO;
            playSound(isSinglePlayer ? 'lose' : 'win');
            triggerBotSpeech('win');
        }
    }
}

// --- INTERACTIVE HINT SYSTEM ---
function clearHints() {
    for (let i = 0; i < 9; i++) {
        document.getElementById(`${i}`).classList.remove('hint-card');
    }
}

hintBtn.addEventListener('click', () => {
    if (isGameOver || isComputerThinking) return;

    clearHints();
    let bestSpot = minimax(board_array, turn).index;
    if (bestSpot !== undefined && bestSpot !== null) {
        document.getElementById(`${bestSpot}`).classList.add('hint-card');
        if (isSinglePlayer) {
            botDialogue.innerText = '"Need a hint? Fine, take a look!"';
        }
    }
});

// --- TIMER LOGIC ---
function startTimer() {
    clearInterval(timerInterval);
    if (!isSpeedMode || isGameOver) return;
    
    timeLeft = 5;
    document.getElementById('time-left').innerText = timeLeft;
    
    timerInterval = setInterval(() => {
        if (isComputerThinking) return;
        
        timeLeft--;
        document.getElementById('time-left').innerText = timeLeft;
        playSound('tick');
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            let winningPlayer = (turn === 'X') ? 'O' : 'X';
            document.getElementById('announce').innerText = `Time's Up! Player ${winningPlayer} Wins.`;
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

// Minimax Helper
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
        card.classList.remove('X', 'O', 'pop', 'winning-card', 'hint-card');
    }
    document.getElementById('announce').innerText = '';
    
    turn = 'X';
    turns = 0;
    isComputerThinking = false;
    isGameOver = false;
    
    container.removeEventListener('click', call_back);
    container.addEventListener('click', call_back);

    if (isSinglePlayer) {
        triggerBotSpeech('start');
    }

    startTimer();
}

const restartBtn = document.getElementById('restart');
restartBtn.addEventListener('click', restartGame);
