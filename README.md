<div align="center">

# ⚡ KINETIC FITNESS

### *A High-End, Mobile-First Fitness Platform with a Premium Dark Aesthetic*

[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-12.12-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Spotify API](https://img.shields.io/badge/Spotify_API-Enriched-1DB954?style=for-the-badge&logo=spotify&logoColor=black)](https://developer.spotify.com/)

---

</div>

## 📌 Overview

**KINETIC Fitness** is an ultra-modern, high-performance web application designed for athletes, gym-goers, and fitness enthusiasts. Built with **React 19**, **TypeScript**, and **Tailwind CSS v4**, KINETIC combines slick glassmorphic UI aesthetics, smooth micro-interactions, intelligent workout split builders, and integrated music streaming into one unified fitness workspace.

---

## ✨ Key Features

### 🏋️‍♂️ 1. Comprehensive Exercise Library
- **Filter & Search**: Instant real-time filtering by target muscle group (Chest, Back, Legs, Shoulders, Arms, Core) and equipment type.
- **Detailed Form Guides**: Step-by-step technique instructions, target muscle breakdown, and difficulty indicators.
- **Interactive Modals**: Visual cues and tips for optimal workout safety and performance.

### 📅 2. Dynamic Weekly Workout Planner
- **Custom Schedule Builder**: Assign workouts to specific days of the week.
- **Rest Day Toggle**: Easily configure rest & recovery days with visual indicator badges.
- **Persistence**: Automatically syncs workout schedules with local storage and Firebase Cloud Firestore.

### ⚡ 3. Intelligent Split Creator
- **Custom Volume Controls**: Dynamic set, rep, and target load calculation.
- **Split Archetypes**: Choose from Push-Pull-Legs (PPL), Upper/Lower, Bro Split, or custom tailored routines.
- **Rest Timers**: Built-in rest duration countdown timers between sets.

### 🎵 4. Integrated Workout Music Player
- **Spotify & iTunes API Sync**: Search tracks and play 30-second high-quality workout audio previews directly in the app.
- **Fallback Enrichment**: Intelligent dual-engine lookup ensures audio previews are always available even when primary API limits apply.
- **BPM & Energy Match**: Preset workout playlists optimized for cardio, heavy lifting, and focus sessions.

### 📊 5. Analytics & Profile Dashboard
- **Streak Tracker**: Monitor consecutive workout days and consistency streaks.
- **Calorie & Volume Metrics**: Real-time aggregated stats of total weight lifted and estimated energy burn.
- **Theme Personalization**: Instant theme switcher (Obsidian Dark, Cyber Neon, Slate Glass, High-Contrast Onyx).

---

## 🛠️ Architecture & Tech Stack

- **Frontend Core**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite 6](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/), Vanilla CSS glassmorphic design system
- **Icons & Animations**: [Lucide React](https://lucide.dev/), [Motion](https://motion.dev/)
- **Backend & Auth**: Express.js server, [Firebase Auth](https://firebase.google.com/docs/auth), Firestore DB
- **API Services**: Spotify Web API with automated iTunes Music fallback lookup engine

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm** or **bun** / **yarn**

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/nithincodesx/Kinetic.git
   cd Kinetic
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Add your Firebase and Spotify credentials:
   ```env
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

5. **Production Build**
   ```bash
   npm run build
   ```

---

## 📂 Project Structure

```
kinetic-fitness/
├── src/
│   ├── components/       # Layout, Navbar, ExerciseLibrary, WeeklyPlanner, SplitCreator, Profile, ThemeCard
│   ├── context/          # AuthContext, MusicContext
│   ├── data/             # exercises.ts database
│   ├── lib/              # firebase.ts initialization
│   ├── services/         # spotifyService.ts API integration
│   ├── App.tsx           # Main application routing and shell
│   ├── main.tsx          # React entry point
│   ├── types.ts          # TypeScript type definitions
│   └── index.css         # Glassmorphism design tokens & styles
├── server.ts             # Express proxy server for Spotify API & iTunes enrichment
├── vite.config.ts        # Vite configuration
└── package.json          # Project dependencies & scripts
```

---

## 👤 Author

Developed with ❤️ by **[Nithin](https://github.com/nithincodesx)**.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
