# diff.gg

A League of Legends stats viewer. Look up summoner profiles, match history, ranked stats, leaderboards, and more.

Built with React + Vite on the frontend and Express on the backend, pulling data from the Riot Games API.

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- A Riot Games API key — get one free at [developer.riotgames.com](https://developer.riotgames.com)

> **Note:** Development API keys expire every 24 hours and need to be refreshed on the Riot developer portal.

> **Note:** Specifically for the examinators of this project, if you do not have a Riot Account, please refer to "credentials.txt" in the hand-in zip file for further instructions.


## Setup

**1. Install dependencies**

```bash
npm install
```

This installs everything — root, server, and client — in one step.

**2. Configure your API key**

```bash
cp server/.env.example server/.env
```

Then open `server/.env` and replace the placeholder with your actual key:

```
RIOT_API_KEY=RGAPI-your-key-here
```

**3. Start the dev server**

```bash
npm run dev
```

This starts both the Express backend (port 3000) and the Vite frontend (port 5173) concurrently. The browser will open automatically.

## Project Structure

```
├── client/   React + Vite frontend
└── server/   Express backend + Riot API integration
```

The client proxies all `/api` requests to the backend, so there's no CORS configuration needed during development.
