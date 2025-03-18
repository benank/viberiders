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
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '4rem',
        fontWeight: 'bold',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Three.js will be rendered as a canvas within this container with a lower z-index */}
      
      {/* Text overlay with higher z-index to ensure it's on top */}
      <div 
        className="glowing-text"
        style={{
          position: 'relative',
          zIndex: 20,
          pointerEvents: 'none' // Allows clicks to pass through
        }}
      >
        Vibe Riders
      </div>
    </div>
  )
}

export default App
