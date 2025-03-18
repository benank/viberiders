import { useEffect, useRef } from 'react'
import './App.css'
import { initCyberpunkGrid, cleanupCyberpunkGrid } from './three/init'

function App() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize the Three.js background once the component is mounted
    // We use a short timeout to ensure the DOM is fully rendered
    const timer = setTimeout(() => {
      if (containerRef.current?.id) {
        initCyberpunkGrid(containerRef.current.id);
      }
    }, 100);

    // Clean up Three.js resources when component unmounts
    return () => {
      clearTimeout(timer);
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
      <div 
        className="game-header"
        style={{
          position: 'relative',
          zIndex: 20,
          pointerEvents: 'none', // Allows clicks to pass through
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginTop: '2rem'
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

      {/* Game UI elements could be added here */}
      <div style={{ 
        position: 'fixed', 
        bottom: '2rem', 
        zIndex: 20,
        display: 'flex',
        justifyContent: 'center',
        width: '100%'
      }}>
        <button className="start-button" style={{
          background: 'rgba(0,0,0,0.5)',
          border: '2px solid #00ffff',
          color: '#00ffff',
          padding: '0.8rem 2rem',
          fontSize: '1.2rem',
          borderRadius: '4px',
          cursor: 'pointer',
          boxShadow: '0 0 15px rgba(0, 255, 255, 0.5)',
          transition: 'all 0.3s ease'
        }}>
          START GAME
        </button>
      </div>
    </div>
  )
}

export default App
