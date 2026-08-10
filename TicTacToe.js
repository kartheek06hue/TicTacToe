const container = document.getElementById('container');
let turn = 'X';
let turns = 0;
let board_array = new Array(9).fill('E');
const winner = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

const call_back = (event) => {
    const element = event.target;
    if(board_array[element.id] === 'E') {

        // ADDING INNERTEXT 
        if(turn === 'X') {
            element.innerText = turn;
            board_array[element.id] = turn;
            turn = 'O';

            element.classList.add('X');
        }
        else if(turn === 'O') {
            element.innerText = turn;
            board_array[element.id] = turn;
            turn = 'X';

            element.classList.add('O');
        }
        turns++; // increment no. of turns.

        // CHECKING WINNING CONDITION
        winner.forEach(([ind1,ind2,ind3]) => {
            if(board_array[ind1] != 'E' && board_array[ind1] === board_array[ind2] && board_array[ind2] === board_array[ind3]) {
                document.getElementById('announce').innerText = `Player ${board_array[ind1]} is Winner`;
                container.removeEventListener('click',call_back);
            }
        });
        // CHECKINIG DRAW CONDITION
        if(turns == 9 && document.getElementById('announce').innerText === '') {

            document.getElementById('announce').innerText = 'Tie';
        }
    }
}
container.addEventListener('click',call_back);

const restart = document.getElementById('restart');
restart.addEventListener('click',() => {
    board_array = new Array(9).fill('E');
    for(let i = 0;i < 9;i++) {
        document.getElementById(`${i}`).innerText = "";
        document.getElementById(`${i}`).classList.remove('X');
        document.getElementById(`${i}`).classList.remove('O');
    }
    document.getElementById('announce').innerText = '';
    turn = 'X';
    turns = 0;
    container.addEventListener('click',call_back);
});
