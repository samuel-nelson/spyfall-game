// Game state
let gameState = {
    gameCode: null,
    playerId: null,
    playerName: null,
    game: null,
    pollInterval: null,
    timerInterval: null,
    bannerFadeTimeout: null,
    bannerShownForTurn: null, // Track which turn the banner was shown for
    showingResultModal: false, // Prevent multiple calls to showRoundResult
    resultModalButtonsSetup: false // Prevent multiple button setups
};

// API base URL - will work with Netlify Functions
const API_BASE = '/.netlify/functions';

// Global button handlers for inline onclick attributes
window.handleNextRound = function() {
    nextRound();
    return false;
};

window.handleBackToLobby = async function() {
    const currentGame = gameState.game;
    const currentIsHost = currentGame && currentGame.players && currentGame.players.length > 0 && currentGame.players[0].id === gameState.playerId;
    
    // If host, end the game (kicks everyone out)
    if (currentIsHost) {
        try {
            const response = await fetch(`${API_BASE}/end-game`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    gameCode: gameState.gameCode,
                    playerId: gameState.playerId
                })
            });
            
            if (response.ok) {
                showNotification('Game ended. All players have been disconnected.', 'info');
            }
        } catch (error) {
            console.error('Error ending game:', error);
        }
    }
    
    window.closeModal('game-result-modal');
    // Clear game state but keep gameCode and playerName for potential rejoin
    const gameCode = gameState.gameCode;
    const playerName = gameState.playerName;
    gameState.gameCode = null;
    gameState.playerId = null;
    gameState.game = null;
    stopPolling();
    stopTimer();
    // Store for potential rejoin
    if (gameCode && playerName) {
        sessionStorage.setItem('lastGameCode', gameCode);
        sessionStorage.setItem('lastPlayerName', playerName);
    }
    showScreen('main-menu');
    return false;
};

// Function to close modal - must be defined early as it's used by event listeners
window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        // Remove the 'show' class
        modal.classList.remove('show');
        
        // Force display: none as backup
        modal.style.display = 'none';
        
        // Restore body scroll
        document.body.style.overflow = '';
        
        // Reset the showing flag if closing the result modal
        if (modalId === 'game-result-modal') {
            gameState.showingResultModal = false;
        }
        
        // Clear any selected location
        if (modalId === 'guess-location-modal') {
            selectedLocationForGuess = null;
        }
    }
};

// Test that handlers are accessible
console.log('✅ Global handlers defined:', {
    handleNextRound: typeof window.handleNextRound,
    handleBackToLobby: typeof window.handleBackToLobby,
    closeModal: typeof window.closeModal
});

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
    
    // Auto-save settings on change
    document.getElementById('mole-count').addEventListener('change', autoSaveSettings);
    document.getElementById('show-mole-count').addEventListener('change', autoSaveSettings);
    document.getElementById('timer-minutes').addEventListener('change', autoSaveSettings);
    document.getElementById('timer-minutes').addEventListener('input', debounce(autoSaveSettings, 1000));
    
    // Pack selection checkboxes
    document.getElementById('pack1-checkbox').addEventListener('change', autoSaveSettings);
    document.getElementById('pack2-checkbox').addEventListener('change', autoSaveSettings);
    document.getElementById('countries-checkbox').addEventListener('change', autoSaveSettings);
    document.getElementById('theme-toggle-btn').addEventListener('click', toggleTheme);
    document.getElementById('theme-toggle-btn-main').addEventListener('click', toggleTheme);
    document.getElementById('theme-toggle-btn-create').addEventListener('click', toggleTheme);
    document.getElementById('theme-toggle-btn-join').addEventListener('click', toggleTheme);
    document.getElementById('theme-toggle-btn-game').addEventListener('click', toggleTheme);

    // Game actions
    document.getElementById('vote-mole-action-btn').addEventListener('click', showVoteModal);
    document.getElementById('vote-mole-btn').addEventListener('click', showVoteModal);
    document.getElementById('submit-answer-btn').addEventListener('click', submitAnswer);
    document.getElementById('submit-vote-btn').addEventListener('click', submitVote);
    document.getElementById('cancel-vote-btn').addEventListener('click', () => {
        window.closeModal('vote-modal');
    });
    document.getElementById('guess-location-btn').addEventListener('click', showGuessLocationModal);
    document.getElementById('submit-guess-btn').addEventListener('click', submitLocationGuess);
    document.getElementById('cancel-guess-btn').addEventListener('click', () => {
        window.closeModal('guess-location-modal');
    });
    // Buttons will use onclick attributes for reliability
    // These are set up in showRoundResult to ensure they always work
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
    // Check for stored game code/name from session (for rejoin after leaving)
    const storedGameCode = sessionStorage.getItem('lastGameCode');
    const storedPlayerName = sessionStorage.getItem('lastPlayerName');
    
    let playerName = document.getElementById('player-name-join').value.trim();
    let gameCode = document.getElementById('game-code-join').value.trim().toUpperCase();
    
    // If inputs are empty but we have stored values, use those
    if (!playerName && storedPlayerName) {
        playerName = storedPlayerName;
        document.getElementById('player-name-join').value = playerName;
    }
    if (!gameCode && storedGameCode) {
        gameCode = storedGameCode;
        document.getElementById('game-code-join').value = gameCode;
    }

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
        
        // Clear stored values on successful join
        sessionStorage.removeItem('lastGameCode');
        sessionStorage.removeItem('lastPlayerName');
    } catch (error) {
        console.error('Error joining game:', error);
        showNotification('Failed to join operation. Verify the code and try again.', 'error');
    }
}

async function startRound() {
    console.log('⭐⭐ startRound: Called');
    // Save settings before starting round if host (but don't block on errors)
    const game = gameState.game;
    const isHost = game && game.players[0] && game.players[0].id === gameState.playerId;
    console.log('⭐⭐ startRound: Game:', game, 'isHost:', isHost);
    
    if (isHost && (game.status === 'lobby' || game.status === 'roundEnd')) {
        try {
            await saveGameSettingsSilent();
        } catch (error) {
            console.error('Error saving settings before start:', error);
            // Don't block starting the round if settings save fails
        }
    }
    
    try {
        console.log('⭐⭐ startRound: Sending request to start-round API...');
        const response = await fetch(`${API_BASE}/start-round`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                gameCode: gameState.gameCode,
                playerId: gameState.playerId
            })
        });

        console.log('⭐⭐ startRound: API response status:', response.status);
        const data = await response.json();
        console.log('⭐⭐ startRound: API response data:', data);
        
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
    if (!gameState.gameCode || !gameState.playerId) {
        stopPolling();
        gameState = {
            gameCode: null,
            playerId: null,
            playerName: null,
            game: null,
            pollInterval: null,
            timerInterval: null
        };
        showScreen('main-menu');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/leave-game`, {
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

        stopPolling();
        gameState = {
            gameCode: null,
            playerId: null,
            playerName: null,
            game: null,
            pollInterval: null,
            timerInterval: null
        };
        showScreen('main-menu');
    } catch (error) {
        console.error('Error leaving game:', error);
        showNotification('Failed to leave game. Please try again.', 'error');
    }
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
    if (!gameState.gameCode || !gameState.playerId) return Promise.resolve();

    try {
        const response = await fetch(`${API_BASE}/game-state?gameCode=${gameState.gameCode}&playerId=${gameState.playerId}`);
        const data = await response.json();

        if (data.error) {
            console.error('Error fetching game state:', data.error);
            return Promise.resolve();
        }

        gameState.game = data.game;
        updateUI();
        return Promise.resolve();
    } catch (error) {
        console.error('Error polling game state:', error);
        return Promise.resolve();
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
    const settingsDiv = document.getElementById('game-settings');
    
    // Check if current player is the host (first player)
    const isHost = game.players[0] && game.players[0].id === gameState.playerId;
    
    if (game.players.length >= 3) {
        if (isHost) {
            startBtn.style.display = 'block';
            waitingText.style.display = 'none';
            settingsDiv.style.display = 'block';
            
            // Load current settings
            if (game.settings) {
                document.getElementById('mole-count').value = game.settings.moleCount || game.settings.spyCount || 1; // Support legacy spyCount
                document.getElementById('show-mole-count').value = (game.settings.showMoleCount !== false && game.settings.showSpyCount !== false) ? 'true' : 'false'; // Support legacy
                document.getElementById('timer-minutes').value = game.settings.timerMinutes || 8;
                
                // Load pack selections
                const enabledPacks = game.settings.enabledPacks || ['pack1'];
                document.getElementById('pack1-checkbox').checked = enabledPacks.includes('pack1');
                document.getElementById('pack2-checkbox').checked = enabledPacks.includes('pack2');
                document.getElementById('countries-checkbox').checked = enabledPacks.includes('countries');
            } else {
                // Default: Pack 1 only
                document.getElementById('pack1-checkbox').checked = true;
                document.getElementById('pack2-checkbox').checked = false;
                document.getElementById('countries-checkbox').checked = false;
            }
        } else {
            startBtn.style.display = 'none';
            settingsDiv.style.display = 'none';
            waitingText.textContent = 'Waiting for host to start the game...';
            waitingText.style.display = 'block';
        }
    } else {
        startBtn.style.display = 'none';
        settingsDiv.style.display = isHost ? 'block' : 'none';
        waitingText.textContent = 'Waiting for more players... (Need at least 3)';
        waitingText.style.display = 'block';
    }
}

let lastGameStatus = null;

let hasScrolledToTopOnGameStart = false;

function updateGameScreen(game) {
    console.log('🎮 updateGameScreen: Status =', game.status, 'lastGameStatus =', lastGameStatus);
    
    if (game.status === 'playing') {
        const wasInLobby = lastGameStatus === 'lobby' || lastGameStatus === null;
        const wasRoundEnd = lastGameStatus === 'roundEnd';
        
        console.log('🎮 Game is PLAYING. wasRoundEnd:', wasRoundEnd);
        
        // Close result modal if transitioning from roundEnd to playing
        if (wasRoundEnd) {
            console.log('🎮 Transitioning from roundEnd to playing - closing modal');
            window.closeModal('game-result-modal');
            gameState.showingResultModal = false; // Reset flag when closing modal
        }
        
        showScreen('game-screen');
        // Always scroll to top when transitioning from lobby to playing
        if (wasInLobby) {
            setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'instant' });
                document.documentElement.scrollTop = 0;
                document.body.scrollTop = 0;
                hasScrolledToTopOnGameStart = true;
            }, 100);
        }
        updatePlayingState(game);
    } else if (game.status === 'roundEnd') {
        console.log('🎮 Game is ROUNDEND');
        stopTimer(); // Stop timer when round ends
        // Always show result modal for ALL players including moles - NO EXCEPTIONS
        showScreen('game-screen');
        
        // Check if modal is already showing - if so, don't rebuild it
        const modal = document.getElementById('game-result-modal');
        const isModalShowing = modal && modal.classList.contains('show');
        
        console.log('🎮 isModalShowing:', isModalShowing, 'showingResultModal flag:', gameState.showingResultModal);
        
        // Only show modal if it's not already showing
        if (!isModalShowing && !gameState.showingResultModal) {
            gameState.showingResultModal = true;
            console.log('🎮 Showing result modal for first time');
            // Show modal once - use requestAnimationFrame to ensure DOM is ready
            requestAnimationFrame(() => {
                showRoundResult(game);
                // Don't reset the flag - keep it true so we never call showRoundResult again
                // The flag will only be reset when the modal is closed or game transitions to another state
            });
        } else {
            console.log('🎮 Modal already showing, skipping showRoundResult call');
        }
    } else if (game.status === 'lobby') {
        console.log('🎮 Game is LOBBY');
        stopTimer(); // Stop timer when back in lobby
        hasScrolledToTopOnGameStart = false; // Reset flag when back in lobby
        // Close result modal if returning to lobby
        window.closeModal('game-result-modal');
        gameState.showingResultModal = false; // Reset flag when closing modal
    }
    
    lastGameStatus = game.status;
    console.log('🎮 updateGameScreen complete. lastGameStatus now:', lastGameStatus);
}

function updatePlayingState(game) {
    const currentRound = game.currentRound;
    if (!currentRound) return;

    document.getElementById('round-number').textContent = currentRound.roundNumber || 1;

    // Show mole count if enabled
    const showMoleCount = game.settings?.showMoleCount !== false && game.settings?.showSpyCount !== false; // Default to true, support legacy
    const moleCountElement = document.getElementById('mole-count-display');
    if (moleCountElement) {
        // Check if explicitly set to false
        if (game.settings?.showMoleCount === false || game.settings?.showSpyCount === false) {
            moleCountElement.style.display = 'none';
        } else if (showMoleCount) {
            const moleIds = Array.isArray(currentRound.moleIds) ? currentRound.moleIds : (Array.isArray(currentRound.spyIds) ? currentRound.spyIds : [currentRound.spyId || currentRound.moleId]);
            const moleCount = moleIds.filter(id => id).length;
            moleCountElement.textContent = `${moleCount} MOLE${moleCount > 1 ? 'S' : ''}`;
            moleCountElement.style.display = 'block';
        } else {
            moleCountElement.style.display = 'none';
        }
    }

    // Start/update timer with real-time updates
    if (currentRound.endTime) {
        startTimer(currentRound.endTime);
    } else {
        stopTimer();
    }

    // Find current player
    const currentPlayer = game.players.find(p => p.id === gameState.playerId);
    if (!currentPlayer) return;

    // Check if player is mole (support both single and multiple moles, and legacy spy references)
    const moleIds = Array.isArray(currentRound.moleIds) ? currentRound.moleIds : (Array.isArray(currentRound.spyIds) ? currentRound.spyIds : [currentRound.moleId || currentRound.spyId]);
    const isMole = moleIds.includes(gameState.playerId);
    
    // Show appropriate view
    const moleView = document.getElementById('mole-view');
    const locationView = document.getElementById('location-view');
    
    if (isMole) {
        moleView.style.display = 'block';
        locationView.style.display = 'none';
    } else {
        moleView.style.display = 'none';
        locationView.style.display = 'block';
        const locationName = typeof currentRound.location === 'string' ? currentRound.location : (currentRound.location?.name || currentRound.location);
        document.getElementById('location-name').textContent = locationName;
        
        // Display assigned role for non-mole players
        const playerRoles = currentRound.playerRoles || {};
        const playerRole = playerRoles[gameState.playerId];
        const roleDisplay = document.getElementById('player-role');
        const roleName = document.getElementById('role-name');
        
        if (playerRole && roleDisplay && roleName) {
            roleName.textContent = playerRole;
            roleDisplay.style.display = 'block';
        } else if (roleDisplay) {
            roleDisplay.style.display = 'none';
        }
    }

    // Update possible locations display (front and center during gameplay)
    updatePossibleLocations(game, currentRound);

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

function updatePossibleLocations(game, round) {
    const locationsDiv = document.getElementById('possible-locations');
    if (!locationsDiv) return;
    
    // Preserve scroll position
    const grid = locationsDiv.querySelector('.locations-grid');
    const scrollTop = grid ? grid.scrollTop : 0;
    
    // Get enabled packs from game settings
    const enabledPacks = game?.settings?.enabledPacks || ['pack1'];
    
    // Get all locations from enabled packs
    const allLocations = getAllEnabledLocations(enabledPacks);
    
    // Only update if content actually changed
    const currentLocationName = typeof round.location === 'string' ? round.location : round.location?.name;
    const moleIds = Array.isArray(round.moleIds) ? round.moleIds : (Array.isArray(round.spyIds) ? round.spyIds : [round.moleId || round.spyId]);
    const isMole = moleIds.includes(gameState.playerId);
    
    // Check if we need to update (only if grid doesn't exist or content changed)
    if (!grid) {
        locationsDiv.innerHTML = '<h3 class="locations-title">POSSIBLE LOCATIONS</h3>';
        locationsDiv.innerHTML += '<div class="locations-grid"></div>';
    }
    
    const newGrid = locationsDiv.querySelector('.locations-grid');
    
    // Only rebuild if grid is empty or structure changed
    if (!newGrid.children.length || newGrid.children.length !== allLocations.length) {
        newGrid.innerHTML = '';
        
        allLocations.forEach(location => {
            const locationName = typeof location === 'string' ? location : location.name;
            const locationCard = document.createElement('div');
            locationCard.className = 'location-card-small';
            
            // Highlight if it's the current location (for non-moles only)
            if (!isMole && locationName === currentLocationName) {
                locationCard.classList.add('current-location');
            }
            
            locationCard.textContent = locationName;
            newGrid.appendChild(locationCard);
        });
        
        // Restore scroll position
        if (scrollTop > 0) {
            newGrid.scrollTop = scrollTop;
        }
    } else {
        // Just update highlighting without rebuilding
        Array.from(newGrid.children).forEach((card, index) => {
            const locationName = typeof allLocations[index] === 'string' ? allLocations[index] : allLocations[index].name;
            if (!isMole && locationName === currentLocationName) {
                card.classList.add('current-location');
            } else {
                card.classList.remove('current-location');
            }
        });
        
        // Restore scroll position
        if (scrollTop > 0) {
            newGrid.scrollTop = scrollTop;
        }
    }
    
    // Show the locations display
    locationsDiv.style.display = 'block';
}

function updatePlayersStatus(players, round) {
    const playersStatus = document.getElementById('players-status');
    if (!playersStatus) return;
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
    const voteBtn = document.getElementById('vote-mole-action-btn');
    const guessBtn = document.getElementById('guess-location-btn');
    const votingArea = document.getElementById('voting-area');
    const voteBtnInArea = document.getElementById('vote-mole-btn');

    // Check if player is mole (support both single and multiple moles, and legacy spy references)
    const moleIds = Array.isArray(round.moleIds) ? round.moleIds : (Array.isArray(round.spyIds) ? round.spyIds : [round.moleId || round.spyId]);
    const isMole = moleIds.includes(gameState.playerId);
    const isMyTurn = round.currentTurn === gameState.playerId;
    const hasPendingQuestion = round.waitingForAnswer;

    // Handle "Your move" banner
    const firstTurnBanner = document.getElementById('first-turn-banner');
    
    // Check if banner should be shown
    const shouldShowBanner = round.currentTurn && 
                             !round.currentQuestion && 
                             isMyTurn && 
                             !hasPendingQuestion;
    
    // Create a unique key for this turn (playerId + round number + turn)
    const turnKey = `${gameState.playerId}-${round.currentTurn}-${round.roundNumber || 0}`;
    
    if (shouldShowBanner && firstTurnBanner) {
        // Only show banner if we haven't shown it for this specific turn yet
        if (gameState.bannerShownForTurn !== turnKey) {
            // Show the banner
                    firstTurnBanner.style.display = 'block';
                    firstTurnBanner.style.opacity = '1';
            firstTurnBanner.style.transition = '';
            firstTurnBanner.style.visibility = 'visible';
            
            // Mark that we've shown the banner for this turn
            gameState.bannerShownForTurn = turnKey;
            
            // Clear any existing timeout
            if (gameState.bannerFadeTimeout) {
                    clearTimeout(gameState.bannerFadeTimeout);
            }
            
            // Set new timeout to fade away after 15 seconds
                    gameState.bannerFadeTimeout = setTimeout(() => {
                if (firstTurnBanner) {
                        firstTurnBanner.style.transition = 'opacity 1s ease-out';
                        firstTurnBanner.style.opacity = '0';
                        setTimeout(() => {
                        if (firstTurnBanner) {
                            firstTurnBanner.style.display = 'none';
                            firstTurnBanner.style.opacity = '1';
                            firstTurnBanner.style.transition = '';
                        }
                        }, 1000);
                }
                    }, 15000);
                }
            } else {
        // Hide banner if it's not the player's turn or question has been asked
                if (firstTurnBanner) {
            if (gameState.bannerFadeTimeout) {
                clearTimeout(gameState.bannerFadeTimeout);
                gameState.bannerFadeTimeout = null;
                }
            // Reset the turn tracking when conditions change
            if (!shouldShowBanner) {
                gameState.bannerShownForTurn = null;
            }
            firstTurnBanner.style.display = 'none';
            firstTurnBanner.style.visibility = 'hidden';
            firstTurnBanner.style.opacity = '1';
            firstTurnBanner.style.transition = '';
        }
    }

    // All players (including moles) can vote at any time
    const canVote = true;
    voteBtn.style.display = canVote ? 'block' : 'none';

    // Mole can guess location at any time, but only if they haven't guessed yet
    const hasGuessed = (round.moleGuessedLocation || round.spyGuessedLocation) !== null && (round.moleGuessedLocation || round.spyGuessedLocation) !== undefined;
    const canGuess = isMole && !hasGuessed;
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
    // Get all mole IDs (support both single and multiple moles, and legacy spy references)
    const moleIds = Array.isArray(round.moleIds) ? round.moleIds : (Array.isArray(round.spyIds) ? round.spyIds : [round.moleId || round.spyId]);
    const nonMolePlayers = game.players.filter(p => !moleIds.includes(p.id));
    
    Object.values(round.votes).forEach(votedPlayerId => {
        voteCounts[votedPlayerId] = (voteCounts[votedPlayerId] || 0) + 1;
    });

    // Display vote counts
    let html = '';
    for (const [playerId, count] of Object.entries(voteCounts)) {
        const player = game.players.find(p => p.id === playerId);
        if (player) {
            const majorityThreshold = Math.ceil(nonMolePlayers.length / 2);
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

        window.closeModal('answer-modal');
        // State will update via polling
    } catch (error) {
        console.error('Error answering question:', error);
        showNotification('Failed to submit response. Please try again.', 'error');
    }
}

// Helper function to show modal - completely rewritten from scratch
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) {
        console.error(`Modal ${modalId} not found`);
        return;
    }
    
    // Reset any inline display style and add show class
    modal.style.display = '';
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    // Reset scroll position of modal content
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.scrollTop = 0;
    }
}

function showVoteModal() {
    const game = gameState.game;
    if (!game || !game.currentRound) {
        console.error('No game or currentRound');
        return;
    }
    
    const round = game.currentRound;

    const select = document.getElementById('voted-player');
    if (!select) {
        console.error('Voted player select element not found');
        return;
    }
    
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

    showModal('vote-modal');
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

        window.closeModal('vote-modal');
        
        if (data.majorityReached) {
            showNotification(data.wasCorrect ? 'Mole identified! Round ending...' : 'Incorrect vote. Mole wins!', data.wasCorrect ? 'success' : 'error');
        } else {
            showNotification('Vote recorded. Waiting for majority...', 'info');
        }
        
        // State will update via polling
    } catch (error) {
        console.error('Error voting for mole:', error);
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

let selectedLocationForGuess = null;

function showGuessLocationModal() {
    // Populate clickable grid with all available locations
    const grid = document.getElementById('location-select-grid');
    if (!grid) {
        console.error('Location select grid not found');
        return;
    }
    
    grid.innerHTML = '';
    selectedLocationForGuess = null;
    
    // Get enabled locations from game settings
    const game = gameState.game;
    const enabledPacks = game?.settings?.enabledPacks || ['pack1'];
    
    const allLocations = getAllEnabledLocations(enabledPacks);
    
    allLocations.forEach(location => {
        const locationName = typeof location === 'string' ? location : location.name;
        const item = document.createElement('div');
        item.className = 'location-select-item';
        item.textContent = locationName;
        item.dataset.location = locationName;
        
        item.addEventListener('click', () => {
            // Toggle selection
            if (selectedLocationForGuess === locationName) {
                // Deselect
                selectedLocationForGuess = null;
                item.classList.remove('selected');
            } else {
                // Deselect previous
                grid.querySelectorAll('.location-select-item').forEach(el => {
                    el.classList.remove('selected');
                });
                // Select this one
                selectedLocationForGuess = locationName;
                item.classList.add('selected');
            }
        });
        
        grid.appendChild(item);
    });

    showModal('guess-location-modal');
}

async function submitLocationGuess() {
    const guessedLocation = selectedLocationForGuess;

    if (!guessedLocation) {
        showNotification('Please select a location', 'error');
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

        window.closeModal('guess-location-modal');
        
        if (data.isCorrect) {
            showNotification('Location identified! Operation successful.', 'success');
        } else {
            showNotification('Incorrect location. The round has ended.', 'error');
        }
        
        // Poll immediately and aggressively for updated game state to see the result modal
        // This is CRITICAL for moles to see the result - poll very frequently
        pollGameState();
        setTimeout(() => pollGameState(), 200);
        setTimeout(() => pollGameState(), 400);
        setTimeout(() => pollGameState(), 600);
        setTimeout(() => pollGameState(), 800);
        setTimeout(() => pollGameState(), 1000);
        setTimeout(() => pollGameState(), 1500);
        setTimeout(() => pollGameState(), 2000);
        setTimeout(() => pollGameState(), 3000);
    } catch (error) {
        console.error('Error guessing location:', error);
        showNotification('Failed to submit guess. Please try again.', 'error');
    }
}

function showRoundResult(game) {
    // This function MUST show the modal for ALL players including moles
    // No conditions, no exceptions
    
    console.log('showRoundResult: Called with game:', game);
    
    const round = game.currentRound;
    if (!round) {
        console.error('showRoundResult: No current round');
        // Even if no round, try to show modal with generic message
    const modal = document.getElementById('game-result-modal');
        if (modal) {
            modal.classList.add('show');
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
        return;
    }

    let modal = document.getElementById('game-result-modal');
    if (!modal) {
        console.error('showRoundResult: Modal not found');
        return;
    }
    
    const title = document.getElementById('result-title');
    const content = document.getElementById('result-content');
    
    // Verify elements exist
    if (!title) {
        console.error('showRoundResult: Title element not found!');
    }
    if (!content) {
        console.error('showRoundResult: Content element not found!');
    }

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    // FORCE SHOW MODAL IMMEDIATELY - before any other logic
    modal.classList.add('show');
    modal.style.display = 'flex';
    
    // Check if player is mole (support both single and multiple moles, and legacy spy references)
    const moleIds = Array.isArray(round.moleIds) ? round.moleIds : (Array.isArray(round.spyIds) ? round.spyIds : [round.moleId || round.spyId]);
    const isMole = moleIds.includes(gameState.playerId);
    
    // Log for debugging
    console.log('showRoundResult: Showing modal for round end. isMole:', isMole, 'playerId:', gameState.playerId, 'round:', round);

    let resultText = '';
    const moleWon = round.moleWon || round.spyWon;

    const moleGuessedLocation = round.moleGuessedLocation || round.spyGuessedLocation;
    
    // Ensure we always have content - add default message if nothing matches
    let hasContent = false;
    
    if (moleGuessedLocation) {
        hasContent = true;
        // Mole guessed the location - check if correct
        const locationName = typeof round.location === 'string' ? round.location : (round.location?.name || 'Unknown');
        const guessedName = moleGuessedLocation.trim();
        // Only compare if we have a valid location name
        const isCorrect = locationName && locationName !== 'Unknown' && guessedName.toLowerCase() === locationName.toLowerCase();
        
        if (isCorrect) {
            title.textContent = 'OPERATION COMPROMISED';
            title.style.color = 'var(--color-danger)';
            if (isMole) {
                resultText = `
                    <p><strong>You successfully identified the location!</strong></p>
                    <p style="margin-top: 20px;"><strong>Location:</strong> ${escapeHtml(locationName)}</p>
                    <p><strong>Your guess:</strong> ${escapeHtml(guessedName)}</p>
                    <p style="margin-top: 15px; color: var(--color-danger);"><strong>Mole wins!</strong></p>
                `;
            } else {
                resultText = `
                    <p>The mole successfully identified the location.</p>
                    <p style="margin-top: 20px;"><strong>Location:</strong> ${escapeHtml(locationName)}</p>
                    <p><strong>Mole's guess:</strong> ${escapeHtml(guessedName)}</p>
                `;
            }
        } else {
            title.textContent = 'INCORRECT GUESS';
            title.style.color = 'var(--color-success)';
            if (isMole) {
                resultText = `
                    <p><strong>You incorrectly identified the location.</strong></p>
                    <p style="margin-top: 20px;"><strong>Actual Location:</strong> ${escapeHtml(locationName)}</p>
                    <p><strong>Your guess:</strong> ${escapeHtml(guessedName)}</p>
                    <p style="margin-top: 15px; color: var(--color-success);"><strong>Non-moles win!</strong></p>
                `;
            } else {
                resultText = `
                    <p>The mole incorrectly identified the location.</p>
                    <p style="margin-top: 20px;"><strong>Actual Location:</strong> ${escapeHtml(locationName)}</p>
                    <p><strong>Mole's guess:</strong> ${escapeHtml(guessedName)}</p>
                    <p style="margin-top: 15px; color: var(--color-success);"><strong>Non-moles win!</strong></p>
                `;
            }
        }
    } else if (round.accusation) {
        hasContent = true;
        const accusedPlayer = game.players.find(p => p.id === round.accusation.accusedId);
        const moleIds = Array.isArray(round.moleIds) ? round.moleIds : (Array.isArray(round.spyIds) ? round.spyIds : [round.moleId || round.spyId]);
        const wasCorrect = moleIds.includes(round.accusation.accusedId);

        if (round.accusation.type === 'vote') {
            // Voting result
            const wasCorrect = moleIds.includes(round.accusation.accusedId);
            
            if (wasCorrect) {
                title.textContent = 'MOLE IDENTIFIED';
                title.style.color = 'var(--color-success)';
                const moleNames = moleIds.map(id => game.players.find(p => p.id === id)?.name).filter(Boolean);
                const locationName = typeof round.location === 'string' ? round.location : round.location?.name;
                resultText = `
                    <p>Majority vote correctly identified the mole${moleIds.length > 1 ? 's' : ''}: <strong>${escapeHtml(moleNames.join(', '))}</strong></p>
                    <p style="margin-top: 20px;"><strong>Location:</strong> ${escapeHtml(locationName)}</p>
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
                const moleNames = moleIds.map(id => game.players.find(p => p.id === id)?.name).filter(Boolean);
                const locationName = typeof round.location === 'string' ? round.location : round.location?.name;
                resultText = `
                    <p>${escapeHtml(accusedPlayer.name)} was not the mole.</p>
                    <p>The mole${moleIds.length > 1 ? 's' : ''} <strong>${escapeHtml(moleNames.join(', '))}</strong> ${moleIds.length > 1 ? 'have' : 'has'} evaded detection.</p>
                    <p style="margin-top: 20px;"><strong>Location:</strong> ${escapeHtml(locationName)}</p>
                `;
            }
        } else {
            // Individual accusation
            const wasCorrect = moleIds.includes(round.accusation.accusedId);
            
            if (wasCorrect) {
                title.textContent = 'MOLE CAUGHT';
                title.style.color = 'var(--color-success)';
                const locationName = typeof round.location === 'string' ? round.location : round.location?.name;
                resultText = `
                    <p>The mole <strong>${escapeHtml(accusedPlayer.name)}</strong> was correctly identified.</p>
                    <p style="margin-top: 20px;"><strong>Location:</strong> ${escapeHtml(locationName)}</p>
                `;
            } else {
                title.textContent = 'INCORRECT ACCUSATION';
                title.style.color = 'var(--color-danger)';
                const moleNames = moleIds.map(id => game.players.find(p => p.id === id)?.name).filter(Boolean);
                const locationName = typeof round.location === 'string' ? round.location : round.location?.name;
                resultText = `
                    <p>${escapeHtml(accusedPlayer.name)} was not the mole.</p>
                    <p>The mole${moleIds.length > 1 ? 's' : ''} <strong>${escapeHtml(moleNames.join(', '))}</strong> ${moleIds.length > 1 ? 'win' : 'wins'}.</p>
                    <p style="margin-top: 20px;"><strong>Location:</strong> ${escapeHtml(locationName)}</p>
                `;
            }
        }
    } else if (round.moleWon || round.spyWon) {
        hasContent = true;
        title.textContent = 'TIME EXPIRED';
        title.style.color = 'var(--color-danger)';
        const locationName = typeof round.location === 'string' ? round.location : round.location?.name;
        if (isMole) {
            resultText = `
                <p><strong>You survived until time ran out!</strong></p>
                <p style="margin-top: 20px;"><strong>Location:</strong> ${escapeHtml(locationName)}</p>
                <p style="margin-top: 15px; color: var(--color-danger);"><strong>Mole wins!</strong></p>
            `;
        } else {
        resultText = `
            <p>The mole survived until time ran out.</p>
            <p style="margin-top: 20px;"><strong>Location:</strong> ${escapeHtml(locationName)}</p>
                <p style="margin-top: 15px; color: var(--color-danger);"><strong>Mole wins!</strong></p>
        `;
        }
    } else {
        hasContent = true;
        title.textContent = 'ROUND CONCLUDED';
        title.style.color = 'var(--color-primary)';
        const moleIds = Array.isArray(round.moleIds) ? round.moleIds : (Array.isArray(round.spyIds) ? round.spyIds : [round.moleId || round.spyId]);
        const locationName = typeof round.location === 'string' ? round.location : round.location?.name;
        resultText = `
            <p>The operation has concluded.</p>
            <p style="margin-top: 20px;"><strong>Location:</strong> ${escapeHtml(locationName || 'Unknown')}</p>
            <p><strong>Mole${moleIds.length > 1 ? 's' : ''}:</strong> ${escapeHtml(moleIds.map(id => game.players.find(p => p.id === id)?.name).filter(Boolean).join(', ') || 'Unknown')}</p>
        `;
    }
    
    // Fallback: If somehow no content was set, show a default message
    if (!hasContent || !resultText.trim()) {
        console.warn('showRoundResult: No content was set, using fallback message');
        title.textContent = 'ROUND ENDED';
        title.style.color = 'var(--color-primary)';
        const locationName = typeof round.location === 'string' ? round.location : round.location?.name;
        const moleIds = Array.isArray(round.moleIds) ? round.moleIds : (Array.isArray(round.spyIds) ? round.spyIds : [round.moleId || round.spyId]);
        if (isMole) {
            resultText = `
                <p><strong>The round has ended.</strong></p>
                <p style="margin-top: 20px;"><strong>Location:</strong> ${escapeHtml(locationName || 'Unknown')}</p>
                <p>You were the mole.</p>
            `;
        } else {
            resultText = `
                <p>The round has ended.</p>
                <p style="margin-top: 20px;"><strong>Location:</strong> ${escapeHtml(locationName || 'Unknown')}</p>
                <p><strong>Mole${moleIds.length > 1 ? 's' : ''}:</strong> ${escapeHtml(moleIds.map(id => game.players.find(p => p.id === id)?.name).filter(Boolean).join(', ') || 'Unknown')}</p>
            `;
        }
    }

    // Show next round button if host (regardless of whether they're mole or not), otherwise show waiting message
    // Check if player is host - host is the first player in the players array
    const isHost = game.players && game.players.length > 0 && game.players[0].id === gameState.playerId;
    if (isHost) {
        resultText += '<p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid var(--color-border); color: var(--color-text-muted); font-style: italic; font-size: 1.2rem;">As the host, you can start the next round or return to the briefing room.</p>';
    } else {
        resultText += '<p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid var(--color-border); color: var(--color-text-muted); font-style: italic; font-size: 1.2rem;">Waiting for host to start the next round...</p>';
    }

    // Set content - ensure it's always set with defensive checks
    if (!content) {
        console.error('showRoundResult: Content element is null! Cannot set content.');
    } else {
        // Set new content directly (don't clear first to avoid flicker)
        content.innerHTML = resultText;
        // Force visibility with !important-level styles
        content.style.display = 'block';
        content.style.visibility = 'visible';
        content.style.opacity = '1';
        content.style.height = 'auto';
        content.style.minHeight = '50px';
        // Remove any hiding styles
        content.style.maxHeight = 'none';
        // Ensure it's in the document flow
        content.removeAttribute('hidden');
        console.log('showRoundResult: Content set. resultText length:', resultText.length, 'isMole:', isMole);
        console.log('showRoundResult: Content element after setting:', content.innerHTML.substring(0, 200));
        console.log('showRoundResult: Content computed styles:', window.getComputedStyle(content).display, window.getComputedStyle(content).visibility);
    }
    
    // Set title - ensure it's visible
    if (title) {
        title.style.display = 'block';
        title.style.visibility = 'visible';
        title.style.opacity = '1';
        title.removeAttribute('hidden');
        console.log('showRoundResult: Title set to:', title.textContent);
        console.log('showRoundResult: Title computed styles:', window.getComputedStyle(title).display);
    }
    
    // Set up buttons - simplified approach using only inline onclick
    // The buttons in HTML already have onclick="handleNextRound()" and onclick="handleBackToLobby()"
    // Just need to set display visibility for host
    const nextRoundBtn = document.getElementById('next-round-btn');
    const backToLobbyBtn = document.getElementById('back-to-lobby-btn');
    
    console.log('🟢 showRoundResult: Setting up buttons. NextBtn:', !!nextRoundBtn, 'BackBtn:', !!backToLobbyBtn, 'isHost:', isHost);
    
    if (nextRoundBtn) {
        // Show "NEXT ROUND" button only for host
        if (isHost) {
            nextRoundBtn.style.display = 'block';
        } else {
            nextRoundBtn.style.display = 'none';
        }
        // Ensure button is clickable
        nextRoundBtn.style.pointerEvents = 'auto';
        nextRoundBtn.style.cursor = 'pointer';
        
        // Debug: Log button properties
        console.log('🟢 Next round button:', {
            display: nextRoundBtn.style.display,
            pointerEvents: window.getComputedStyle(nextRoundBtn).pointerEvents,
            onclick: nextRoundBtn.onclick,
            getAttribute: nextRoundBtn.getAttribute('onclick'),
            visibility: window.getComputedStyle(nextRoundBtn).visibility,
            zIndex: window.getComputedStyle(nextRoundBtn).zIndex
        });
        
        // Add test click handler for debugging
        nextRoundBtn.addEventListener('click', function(e) {
            console.log('🟢 CLICK EVENT DETECTED on next-round-btn!', e);
            console.log('🟢 Event phase:', e.eventPhase, 'Target:', e.target.id, 'CurrentTarget:', e.currentTarget.id);
        }, { capture: true });
    } else {
        console.error('🔴 showRoundResult: Next round button not found!');
    }
    
    if (backToLobbyBtn) {
        // Always show "RETURN TO BRIEFING" button
        backToLobbyBtn.style.display = 'block';
        // Ensure button is clickable
        backToLobbyBtn.style.pointerEvents = 'auto';
        backToLobbyBtn.style.cursor = 'pointer';
        
        // Debug: Log button properties
        console.log('🟢 Back to lobby button:', {
            display: backToLobbyBtn.style.display,
            pointerEvents: window.getComputedStyle(backToLobbyBtn).pointerEvents,
            onclick: backToLobbyBtn.onclick,
            getAttribute: backToLobbyBtn.getAttribute('onclick'),
            visibility: window.getComputedStyle(backToLobbyBtn).visibility,
            zIndex: window.getComputedStyle(backToLobbyBtn).zIndex
        });
        
        // Add test click handler for debugging
        backToLobbyBtn.addEventListener('click', function(e) {
            console.log('🟢 CLICK EVENT DETECTED on back-to-lobby-btn!', e);
            console.log('🟢 Event phase:', e.eventPhase, 'Target:', e.target.id, 'CurrentTarget:', e.currentTarget.id);
        }, { capture: true });
    } else {
        console.error('🔴 showRoundResult: Back to lobby button not found!');
    }
    
    // Test modal properties
    const modalForTest = document.getElementById('game-result-modal');
    const modalContent = modalForTest.querySelector('.modal-content');
    console.log('🟢 Modal properties:', {
        modal: {
            display: window.getComputedStyle(modalForTest).display,
            pointerEvents: window.getComputedStyle(modalForTest).pointerEvents,
            zIndex: window.getComputedStyle(modalForTest).zIndex
        },
        modalContent: {
            pointerEvents: window.getComputedStyle(modalContent).pointerEvents,
            zIndex: window.getComputedStyle(modalContent).zIndex
        }
    });
    
    // FORCE SHOW MODAL - Simple and clean
    // Re-get modal reference
    modal = document.getElementById('game-result-modal');
    if (!modal) {
        console.error('showRoundResult: Modal element not found after content update!');
        return;
    }
    
    // Force show using showModal helper
    showModal('game-result-modal');
    
    // Ensure pointer events work on all modal elements
    modal.style.pointerEvents = 'auto';
    if (content) content.style.pointerEvents = 'auto';
    const modalContentElement = modal.querySelector('.modal-content');
    if (modalContentElement) modalContentElement.style.pointerEvents = 'auto';
    
    console.log('showRoundResult: Modal shown. isMole:', isMole);
}

async function nextRound() {
    console.log('⭐ nextRound: Starting...');
    // Close the result modal
    window.closeModal('game-result-modal');
    stopTimer(); // Stop timer before starting new round
    
    try {
        console.log('⭐ nextRound: Calling startRound()...');
        await startRound();
        console.log('⭐ nextRound: startRound() completed successfully');
        // Poll immediately and more frequently to get updated state
        pollGameState();
        // Also poll after short delays to catch the state change
        setTimeout(() => pollGameState(), 500);
        setTimeout(() => pollGameState(), 1500);
        setTimeout(() => pollGameState(), 3000);
    } catch (error) {
        console.error('⭐ nextRound: ERROR:', error);
        showNotification('Failed to start next round. Please try again.', 'error');
        // Reopen modal if there was an error
        const game = gameState.game;
        if (game && game.status === 'roundEnd') {
            showRoundResult(game);
        }
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
    if (!questionPrompt) {
        console.error('Question prompt element not found');
        return;
    }
    
    questionPrompt.innerHTML = `
        <span style="color: var(--color-primary); font-weight: 500;">${escapeHtml(question.askerName)}</span> asks:<br>
        <span style="font-size: 1.2rem; margin-top: 10px; display: block;">"${escapeHtml(question.text)}"</span>
    `;
    
    const answerText = document.getElementById('answer-text');
    if (answerText) {
        answerText.value = '';
    }
    
    showModal('answer-modal');
}

// Update the updateUI function to check for pending actions
const originalUpdateUI = updateUI;
updateUI = function() {
    originalUpdateUI();
    checkForPendingActions(gameState.game);
};

// Auto-save settings (silent, no notification)
async function autoSaveSettings() {
    await saveGameSettingsSilent();
}

// Save settings silently (no notification)
async function saveGameSettingsSilent() {
    const moleCount = parseInt(document.getElementById('mole-count').value) || 1;
    const showMoleCount = document.getElementById('show-mole-count').value === 'true';
    // Parse timer minutes - ensure we get the actual value, not default to 8 if empty
    const timerMinutesInput = document.getElementById('timer-minutes').value;
    const timerMinutes = (timerMinutesInput && !isNaN(parseInt(timerMinutesInput))) 
        ? Math.max(1, Math.min(60, parseInt(timerMinutesInput))) 
        : 8;
    
    // Get enabled packs from checkboxes
    const enabledPacks = [];
    if (document.getElementById('pack1-checkbox').checked) enabledPacks.push('pack1');
    if (document.getElementById('pack2-checkbox').checked) enabledPacks.push('pack2');
    if (document.getElementById('countries-checkbox').checked) enabledPacks.push('countries');
    
    // Ensure at least one pack is selected
    if (enabledPacks.length === 0) {
        enabledPacks.push('pack1');
        document.getElementById('pack1-checkbox').checked = true;
    }
    
    if (!gameState.gameCode || !gameState.playerId) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/update-game-settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                gameCode: gameState.gameCode,
                playerId: gameState.playerId,
                settings: {
                    moleCount,
                    spyCount: moleCount, // Legacy support
                    showMoleCount,
                    showSpyCount: showMoleCount, // Legacy support
                    timerMinutes,
                    enabledPacks: enabledPacks
                }
            })
        });
        
        const data = await response.json();
        
        if (!data.error) {
            // Refresh game state silently
            pollGameState();
        }
    } catch (error) {
        console.error('Error saving settings:', error);
    }
}

// Game settings functions (with notification for manual save)
async function saveGameSettings() {
    await saveGameSettingsSilent();
    showNotification('Settings saved', 'success');
}

// Debounce function for input fields
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Theme toggle
function toggleTheme() {
    const html = document.documentElement;
    const isLight = html.classList.contains('light-mode');
    
    if (isLight) {
        html.classList.remove('light-mode');
        localStorage.setItem('theme', 'dark');
    } else {
        html.classList.add('light-mode');
        localStorage.setItem('theme', 'light');
    }
}



