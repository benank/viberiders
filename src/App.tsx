import { useEffect, useRef } from 'react'
import './App.css'
import { initCyberpunkGrid, cleanupCyberpunkGrid } from './three/init'
import { useAtom } from 'jotai'
import { gameStateAtom, distanceAtom, finalScoreAtom, highScoreAtom, restartGame, crystalCountAtom } from './three/store/gameStore'

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useAtom(gameStateAtom);
  const [distance] = useAtom(distanceAtom);
  const [finalScore] = useAtom(finalScoreAtom);
  const [highScore] = useAtom(highScoreAtom);
  const [crystalCount] = useAtom(crystalCountAtom);

  const handleStartGame = () => {
    setGameState('playing');
  };
  
  const handleRestartGame = () => {
    restartGame();
  };

  useEffect(() => {
    // Initialize the Three.js background once the component is mounted
    // We use a short timeout to ensure the DOM is fully rendered
    const timer = setTimeout(() => {
      if (containerRef.current?.id) {
        initCyberpunkGrid(containerRef.current.id);
      }
    }, 100);

    // Add zalgo glitch effect to document title
    const originalTitle = "VIBE RIDERS";
    let glitchInterval: number;
    
    // Function to generate Zalgo text
    const generateZalgoText = (text: string, intensity: number = 0.5): string => {
      // Split zalgo chars into categories for position control
      const zalgoUp = [
        '\u030d', '\u030e', '\u0304', '\u0305', '\u033f', '\u0311', '\u0306', '\u0310',
        '\u0352', '\u0357', '\u0351', '\u0307', '\u0308', '\u030a', '\u0342', '\u0343',
        '\u0344', '\u034a', '\u034b', '\u034c', '\u0303', '\u0302', '\u030c', '\u0350'
      ];
      const zalgoMid = [
        '\u0315', '\u031b', '\u0340', '\u0341', '\u0358', '\u0321', '\u0322', '\u0327',
        '\u0328', '\u0334', '\u0335', '\u0336', '\u034f', '\u035c', '\u035d', '\u035e',
        '\u035f', '\u0360', '\u0362', '\u0338', '\u0337', '\u0361'
      ];
      const zalgoDown = [
        '\u0316', '\u0317', '\u0318', '\u0319', '\u031c', '\u031d', '\u031e', '\u031f',
        '\u0320', '\u0324', '\u0325', '\u0326', '\u0329', '\u032a', '\u032b', '\u032c',
        '\u032d', '\u032e', '\u032f', '\u0330', '\u0331', '\u0332', '\u0333', '\u0339',
        '\u033a', '\u033b', '\u033c', '\u0345', '\u0347', '\u0348', '\u0349', '\u034d',
        '\u034e', '\u0353', '\u0354', '\u0355', '\u0356', '\u0359', '\u035a', '\u0323'
      ];
      
      // Helper to scramble text (reorder letters)
      const scrambleText = (str: string): string => {
        const arr = str.split('');
        // Fisher-Yates shuffle
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr.join('');
      };
      
      // Randomly choose a glitch mode based on intensity
      const glitchMode = Math.floor(Math.random() * 5);
      
      // Sometimes completely scramble the text order
      if (glitchMode === 0 && intensity > 0.7) {
        text = scrambleText(text);
      }
      
      // Sometimes reverse substrings
      if (glitchMode === 1 && intensity > 0.6) {
        const splitPoint = Math.floor(Math.random() * (text.length - 1)) + 1;
        const part1 = text.substring(0, splitPoint);
        const part2 = text.substring(splitPoint);
        
        if (Math.random() > 0.5) {
          text = part1.split('').reverse().join('') + part2;
        } else {
          text = part1 + part2.split('').reverse().join('');
        }
      }
      
      // Sometimes duplicate random characters
      if (glitchMode === 2 && intensity > 0.5) {
        let result = "";
        for (let i = 0; i < text.length; i++) {
          result += text[i];
          if (Math.random() > 0.7) {
            const repeats = Math.floor(Math.random() * 3) + 1;
            for (let j = 0; j < repeats; j++) {
              result += text[i];
            }
          }
        }
        text = result;
      }
      
      // Process each character
      let result = '';
      
      for (let i = 0; i < text.length; i++) {
        // Random chance to skip a character entirely
        if (Math.random() < 0.05 * intensity) {
          continue;
        }
        
        // Random chance to use a weird replacement character
        if (Math.random() < 0.08 * intensity) {
          const glitchChars = ['¥', '×', '÷', 'Ø', 'ß', '¶', '§', '†', '‡', '卄', '万', '尺', 'ᗪ', 'ጠ', 'ሠ', '░', '▓', '█'];
          result += glitchChars[Math.floor(Math.random() * glitchChars.length)];
          continue;
        }
        
        // Add zalgo characters above
        const upCount = Math.floor(Math.random() * 8 * intensity) + 1;
        for (let j = 0; j < upCount; j++) {
          const randomZalgo = zalgoUp[Math.floor(Math.random() * zalgoUp.length)];
          result += randomZalgo;
        }
        
        // Add the original character (sometimes case-flipped)
        const char = text[i];
        if (Math.random() < 0.15 * intensity && char.toLowerCase() !== char.toUpperCase()) {
          result += char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase();
        } else {
          result += char;
        }
        
        // Add zalgo characters in the middle
        const midCount = Math.floor(Math.random() * 3 * intensity);
        for (let j = 0; j < midCount; j++) {
          const randomZalgo = zalgoMid[Math.floor(Math.random() * zalgoMid.length)];
          result += randomZalgo;
        }
        
        // Add zalgo characters below
        const downCount = Math.floor(Math.random() * 8 * intensity) + 1;
        for (let j = 0; j < downCount; j++) {
          const randomZalgo = zalgoDown[Math.floor(Math.random() * zalgoDown.length)];
          result += randomZalgo;
        }
      }
      
      return result;
    };
    
    // Start the glitching effect
    const startGlitchEffect = () => {
      // Set initial title
      document.title = originalTitle;
      
      // Set up interval for glitching
      glitchInterval = window.setInterval(() => {
        // Randomly decide if we should glitch
        if (Math.random() > 0.1) { // 90% chance of glitching
          // Create glitched title with random intensity
          const intensity = Math.random() * 1.2 + 0.4; // Between 0.4 and 1.6 (increased)
          document.title = generateZalgoText(originalTitle, intensity);
          
          // Reset back to normal after a short time
          setTimeout(() => {
            // Small chance to keep the glitch for longer
            if (Math.random() < 0.1) {
              setTimeout(() => {
                document.title = originalTitle;
              }, 300 + Math.random() * 200);
            } else {
              document.title = originalTitle;
            }
          }, 100 + Math.random() * 2000); // Shorter duration for more frequent glitches
        }
      }, 100 + Math.random() * 3000);
    };
    
    startGlitchEffect();

    // Clean up Three.js resources when component unmounts
    return () => {
      clearTimeout(timer);
      clearInterval(glitchInterval);
      document.title = originalTitle;
      cleanupCyberpunkGrid();
    };
  }, []);

  return (
    <div 
      id="app-container"
      ref={containerRef}
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Three.js will be rendered as a canvas within this container with a lower z-index */}
      {/* Game title at the top */}
      {gameState === 'idle' && (
        <div 
          className="game-header"
          style={{
            position: 'relative',
            zIndex: 20,
            pointerEvents: 'none', // Allows clicks to pass through
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginTop: '2rem',
            width: '100%',
            textAlign: 'center'
          }}
        >
          <div className="glowing-text" style={{ fontSize: '4rem', fontWeight: 'bold' }}>
            Vibe Riders
          </div>
          <div className="subtitle-text" style={{ 
            fontSize: '1.5rem', 
            color: '#00ffff', 
            textShadow: '0 0 8px #00ffff',
            marginTop: '0.5rem',
            opacity: 0.8
          }}>
            HOVER INTO THE FUTURE
          </div>
        </div>
      )}

      {/* Distance counter - only shown during gameplay */}
      {gameState === 'playing' && (
        <div className="distance-counter" style={{
          position: 'fixed',
          top: '2rem',
          zIndex: 20,
          color: '#00ffff',
          textShadow: '0 0 8px #00ffff',
          fontSize: '2rem',
          fontWeight: 'bold',
          fontFamily: 'monospace',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          textAlign: 'center'
        }}>
          <div>{distance.toString().padStart(6, '0')} m</div>
          <div style={{ 
            color: '#00ffaa', 
            textShadow: '0 0 8px #00ffaa',
            fontSize: '1.5rem',
            marginTop: '0.5rem'
          }}>
            💎 {crystalCount}
          </div>
        </div>
      )}
      
      {/* Game Over Screen */}
      {gameState === 'gameOver' && (
        <div 
          className="game-over"
          style={{
            position: 'fixed',
            zIndex: 20,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(0, 0, 0, 0.7)',
            padding: '2rem',
            borderRadius: '10px',
            boxShadow: '0 0 20px #ff00ff',
            border: '1px solid #ff00ff'
          }}
        >
          <div className="glowing-text-pink" style={{ 
            fontSize: '3rem', 
            fontWeight: 'bold',
            color: '#ff00ff',
            textAlign: 'center',
            textShadow: '0 0 15px #ff00ff',
            marginBottom: '1rem'
          }}>
            GAME OVER
          </div>
          
          <div style={{ marginBottom: '0.5rem', color: '#00ffff', fontSize: '1.5rem', textAlign: 'center' }}>
            Distance: <span style={{ fontWeight: 'bold' }}>{distance.toString().padStart(6, '0')} m</span>
          </div>
          
          <div style={{ marginBottom: '0.5rem', color: '#00ffaa', fontSize: '1.5rem', textAlign: 'center' }}>
            Crystals: <span style={{ fontWeight: 'bold' }}>{crystalCount} 💎</span>
          </div>
          
          <div style={{ marginBottom: '1.5rem', color: '#00ffff', fontSize: '1.5rem', textAlign: 'center' }}>
            Final Score: <span style={{ fontWeight: 'bold' }}>{finalScore}</span>
          </div>
          
          <button 
            className="cyberpunk-button"
            onClick={handleRestartGame}
            style={{
              background: 'rgba(0, 255, 255, 0.2)',
              border: '2px solid #00ffff',
              color: '#00ffff',
              padding: '0.8rem 2rem',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              borderRadius: '5px',
              boxShadow: '0 0 10px #00ffff',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(0, 255, 255, 0.3)';
              e.currentTarget.style.boxShadow = '0 0 15px #00ffff';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(0, 255, 255, 0.2)';
              e.currentTarget.style.boxShadow = '0 0 10px #00ffff';
            }}
          >
            PLAY AGAIN
          </button>
        </div>
      )}

      {/* Start Game Button - shown only in idle state */}
      {gameState === 'idle' && (
        <div style={{ 
          position: 'fixed', 
          bottom: '2rem', 
          zIndex: 20,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <div style={{ 
            color: '#ff00ff', 
            textShadow: '0 0 5px #ff00ff',
            marginBottom: '1rem',
            fontSize: '1rem',
            textAlign: 'center'
          }}>
            Use ← → arrows or A/D keys to change lanes<br/>
            Or tap/click left/right side of the screen
          </div>
          
          <button 
            className="start-button"
            onClick={handleStartGame}
            style={{
              background: 'rgba(255, 0, 255, 0.2)',
              border: '2px solid #ff00ff',
              color: '#ff00ff',
              padding: '1rem 2.5rem',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              borderRadius: '5px',
              boxShadow: '0 0 10px #ff00ff',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255, 0, 255, 0.3)';
              e.currentTarget.style.boxShadow = '0 0 15px #ff00ff';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255, 0, 255, 0.2)';
              e.currentTarget.style.boxShadow = '0 0 10px #ff00ff';
            }}
          >
            START GAME
          </button>
          
          {highScore > 0 && (
            <div style={{ 
              color: '#ffff00', 
              textShadow: '0 0 5px #ffff00',
              marginTop: '1rem',
              fontSize: '1rem',
              textAlign: 'center'
            }}>
              High Score: {highScore}
            </div>
          )}
        </div>
      )}
      
    </div>
  )
}

export default App
