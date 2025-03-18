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
      <div className="glowing-text">
        Vibe Riders
      </div>
    </div>
  )
}

export default App
