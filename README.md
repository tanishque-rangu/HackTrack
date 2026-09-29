# HackTrack

A highly stylized, Dragon Ball Z-inspired command center for tracking team hackathons.

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment & Supabase Setup**
   * The app defaults to using `localStorage` for offline use if no database is provided.
   * To enable real-time multiplayer tracking, create a new project at [Supabase](https://supabase.com).
   * Go to the SQL Editor and run the migration script located at `supabase/migrations/001_initial_schema.sql`.
   * Create a `.env` (or `.env.local`) file based on `.env.example` and fill in your Supabase project URL and anon key (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`).

3. **Start Development Server**
   ```bash
   npm run dev
   ```

## Features

- **The 7 Dragon Balls Tracker:** Visually track the 7 stages of any hackathon (Discover, Register, Team, Idea, Build, Submit, Finale).
- **Global Command Center:** See aggregate progress and overall team Power Level.
- **War Room Modal:** Track registrations, combat units, and team comms in one place.
- **Supabase Real-time Sync:** Team state updates instantly across clients.
