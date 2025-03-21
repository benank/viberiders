import { atom } from 'jotai';

// Game state
export type GameState = 'idle' | 'playing' | 'gameOver';

// Game store interface
export interface GameStore {
  gameState: GameState;
  distance: number;
  score: number;
  speed: number;
}

// Initial store values
const initialStore: GameStore = {
  gameState: 'idle',
  distance: 0,
  score: 0,
  speed: 5,
};

// Store atoms
export const gameStateAtom = atom<GameState>(initialStore.gameState);
export const distanceAtom = atom<number>(initialStore.distance);
export const scoreAtom = atom<number>(initialStore.score);
export const speedAtom = atom<number>(initialStore.speed);

// Combined atom for the whole game store
export const gameStoreAtom = atom<GameStore>(
  (get) => ({
    gameState: get(gameStateAtom),
    distance: get(distanceAtom),
    score: get(scoreAtom),
    speed: get(speedAtom),
  }),
  (_, set, update: Partial<GameStore>) => {
    if (update.gameState !== undefined) set(gameStateAtom, update.gameState);
    if (update.distance !== undefined) set(distanceAtom, update.distance);
    if (update.score !== undefined) set(scoreAtom, update.score);
    if (update.speed !== undefined) set(speedAtom, update.speed);
  }
);

// Reset game
export const resetGame = (set: (update: Partial<GameStore>) => void) => {
  set({
    gameState: 'idle',
    distance: 0,
    score: 0,
    speed: 5,
  });
}; 