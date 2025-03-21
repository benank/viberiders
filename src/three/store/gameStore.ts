import { atom } from 'jotai';
import { getDefaultStore } from 'jotai';

// Game state
export type GameState = 'idle' | 'playing' | 'gameOver';

// Game store interface
export interface GameStore {
  gameState: GameState;
  distance: number;
  score: number;
  highScore: number;
  speed: number;
}

// Initial store values
const initialStore: GameStore = {
  gameState: 'idle',
  distance: 0,
  score: 0,
  highScore: 0,
  speed: 5,
};

// Store atoms
export const gameStateAtom = atom<GameState>(initialStore.gameState);
export const distanceAtom = atom<number>(initialStore.distance);
export const scoreAtom = atom<number>(initialStore.score);
export const highScoreAtom = atom<number>(initialStore.highScore);
export const speedAtom = atom<number>(initialStore.speed);

// Derived atom for calculating the final score
export const finalScoreAtom = atom<number>((get) => {
  const distance = get(distanceAtom);
  const score = get(scoreAtom);
  return Math.floor(distance) + score;
});

// High score atom that persists the highest score
export const persistentHighScoreAtom = atom<number>(
  (get) => get(highScoreAtom),
  (get, set, update: number) => {
    // Only update if the new score is higher
    const currentHighScore = get(highScoreAtom);
    if (update > currentHighScore) {
      set(highScoreAtom, update);
      // You could also persist to localStorage here if needed
      try {
        localStorage.setItem('vibeRidersHighScore', update.toString());
      } catch (e) {
        console.error('Failed to save high score to localStorage:', e);
      }
    }
  }
);

// Load high score from localStorage on initialization
try {
  const savedHighScore = localStorage.getItem('vibeRidersHighScore');
  if (savedHighScore) {
    const score = parseInt(savedHighScore, 10);
    if (!isNaN(score)) {
      initialStore.highScore = score;
    }
  }
} catch (e) {
  console.error('Failed to load high score from localStorage:', e);
}

// Combined atom for the whole game store
export const gameStoreAtom = atom<GameStore>(
  (get) => ({
    gameState: get(gameStateAtom),
    distance: get(distanceAtom),
    score: get(scoreAtom),
    highScore: get(highScoreAtom),
    speed: get(speedAtom),
  }),
  (_, set, update: Partial<GameStore>) => {
    if (update.gameState !== undefined) set(gameStateAtom, update.gameState);
    if (update.distance !== undefined) set(distanceAtom, update.distance);
    if (update.score !== undefined) set(scoreAtom, update.score);
    if (update.highScore !== undefined) set(highScoreAtom, update.highScore);
    if (update.speed !== undefined) set(speedAtom, update.speed);
  }
);

// Reset game
export const resetGame = (set: (update: Partial<GameStore>) => void) => {
  // Store current score for high score comparison
  const store = getDefaultStore();
  const currentScore = store.get(finalScoreAtom);
  
  // Update high score if needed
  store.set(persistentHighScoreAtom, currentScore);
  
  // Reset game state
  set({
    gameState: 'idle',
    distance: 0,
    score: 0,
    speed: 5,
  });
};

// Helper function to start a new game
export const startGame = () => {
  const store = getDefaultStore();
  store.set(gameStateAtom, 'playing');
  store.set(distanceAtom, 0);
  store.set(scoreAtom, 0);
};

// Helper function to handle game over
export const gameOver = () => {
  const store = getDefaultStore();
  const currentScore = store.get(finalScoreAtom);
  
  // Update high score if needed
  store.set(persistentHighScoreAtom, currentScore);
  
  // Set game state to game over
  store.set(gameStateAtom, 'gameOver');
};

// Helper function to restart the game
export const restartGame = () => {
  const store = getDefaultStore();
  
  // Reset game state
  store.set(gameStateAtom, 'idle');
  store.set(distanceAtom, 0);
  store.set(scoreAtom, 0);
}; 