# Spyfall Game - Multiplayer Party Game

A fully functional multiplayer Spyfall game that works on Netlify. Players join games using a game code, and one player is secretly the spy who must figure out the location without revealing they don't know it.

## Features

- 🎮 Full multiplayer support
- 🕵️ One player is randomly selected as the spy
- 📍 28 different locations
- ⏱️ 8-minute rounds with timer
- 💬 Question and answer system
- 🎯 Accusation system
- 📱 Responsive design

## How to Play

1. **Create or Join a Game**: 
   - Create a new game or join with a game code
   - Enter your name

2. **Lobby**:
   - Wait for at least 3 players
   - Host can start the game when ready

3. **Gameplay**:
   - All players except the spy know the location
   - Players take turns asking questions to other players
   - The spy must figure out the location without revealing they don't know it
   - Other players must answer without revealing the location
   - At any time, a player can accuse someone of being the spy

4. **Round End**:
   - If the spy is correctly accused, the other players win
   - If the spy identifies the location or time runs out, the spy wins

## Deployment to Netlify

### Option 1: Deploy via Netlify Dashboard

1. Push this repository to GitHub/GitLab/Bitbucket
2. Go to [Netlify](https://www.netlify.com/)
3. Click "New site from Git"
4. Connect your repository
5. Build settings:
   - Build command: (leave empty or `echo "No build required"`)
   - Publish directory: `public`
6. Click "Deploy site"

### Option 2: Deploy via Netlify CLI

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Login to Netlify:
   ```bash
   netlify login
   ```

3. Deploy:
   ```bash
   netlify deploy --prod
   ```

### Option 3: Deploy via Git

1. Push to your Git repository
2. Connect to Netlify (it will auto-detect settings from `netlify.toml`)

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run Netlify Dev (for local testing with functions):
   ```bash
   npm run dev
   ```

3. Open your browser to the URL shown (usually `http://localhost:8888`)

## Project Structure

```
SPY/
├── public/
│   ├── index.html      # Main HTML file
│   ├── styles.css      # Styling
│   ├── game.js         # Frontend game logic
│   └── locations.js    # Game locations data
├── netlify/
│   └── functions/
│       ├── game-store.js        # Shared game state storage
│       ├── create-game.js       # Create new game
│       ├── join-game.js         # Join existing game
│       ├── game-state.js        # Get current game state
│       ├── start-round.js       # Start a new round
│       ├── ask-question.js      # Ask a question
│       ├── answer-question.js   # Answer a question
│       └── accuse-spy.js       # Accuse someone of being spy
├── netlify.toml         # Netlify configuration
├── package.json         # Node.js dependencies
└── README.md           # This file
```

## MongoDB Setup (Required for Multiplayer)

This game uses MongoDB to store game state so players can connect to each other across different server instances.

### Step 1: Create a MongoDB Atlas Account (Free)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for a free account
3. Create a new cluster (choose the FREE tier)
4. Wait for the cluster to be created (takes a few minutes)

### Step 2: Get Your Connection String

1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy the connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)
4. Replace `<password>` with your database password
5. Replace `<dbname>` with `spyfall` (or leave it to use default)

### Step 3: Set Environment Variable in Netlify

1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Add a new variable:
   - **Key**: `MONGODB_URI`
   - **Value**: Your MongoDB connection string (from Step 2)
4. Click **Save**

### Step 4: Redeploy

After setting the environment variable, trigger a new deployment:
- Go to **Deploys** tab
- Click **Trigger deploy** → **Clear cache and deploy site**

### Local Development with MongoDB

For local testing, create a `.env` file in the project root:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/spyfall
```

**Note**: Never commit your `.env` file to Git! It's already in `.gitignore`.

## Technical Notes

### Game State Storage

The game uses **MongoDB** for persistent storage, which allows:
- Multiple players to connect from different devices
- Game state to persist across server restarts
- Games to work across different Netlify Function instances

### Multiplayer Synchronization

The game uses polling (checking for updates every 2 seconds) to synchronize game state across players. This is simple and works well for turn-based games like Spyfall.

For real-time updates, you could integrate:
- **Firebase Realtime Database**
- **Supabase Realtime**
- **Pusher** or **Ably** for WebSocket-like functionality

### CORS

All Netlify Functions include CORS headers to allow cross-origin requests, making the game work from any domain.

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Requires JavaScript enabled

## License

MIT License - feel free to use and modify as needed.

## Contributing

Feel free to submit issues or pull requests if you'd like to improve the game!

