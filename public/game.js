// Game state
let gameState = {
    gameCode: null,
    playerId: null,
    playerName: null,
    game: null,
    pollInterval: null,
    timerInterval: null
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
    document.getElementById('vote-spy-action-btn').addEventListener('click', showVoteModal);
    document.getElementById('vote-spy-btn').addEventListener('click', showVoteModal);
    document.getElementById('submit-question-btn').addEventListener('click', submitQuestion);
    document.getElementById('cancel-question-btn').addEventListener('click', () => {
        document.getElementById('question-modal').style.display = 'none';
    });
    document.getElementById('submit-answer-btn').addEventListener('click', submitAnswer);
    document.getElementById('submit-vote-btn').addEventListener('click', submitVote);
    document.getElementById('cancel-vote-btn').addEventListener('click', () => {
        document.getElementById('vote-modal').style.display = 'none';
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
        showNotification('Please enter your codename', 'error');
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
            showNotification(data.error, 'error');
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
        showNotification('Failed to create operation. Please try again.', 'error');
    }
}

async function joinGame() {
    const playerName = document.getElementById('player-name-join').value.trim();
    const gameCode = document.getElementById('game-code-join').value.trim().toUpperCase();

    if (!playerName) {
        showNotification('Please enter your codename', 'error');
        return;
    }

    if (!gameCode) {
        showNotification('Please enter an operation code', 'error');
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
            showNotification(data.error, 'error');
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
        showNotification('Failed to join operation. Verify the code and try again.', 'error');
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
            showNotification(data.error, 'error');
            return;
        }

        // Game state will be updated via polling
    } catch (error) {
        console.error('Error starting round:', error);
        showNotification('Failed to initiate operation. Please try again.', 'error');
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
    stopTimer();
}

function startTimer(endTime) {
    stopTimer(); // Clear any existing timer
    
    if (!endTime) return;
    
    // Update immediately
    updateTimer(endTime);
    
    // Then update every second
    gameState.timerInterval = setInterval(() => {
        updateTimer(endTime);
    }, 1000);
}

function stopTimer() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
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
        stopTimer(); // Stop timer when round ends
        showScreen('game-screen');
        showRoundResult(game);
    } else if (game.status === 'lobby') {
        stopTimer(); // Stop timer when back in lobby
    }
}

function updatePlayingState(game) {
    const currentRound = game.currentRound;
    if (!currentRound) return;

    document.getElementById('round-number').textContent = currentRound.roundNumber || 1;

    // Start/update timer with real-time updates
    if (currentRound.endTime) {
        startTimer(currentRound.endTime);
    } else {
        stopTimer();
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
        const isWaitingForAnswer = round.waitingForAnswer === player.id;
        const isYou = player.id === gameState.playerId;
        
        if (isCurrentTurn) {
            card.classList.add('active');
        } else if (isWaitingForAnswer) {
            card.classList.add('waiting');
        }

        let statusText = '';
        if (isCurrentTurn) {
            statusText = '<div class="status-badge">ACTIVE</div>';
        } else if (isWaitingForAnswer) {
            statusText = '<div class="status-badge waiting-badge">RESPONDING</div>';
        }

        card.innerHTML = `
            <div class="player-name">${escapeHtml(player.name)}${isYou ? ' <span class="you-indicator">(YOU)</span>' : ''}</div>
            ${statusText}
        `;
        playersStatus.appendChild(card);
    });
}

function updateQuestionArea(round) {
    const questionArea = document.getElementById('question-area');
    const currentQuestionDiv = questionArea.querySelector('.current-question');
    
    if (round.currentQuestion) {
        questionArea.style.display = 'block';
        document.getElementById('current-question-text').textContent = `"${round.currentQuestion.text}"`;
        document.getElementById('question-asker').textContent = round.currentQuestion.askerName;
        document.getElementById('question-answerer').textContent = round.currentQuestion.answererName;
        
        // Show answer if available
        const existingAnswer = currentQuestionDiv.querySelector('.question-answer');
        if (round.currentQuestion.answer) {
            if (existingAnswer) {
                existingAnswer.textContent = `Response: "${round.currentQuestion.answer}"`;
            } else {
                const answerDiv = document.createElement('div');
                answerDiv.className = 'question-answer';
                answerDiv.style.cssText = 'margin-top: 15px; padding-top: 15px; border-top: 1px solid var(--color-border); color: var(--color-text-muted); font-style: italic;';
                answerDiv.textContent = `Response: "${round.currentQuestion.answer}"`;
                currentQuestionDiv.appendChild(answerDiv);
            }
        } else if (existingAnswer) {
            existingAnswer.remove();
        }
    } else {
        questionArea.style.display = 'none';
        // Clear any existing answer
        const existingAnswer = currentQuestionDiv?.querySelector('.question-answer');
        if (existingAnswer) {
            existingAnswer.remove();
        }
    }
}

function updateGameActions(game, round, currentPlayer) {
    const askBtn = document.getElementById('ask-question-btn');
    const voteBtn = document.getElementById('vote-spy-action-btn');
    const guessBtn = document.getElementById('guess-location-btn');
    const votingArea = document.getElementById('voting-area');
    const voteBtnInArea = document.getElementById('vote-spy-btn');

    const isSpy = round.spyId === gameState.playerId;
    const isMyTurn = round.currentTurn === gameState.playerId;
    const hasPendingQuestion = round.waitingForAnswer;

    // Can ask question if it's your turn and no question is pending (and you're not the spy)
    const canAsk = isMyTurn && !hasPendingQuestion && !isSpy;
    askBtn.style.display = canAsk ? 'block' : 'none';

    // Non-spies can vote at any time (not just on their turn)
    const canVote = !isSpy;
    voteBtn.style.display = canVote ? 'block' : 'none';

    // Spy can guess location at any time
    const canGuess = isSpy;
    guessBtn.style.display = canGuess ? 'block' : 'none';

    // Show voting area if votes exist
    if (round.votes && Object.keys(round.votes).length > 0) {
        votingArea.style.display = 'block';
        updateVotingStatus(game, round);
        voteBtnInArea.style.display = canVote ? 'block' : 'none';
    } else {
        votingArea.style.display = 'none';
    }
}

function updateVotingStatus(game, round) {
    const voteStatus = document.getElementById('vote-status');
    if (!round.votes || Object.keys(round.votes).length === 0) {
        voteStatus.innerHTML = '<p style="color: var(--color-text-muted);">No votes cast yet.</p>';
        return;
    }

    // Count votes
    const voteCounts = {};
    const nonSpyPlayers = game.players.filter(p => p.id !== round.spyId);
    
    Object.values(round.votes).forEach(votedPlayerId => {
        voteCounts[votedPlayerId] = (voteCounts[votedPlayerId] || 0) + 1;
    });

    // Display vote counts
    let html = '';
    for (const [playerId, count] of Object.entries(voteCounts)) {
        const player = game.players.find(p => p.id === playerId);
        if (player) {
            const majorityThreshold = Math.ceil(nonSpyPlayers.length / 2);
            const isMajority = count > majorityThreshold;
            html += `
                <div class="vote-item">
                    <span class="vote-player">${escapeHtml(player.name)}</span>
                    <span class="vote-count" style="${isMajority ? 'color: var(--color-danger);' : ''}">${count} vote${count !== 1 ? 's' : ''}</span>
                </div>
            `;
        }
    }

    // Show who has voted
    const votedPlayers = Object.keys(round.votes).map(voterId => {
        const voter = game.players.find(p => p.id === voterId);
        return voter ? voter.name : null;
    }).filter(Boolean);

    html += `<p style="margin-top: 15px; color: var(--color-text-muted); font-size: 0.9rem;">Voted: ${votedPlayers.join(', ')}</p>`;
    
    voteStatus.innerHTML = html;
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
        showNotification('Please enter a question', 'error');
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
            showNotification(data.error, 'error');
            return;
        }

        document.getElementById('question-modal').style.display = 'none';
        // State will update via polling
    } catch (error) {
        console.error('Error asking question:', error);
        showNotification('Failed to submit question. Please try again.', 'error');
    }
}

async function submitAnswer() {
    const answerText = document.getElementById('answer-text').value.trim();

    if (!answerText) {
        showNotification('Please enter a response', 'error');
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
            showNotification(data.error, 'error');
            return;
        }

        document.getElementById('answer-modal').style.display = 'none';
        // State will update via polling
    } catch (error) {
        console.error('Error answering question:', error);
        showNotification('Failed to submit response. Please try again.', 'error');
    }
}

function showVoteModal() {
    const game = gameState.game;
    if (!game || !game.currentRound) return;
    
    const round = game.currentRound;

    const select = document.getElementById('voted-player');
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

    // Show current vote if already voted
    if (round.votes && round.votes[gameState.playerId]) {
        select.value = round.votes[gameState.playerId];
    }

    document.getElementById('vote-modal').style.display = 'flex';
}

async function submitVote() {
    const votedId = document.getElementById('voted-player').value;

    if (!votedId) {
        showNotification('Please select a player to vote for', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/vote-spy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                gameCode: gameState.gameCode,
                playerId: gameState.playerId,
                accusedId: votedId
            })
        });

        const data = await response.json();
        
        if (data.error) {
            showNotification(data.error, 'error');
            return;
        }

        document.getElementById('vote-modal').style.display = 'none';
        
        if (data.majorityReached) {
            showNotification(data.wasCorrect ? 'Spy identified! Round ending...' : 'Incorrect vote. Spy wins!', data.wasCorrect ? 'success' : 'error');
        } else {
            showNotification('Vote recorded. Waiting for majority...', 'info');
        }
        
        // State will update via polling
    } catch (error) {
        console.error('Error voting for spy:', error);
        showNotification('Failed to submit vote. Please try again.', 'error');
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'error' ? 'var(--color-danger)' : type === 'success' ? 'var(--color-success)' : 'var(--color-primary)'};
        color: white;
        border: 1px solid ${type === 'error' ? '#6B0000' : type === 'success' ? '#1F3A0F' : 'var(--color-primary-dark)'};
        z-index: 10000;
        font-family: var(--font-sans);
        font-size: 0.9rem;
        letter-spacing: 1px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
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
        showNotification('Please enter a location', 'error');
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
            showNotification(data.error, 'error');
            return;
        }

        document.getElementById('guess-location-modal').style.display = 'none';
        
        if (data.isCorrect) {
            showNotification('Location identified! Operation successful.', 'success');
        } else {
            showNotification('Incorrect location. Continue your investigation.', 'error');
        }
        
        // State will update via polling
    } catch (error) {
        console.error('Error guessing location:', error);
        showNotification('Failed to submit guess. Please try again.', 'error');
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
        title.textContent = 'OPERATION COMPROMISED';
        title.style.color = 'var(--color-danger)';
        resultText = `
            <p>The spy successfully identified the location.</p>
            <p style="margin-top: 20px;"><strong>Location:</strong> ${escapeHtml(round.location)}</p>
            <p><strong>Spy's guess:</strong> ${escapeHtml(round.spyGuessedLocation)}</p>
        `;
    } else if (round.accusation) {
        const accusedPlayer = game.players.find(p => p.id === round.accusation.accusedId);
        const wasCorrect = round.accusation.accusedId === round.spyId;

        if (round.accusation.type === 'vote') {
            // Voting result
            if (wasCorrect) {
                title.textContent = 'SPY IDENTIFIED';
                title.style.color = 'var(--color-success)';
                resultText = `
                    <p>Majority vote correctly identified the spy: <strong>${escapeHtml(accusedPlayer.name)}</strong></p>
                    <p style="margin-top: 20px;"><strong>Location:</strong> ${escapeHtml(round.location)}</p>
                `;
                
                // Show vote breakdown
                if (round.accusation.voteCounts) {
                    resultText += '<div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid var(--color-border);">';
                    resultText += '<p style="font-size: 0.9rem; color: var(--color-text-muted); margin-bottom: 10px;">VOTE BREAKDOWN:</p>';
                    for (const [playerId, count] of Object.entries(round.accusation.voteCounts)) {
                        const player = game.players.find(p => p.id === playerId);
                        if (player) {
                            resultText += `<p style="font-size: 0.95rem;">${escapeHtml(player.name)}: ${count} vote${count !== 1 ? 's' : ''}</p>`;
                        }
                    }
                    resultText += '</div>';
                }
            } else {
                title.textContent = 'INCORRECT VOTE';
                title.style.color = 'var(--color-danger)';
                resultText = `
                    <p>${escapeHtml(accusedPlayer.name)} was not the spy.</p>
                    <p>The spy <strong>${escapeHtml(game.players.find(p => p.id === round.spyId).name)}</strong> has evaded detection.</p>
                    <p style="margin-top: 20px;"><strong>Location:</strong> ${escapeHtml(round.location)}</p>
                `;
            }
        } else {
            // Individual accusation
            if (wasCorrect) {
                title.textContent = 'SPY CAUGHT';
                title.style.color = 'var(--color-success)';
                resultText = `
                    <p>The spy <strong>${escapeHtml(accusedPlayer.name)}</strong> was correctly identified.</p>
                    <p style="margin-top: 20px;"><strong>Location:</strong> ${escapeHtml(round.location)}</p>
                `;
            } else {
                title.textContent = 'INCORRECT ACCUSATION';
                title.style.color = 'var(--color-danger)';
                resultText = `
                    <p>${escapeHtml(accusedPlayer.name)} was not the spy.</p>
                    <p>The spy <strong>${escapeHtml(game.players.find(p => p.id === round.spyId).name)}</strong> wins.</p>
                    <p style="margin-top: 20px;"><strong>Location:</strong> ${escapeHtml(round.location)}</p>
                `;
            }
        }
    } else if (spyWon) {
        title.textContent = 'TIME EXPIRED';
        title.style.color = 'var(--color-danger)';
        resultText = `
            <p>The spy survived until time ran out.</p>
            <p style="margin-top: 20px;"><strong>Location:</strong> ${escapeHtml(round.location)}</p>
        `;
    } else {
        title.textContent = 'ROUND CONCLUDED';
        title.style.color = 'var(--color-primary)';
        resultText = `
            <p>The operation has concluded.</p>
            <p style="margin-top: 20px;"><strong>Location:</strong> ${escapeHtml(round.location)}</p>
            <p><strong>Spy:</strong> ${escapeHtml(game.players.find(p => p.id === round.spyId).name)}</p>
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
    stopTimer(); // Stop timer before starting new round
    
    try {
        await startRound();
        // Poll immediately to get updated state
        setTimeout(() => pollGameState(), 500);
    } catch (error) {
        console.error('Error starting next round:', error);
        showNotification('Failed to start next round. Please try again.', 'error');
    }
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
    const questionPrompt = document.getElementById('question-to-answer');
    questionPrompt.innerHTML = `
        <span style="color: var(--color-primary); font-weight: 500;">${escapeHtml(question.askerName)}</span> asks:<br>
        <span style="font-size: 1.2rem; margin-top: 10px; display: block;">"${escapeHtml(question.text)}"</span>
    `;
    document.getElementById('answer-text').value = '';
    document.getElementById('answer-modal').style.display = 'flex';
}

// Update the updateUI function to check for pending actions
const originalUpdateUI = updateUI;
updateUI = function() {
    originalUpdateUI();
    checkForPendingActions(gameState.game);
};

