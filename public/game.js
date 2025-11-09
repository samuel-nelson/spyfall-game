// Game state
let gameState = {
    gameCode: null,
    playerId: null,
    playerName: null,
    game: null,
    pollInterval: null
};

// API base URL - will work with Netlify Functions
const API_BASE = '/.netlify/functions';

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    showScreen('main-menu');
});

function setupEventListeners() {
    // Main menu
    document.getElementById('create-game-btn').addEventListener('click', () => {
        showScreen('create-game');
    });
    
    document.getElementById('join-game-btn').addEventListener('click', () => {
        showScreen('join-game');
    });

    // Create game
    document.getElementById('start-game-btn').addEventListener('click', createGame);
    document.getElementById('back-to-menu-btn').addEventListener('click', () => {
        showScreen('main-menu');
    });

    // Join game
    document.getElementById('join-game-submit-btn').addEventListener('click', joinGame);
    document.getElementById('back-to-menu-btn-2').addEventListener('click', () => {
        showScreen('main-menu');
    });

    // Lobby
    document.getElementById('start-round-btn').addEventListener('click', startRound);
    document.getElementById('leave-game-btn').addEventListener('click', leaveGame);

    // Game actions
    document.getElementById('ask-question-btn').addEventListener('click', showQuestionModal);
    document.getElementById('accuse-spy-btn').addEventListener('click', showAccusationModal);
    document.getElementById('submit-question-btn').addEventListener('click', submitQuestion);
    document.getElementById('cancel-question-btn').addEventListener('click', () => {
        document.getElementById('question-modal').style.display = 'none';
    });
    document.getElementById('submit-answer-btn').addEventListener('click', submitAnswer);
    document.getElementById('submit-accusation-btn').addEventListener('click', submitAccusation);
    document.getElementById('cancel-accusation-btn').addEventListener('click', () => {
        document.getElementById('accusation-modal').style.display = 'none';
    });
    document.getElementById('guess-location-btn').addEventListener('click', showGuessLocationModal);
    document.getElementById('submit-guess-btn').addEventListener('click', submitLocationGuess);
    document.getElementById('cancel-guess-btn').addEventListener('click', () => {
        document.getElementById('guess-location-modal').style.display = 'none';
    });
    document.getElementById('next-round-btn').addEventListener('click', nextRound);
    document.getElementById('back-to-lobby-btn').addEventListener('click', () => {
        showScreen('lobby');
        stopPolling();
        startPolling();
    });
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

async function createGame() {
    const playerName = document.getElementById('player-name-create').value.trim();
    const gameCode = document.getElementById('game-code-create').value.trim().toUpperCase();

    if (!playerName) {
        alert('Please enter your name');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/create-game`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerName, gameCode: gameCode || undefined })
        });

        const data = await response.json();
        
        if (data.error) {
            alert(data.error);
            return;
        }

        gameState.gameCode = data.gameCode;
        gameState.playerId = data.playerId;
        gameState.playerName = playerName;

        document.getElementById('display-game-code').textContent = data.gameCode;
        showScreen('lobby');
        startPolling();
    } catch (error) {
        console.error('Error creating game:', error);
        alert('Failed to create game. Please try again.');
    }
}

async function joinGame() {
    const playerName = document.getElementById('player-name-join').value.trim();
    const gameCode = document.getElementById('game-code-join').value.trim().toUpperCase();

    if (!playerName) {
        alert('Please enter your name');
        return;
    }

    if (!gameCode) {
        alert('Please enter a game code');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/join-game`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerName, gameCode })
        });

        const data = await response.json();
        
        if (data.error) {
            alert(data.error);
            return;
        }

        gameState.gameCode = gameCode;
        gameState.playerId = data.playerId;
        gameState.playerName = playerName;

        document.getElementById('display-game-code').textContent = gameCode;
        showScreen('lobby');
        startPolling();
    } catch (error) {
        console.error('Error joining game:', error);
        alert('Failed to join game. Please check the game code and try again.');
    }
}

async function startRound() {
    try {
        const response = await fetch(`${API_BASE}/start-round`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                gameCode: gameState.gameCode,
                playerId: gameState.playerId
            })
        });

        const data = await response.json();
        
        if (data.error) {
            alert(data.error);
            return;
        }

        // Game state will be updated via polling
    } catch (error) {
        console.error('Error starting round:', error);
        alert('Failed to start round. Please try again.');
    }
}

async function leaveGame() {
    stopPolling();
    gameState = {
        gameCode: null,
        playerId: null,
        playerName: null,
        game: null,
        pollInterval: null
    };
    showScreen('main-menu');
}

function startPolling() {
    if (gameState.pollInterval) {
        clearInterval(gameState.pollInterval);
    }

    // Poll immediately
    pollGameState();

    // Then poll every 2 seconds
    gameState.pollInterval = setInterval(pollGameState, 2000);
}

function stopPolling() {
    if (gameState.pollInterval) {
        clearInterval(gameState.pollInterval);
        gameState.pollInterval = null;
    }
}

async function pollGameState() {
    if (!gameState.gameCode || !gameState.playerId) return;

    try {
        const response = await fetch(`${API_BASE}/game-state?gameCode=${gameState.gameCode}&playerId=${gameState.playerId}`);
        const data = await response.json();

        if (data.error) {
            console.error('Error fetching game state:', data.error);
            return;
        }

        gameState.game = data.game;
        updateUI();
    } catch (error) {
        console.error('Error polling game state:', error);
    }
}

function updateUI() {
    const game = gameState.game;
    if (!game) return;

    // Update lobby
    if (game.status === 'lobby') {
        updateLobby(game);
    } else if (game.status === 'playing' || game.status === 'roundEnd') {
        updateGameScreen(game);
    }
}

function updateLobby(game) {
    const playersList = document.getElementById('players-list');
    playersList.innerHTML = '';

    game.players.forEach(player => {
        const playerItem = document.createElement('div');
        playerItem.className = 'player-item';
        if (player.id === gameState.playerId) {
            playerItem.classList.add('you');
        }
        playerItem.innerHTML = `
            <span class="player-name">${escapeHtml(player.name)}</span>
            ${player.id === gameState.playerId ? '<span>(You)</span>' : ''}
        `;
        playersList.appendChild(playerItem);
    });

    document.getElementById('player-count').textContent = game.players.length;

    const startBtn = document.getElementById('start-round-btn');
    const waitingText = document.querySelector('.waiting-text');
    
    if (game.players.length >= 3) {
        // Check if current player is the host (first player)
        const isHost = game.players[0] && game.players[0].id === gameState.playerId;
        if (isHost) {
            startBtn.style.display = 'block';
            waitingText.style.display = 'none';
        } else {
            startBtn.style.display = 'none';
            waitingText.textContent = 'Waiting for host to start the game...';
            waitingText.style.display = 'block';
        }
    } else {
        startBtn.style.display = 'none';
        waitingText.textContent = 'Waiting for more players... (Need at least 3)';
        waitingText.style.display = 'block';
    }
}

function updateGameScreen(game) {
    if (game.status === 'playing') {
        showScreen('game-screen');
        updatePlayingState(game);
    } else if (game.status === 'roundEnd') {
        showScreen('game-screen');
        showRoundResult(game);
    }
}

function updatePlayingState(game) {
    const currentRound = game.currentRound;
    if (!currentRound) return;

    document.getElementById('round-number').textContent = currentRound.roundNumber || 1;

    // Update timer
    if (currentRound.endTime) {
        updateTimer(currentRound.endTime);
    }

    // Find current player
    const currentPlayer = game.players.find(p => p.id === gameState.playerId);
    if (!currentPlayer) return;

    // Check if player is spy
    const isSpy = currentRound.spyId === gameState.playerId;
    
    // Show appropriate view
    const spyView = document.getElementById('spy-view');
    const locationView = document.getElementById('location-view');
    
    if (isSpy) {
        spyView.style.display = 'block';
        locationView.style.display = 'none';
    } else {
        spyView.style.display = 'none';
        locationView.style.display = 'block';
        document.getElementById('location-name').textContent = currentRound.location;
    }

    // Update players status
    updatePlayersStatus(game.players, currentRound);

    // Update question area
    updateQuestionArea(currentRound);

    // Update game actions
    updateGameActions(game, currentRound, currentPlayer);
}

function updateTimer(endTime) {
    const now = Date.now();
    const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    document.getElementById('timer-display').textContent = 
        `${minutes}:${seconds.toString().padStart(2, '0')}`;

    if (remaining === 0 && gameState.game && gameState.game.status === 'playing') {
        // Time's up - trigger end round
        setTimeout(() => pollGameState(), 500);
    }
}

function updatePlayersStatus(players, round) {
    const playersStatus = document.getElementById('players-status');
    playersStatus.innerHTML = '';

    players.forEach(player => {
        const card = document.createElement('div');
        card.className = 'player-status-card';
        
        const isCurrentTurn = round.currentTurn === player.id;
        if (isCurrentTurn) {
            card.classList.add('active');
        } else if (round.waitingForAnswer && round.waitingForAnswer === player.id) {
            card.classList.add('waiting');
        }

        card.innerHTML = `
            <div class="player-name">${escapeHtml(player.name)}</div>
            ${isCurrentTurn ? '<div>Current Turn</div>' : ''}
            ${round.waitingForAnswer === player.id ? '<div>Answering...</div>' : ''}
        `;
        playersStatus.appendChild(card);
    });
}

function updateQuestionArea(round) {
    const questionArea = document.getElementById('question-area');
    
    if (round.currentQuestion) {
        questionArea.style.display = 'block';
        document.getElementById('current-question-text').textContent = round.currentQuestion.text;
        document.getElementById('question-asker').textContent = round.currentQuestion.askerName;
        document.getElementById('question-answerer').textContent = round.currentQuestion.answererName;
    } else {
        questionArea.style.display = 'none';
    }
}

function updateGameActions(game, round, currentPlayer) {
    const askBtn = document.getElementById('ask-question-btn');
    const accuseBtn = document.getElementById('accuse-spy-btn');
    const guessBtn = document.getElementById('guess-location-btn');

    const isSpy = round.spyId === gameState.playerId;
    const isMyTurn = round.currentTurn === gameState.playerId;
    const hasPendingQuestion = round.waitingForAnswer;

    // Can ask question if it's your turn and no question is pending (and you're not the spy)
    const canAsk = isMyTurn && !hasPendingQuestion && !isSpy;
    askBtn.style.display = canAsk ? 'block' : 'none';

    // Can accuse if it's your turn and no question is pending (and you're not the spy)
    const canAccuse = isMyTurn && !hasPendingQuestion && !isSpy;
    accuseBtn.style.display = canAccuse ? 'block' : 'none';

    // Spy can guess location at any time when it's not their turn to ask/accuse
    const canGuess = isSpy && (!isMyTurn || hasPendingQuestion);
    guessBtn.style.display = canGuess ? 'block' : 'none';
}

function showQuestionModal() {
    const game = gameState.game;
    if (!game || !game.currentRound) return;

    const select = document.getElementById('question-target');
    select.innerHTML = '';

    // Add other players as options
    game.players.forEach(player => {
        if (player.id !== gameState.playerId) {
            const option = document.createElement('option');
            option.value = player.id;
            option.textContent = player.name;
            select.appendChild(option);
        }
    });

    document.getElementById('question-text').value = '';
    document.getElementById('question-modal').style.display = 'flex';
}

async function submitQuestion() {
    const targetId = document.getElementById('question-target').value;
    const questionText = document.getElementById('question-text').value.trim();

    if (!questionText) {
        alert('Please enter a question');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/ask-question`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                gameCode: gameState.gameCode,
                playerId: gameState.playerId,
                targetId,
                question: questionText
            })
        });

        const data = await response.json();
        
        if (data.error) {
            alert(data.error);
            return;
        }

        document.getElementById('question-modal').style.display = 'none';
        // State will update via polling
    } catch (error) {
        console.error('Error asking question:', error);
        alert('Failed to ask question. Please try again.');
    }
}

async function submitAnswer() {
    const answerText = document.getElementById('answer-text').value.trim();

    if (!answerText) {
        alert('Please enter an answer');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/answer-question`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                gameCode: gameState.gameCode,
                playerId: gameState.playerId,
                answer: answerText
            })
        });

        const data = await response.json();
        
        if (data.error) {
            alert(data.error);
            return;
        }

        document.getElementById('answer-modal').style.display = 'none';
        // State will update via polling
    } catch (error) {
        console.error('Error answering question:', error);
        alert('Failed to submit answer. Please try again.');
    }
}

function showAccusationModal() {
    const game = gameState.game;
    if (!game || !game.currentRound) return;

    const select = document.getElementById('accused-player');
    select.innerHTML = '';

    // Add other players as options
    game.players.forEach(player => {
        if (player.id !== gameState.playerId) {
            const option = document.createElement('option');
            option.value = player.id;
            option.textContent = player.name;
            select.appendChild(option);
        }
    });

    document.getElementById('accusation-modal').style.display = 'flex';
}

async function submitAccusation() {
    const accusedId = document.getElementById('accused-player').value;

    try {
        const response = await fetch(`${API_BASE}/accuse-spy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                gameCode: gameState.gameCode,
                playerId: gameState.playerId,
                accusedId
            })
        });

        const data = await response.json();
        
        if (data.error) {
            alert(data.error);
            return;
        }

        document.getElementById('accusation-modal').style.display = 'none';
        // State will update via polling
    } catch (error) {
        console.error('Error accusing spy:', error);
        alert('Failed to submit accusation. Please try again.');
    }
}

function showGuessLocationModal() {
    // Populate datalist with locations
    const datalist = document.getElementById('locations-list');
    datalist.innerHTML = '';
    
    LOCATIONS.forEach(location => {
        const option = document.createElement('option');
        option.value = location.name;
        datalist.appendChild(option);
    });

    document.getElementById('guessed-location').value = '';
    document.getElementById('guess-location-modal').style.display = 'flex';
}

async function submitLocationGuess() {
    const guessedLocation = document.getElementById('guessed-location').value.trim();

    if (!guessedLocation) {
        alert('Please enter a location');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/guess-location`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                gameCode: gameState.gameCode,
                playerId: gameState.playerId,
                guessedLocation
            })
        });

        const data = await response.json();
        
        if (data.error) {
            alert(data.error);
            return;
        }

        document.getElementById('guess-location-modal').style.display = 'none';
        
        if (data.isCorrect) {
            alert('Correct! You win!');
        } else {
            alert('Wrong location. Keep trying!');
        }
        
        // State will update via polling
    } catch (error) {
        console.error('Error guessing location:', error);
        alert('Failed to submit guess. Please try again.');
    }
}

function showRoundResult(game) {
    const round = game.currentRound;
    if (!round) return;

    const modal = document.getElementById('game-result-modal');
    const title = document.getElementById('result-title');
    const content = document.getElementById('result-content');
    const nextRoundBtn = document.getElementById('next-round-btn');
    const backToLobbyBtn = document.getElementById('back-to-lobby-btn');

    let resultText = '';
    const isSpy = round.spyId === gameState.playerId;
    const spyWon = round.spyWon;

    if (round.spyGuessedLocation) {
        // Spy guessed the location
        title.textContent = 'Spy Wins!';
        resultText = `
            <p>The spy correctly identified the location!</p>
            <p><strong>Location was:</strong> ${escapeHtml(round.location)}</p>
            <p><strong>Spy guessed:</strong> ${escapeHtml(round.spyGuessedLocation)}</p>
        `;
    } else if (round.accusation) {
        const accusedPlayer = game.players.find(p => p.id === round.accusation.accusedId);
        const wasCorrect = round.accusation.accusedId === round.spyId;

        if (wasCorrect) {
            title.textContent = 'Spy Caught!';
            resultText = `
                <p>The spy ${escapeHtml(accusedPlayer.name)} was correctly identified!</p>
                <p><strong>Location was:</strong> ${escapeHtml(round.location)}</p>
            `;
        } else {
            title.textContent = 'Wrong Accusation!';
            resultText = `
                <p>${escapeHtml(accusedPlayer.name)} was not the spy!</p>
                <p>The spy ${escapeHtml(game.players.find(p => p.id === round.spyId).name)} wins!</p>
                <p><strong>Location was:</strong> ${escapeHtml(round.location)}</p>
            `;
        }
    } else if (spyWon) {
        title.textContent = 'Spy Wins!';
        resultText = `
            <p>The spy survived until time ran out!</p>
            <p><strong>Location was:</strong> ${escapeHtml(round.location)}</p>
        `;
    } else {
        title.textContent = 'Round Ended';
        resultText = `
            <p>The round has ended.</p>
            <p><strong>Location was:</strong> ${escapeHtml(round.location)}</p>
            <p><strong>Spy was:</strong> ${escapeHtml(game.players.find(p => p.id === round.spyId).name)}</p>
        `;
    }

    content.innerHTML = resultText;

    // Show next round button if host
    const isHost = game.players[0] && game.players[0].id === gameState.playerId;
    nextRoundBtn.style.display = isHost ? 'block' : 'none';
    backToLobbyBtn.style.display = isHost ? 'none' : 'block';

    modal.style.display = 'flex';
}

async function nextRound() {
    document.getElementById('game-result-modal').style.display = 'none';
    await startRound();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Check for pending questions/answers when game state updates
let lastWaitingForAnswer = null;

function checkForPendingActions(game) {
    if (!game || !game.currentRound) return;

    const round = game.currentRound;
    
    // Check if player needs to answer a question
    if (round.waitingForAnswer === gameState.playerId && 
        round.currentQuestion && 
        lastWaitingForAnswer !== gameState.playerId) {
        showAnswerModal(round.currentQuestion);
        lastWaitingForAnswer = gameState.playerId;
    } else if (round.waitingForAnswer !== gameState.playerId) {
        lastWaitingForAnswer = null;
    }
}

function showAnswerModal(question) {
    document.getElementById('question-to-answer').textContent = 
        `${escapeHtml(question.askerName)} asks: "${escapeHtml(question.text)}"`;
    document.getElementById('answer-text').value = '';
    document.getElementById('answer-modal').style.display = 'flex';
}

// Update the updateUI function to check for pending actions
const originalUpdateUI = updateUI;
updateUI = function() {
    originalUpdateUI();
    checkForPendingActions(gameState.game);
};

