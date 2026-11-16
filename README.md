# SpySketch

SpySketch is a real-time multiplayer drawing and deduction game. Players join a private room, one player secretly becomes the spy sketcher, and everyone draws on the same canvas. The group then votes to catch the player who never saw the secret word.

## Features

- Create and join private rooms with short room codes
- Copy invite links for friends
- Live lobby with connected players
- Host-only room settings
- Word categories and round timers
- Shared drawing canvas
- Secret spy sketcher role
- Voting with locked one-time votes
- Shows who has voted without revealing votes
- Result reveal and scoring
- Direct Play Again flow
- 500 Mixed drawing prompts
- Health check route for deployment

## Tech Stack

- HTML
- CSS
- JavaScript
- Node.js
- Built-in Node HTTP server
- Server-Sent Events for real-time updates
- Canvas API for drawing
- In-memory game state

## Screenshots

Add screenshots here after deployment:

- Home/lobby screen
- Drawing round
- Voting or result screen

## Run Locally

```cmd
npm start
```

Then open:

```text
http://localhost:3000
```

To test multiplayer locally, open the site in three browser tabs. Create a room in one tab, copy the invite link or room code, and join from the other tabs.

## Health Check

```text
http://localhost:3000/health
```

Expected response:

```json
{
  "status": "ok",
  "app": "SpySketch",
  "uptime": 10
}
```

## Deployment Notes

This app can deploy as one Node.js service because the backend also serves the frontend files.

Recommended platforms:

- Render
- Railway
- Fly.io

Use this start command:

```cmd
npm start
```

The server already uses `process.env.PORT`, so deployment platforms can assign the port automatically.

## Future Improvements

- MongoDB for match history and leaderboards
- User accounts
- Public rooms
- More drawing tools
- Sound effects
- Mobile drawing refinements
- Anti-cheat and room moderation
