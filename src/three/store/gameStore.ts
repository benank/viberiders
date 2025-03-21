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
  crystalCount: number;
}

// Initial store values
const initialStore: GameStore = {
  gameState: 'idle',
  distance: 0,
  score: 0,
  highScore: 0,
  speed: 5,
  crystalCount: 0,
};

// Store atoms
export const gameStateAtom = atom<GameState>(initialStore.gameState);
export const distanceAtom = atom<number>(initialStore.distance);
export const scoreAtom = atom<number>(initialStore.score);
export const highScoreAtom = atom<number>(initialStore.highScore);
export const speedAtom = atom<number>(initialStore.speed);
export const crystalCountAtom = atom<number>(initialStore.crystalCount);

// Derived atom for calculating the final score
export const finalScoreAtom = atom<number>((get) => {
  const distance = get(distanceAtom);
  const score = get(scoreAtom);
  const crystals = get(crystalCountAtom);
  return Math.floor(distance) + score + (crystals * 50); // Each crystal is worth 50 points
});

// High score atom that persists the highest score
export const persistentHighScoreAtom = atom<number>(
  (get) => get(highScoreAtom)
);

// Manually update the high score with this function
export const updateHighScore = (newScore: number) => {
  const store = getDefaultStore();
  const currentHighScore = store.get(highScoreAtom);
  if (newScore > currentHighScore) {
    store.set(highScoreAtom, newScore);
    try {
      localStorage.setItem('vibeRidersHighScore', newScore.toString());
    } catch (e) {
      console.error('Failed to save high score to localStorage:', e);
    }
  }
};

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
    crystalCount: get(crystalCountAtom),
  })
);

// Function to update the game store
export const updateGameStore = (update: Partial<GameStore>) => {
  const store = getDefaultStore();
  if (update.gameState !== undefined) store.set(gameStateAtom, update.gameState);
  if (update.distance !== undefined) store.set(distanceAtom, update.distance);
  if (update.score !== undefined) store.set(scoreAtom, update.score);
  if (update.highScore !== undefined) store.set(highScoreAtom, update.highScore);
  if (update.speed !== undefined) store.set(speedAtom, update.speed);
  if (update.crystalCount !== undefined) store.set(crystalCountAtom, update.crystalCount);
};

// Reset game
export const resetGame = () => {
  // Store current score for high score comparison
  const store = getDefaultStore();
  const currentScore = store.get(finalScoreAtom);
  
  // Update high score if needed
  updateHighScore(currentScore);
  
  // Reset game state
  updateGameStore({
    gameState: 'idle',
    distance: 0,
    score: 0,
    speed: 5,
    crystalCount: 0,
  });
};

// Helper function to start a new game
export const startGame = () => {
  const store = getDefaultStore();
  store.set(gameStateAtom, 'playing');
  store.set(distanceAtom, 0);
  store.set(scoreAtom, 0);
  store.set(crystalCountAtom, 0);
};

// Helper function to handle game over
export const gameOver = () => {
  const store = getDefaultStore();
  const currentScore = store.get(finalScoreAtom);
  
  // Update high score if needed
  updateHighScore(currentScore);
  
  // Set game state to game over
  store.set(gameStateAtom, 'gameOver');
};

// Helper function to restart the game
export const restartGame = () => {
  // Reset game state
  updateGameStore({
    gameState: 'idle',
    distance: 0,
    score: 0,
    crystalCount: 0,
  });
}; 