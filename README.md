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

## Database Setup (Required for Multiplayer)

This game uses Netlify DB (powered by Neon) to store game state so players can connect to each other across different server instances.

### Quick Setup (Recommended)

The easiest way to set up the database is using Netlify's built-in command:

```bash
npx netlify db init
```

That's it! This command will:
- Provision a Postgres database (powered by Neon)
- Automatically connect it to your Netlify site
- Set up the `NETLIFY_DATABASE_URL` environment variable
- Make your database ready to use

The database table will be created automatically on first use when you deploy!

### Alternative: Manual Setup

If you prefer to set up Neon manually:

1. Go to [Neon](https://neon.tech/) and create a free account
2. Create a new project
3. Get your connection string from the Neon dashboard
4. In Netlify, go to **Site settings** → **Environment variables**
5. Add:
   - **Key**: `NETLIFY_DATABASE_URL`
   - **Value**: Your Neon connection string
6. Save and redeploy your site

### Local Development

For local testing with `netlify dev`, the database connection is automatically available if you've run `npx netlify db init`. 

If you need to set it manually, create a `.env` file in the project root:

```
NETLIFY_DATABASE_URL=postgresql://user:password@host/database
```

**Note**: Never commit your `.env` file to Git! It's already in `.gitignore`.

## Technical Notes

### Game State Storage

The game uses **Neon** (serverless Postgres) for persistent storage, which allows:
- Multiple players to connect from different devices
- Game state to persist across server restarts
- Games to work across different Netlify Function instances
- Fast, serverless-friendly PostgreSQL database with generous free tier
- Automatic schema creation on first use

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

