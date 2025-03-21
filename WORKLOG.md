# ThreeJS Code Reorganization and Enhancement

## Overview

The codebase has been reorganized from a monolithic structure into a modular, component-based architecture. This organization improves code maintainability, reusability, and makes it easier to add new features in the future.

## Architectural Structure

The new architecture follows a clear separation of concerns:

- **Core**: Base classes and managers for the overall application structure
- **Scenes**: Scene implementations that compose different objects
- **Objects**: Individual 3D objects that make up the scenes
- **Shaders**: Shader implementations for custom visual effects
- **Utils**: Utility classes for common functionality
- **Store**: State management for game data and UI

## File Structure and Descriptions

### Core

- **`src/three/core/SceneManager.ts`** - Main controller that manages the ThreeJS renderer, scenes, and animation loop. Entry point for the ThreeJS application.
- **`src/three/core/Scene.ts`** - Abstract base class that all scenes inherit from, providing common scene functionality.

### Scenes

- **`src/three/scenes/CyberpunkScene.ts`** - Cyberpunk-themed scene that composes grid, mountains, sun, and hoverboard objects with appropriate lighting. Now includes game controls and mechanics.

### Objects

- **`src/three/objects/Grid.ts`** - Represents the floor grid with an opaque gradient surface and grid lines overlay. Creates a visually appealing cyberpunk ground.
- **`src/three/objects/Mountains.ts`** - Procedurally generated distant mountains using Perlin noise for a dynamic landscape effect.
- **`src/three/objects/Sun.ts`** - Synthwave sun with gradient shader for vibrant background effects.
- **`src/three/objects/HoverBoard.ts`** - Hovering board with glowing effects that floats above the grid. Features shader-based holographic materials. Now includes a 3-lane movement system and game mechanics.

### Shaders

- **`src/three/shaders/SunShader.ts`** - Shader implementation for the synthwave sun with gradient and glow effects.
- **`src/three/shaders/HoverboardShader.ts`** - Shader for the hoverboard with fresnel effects, grid patterns, and color transitions.

### Utils

- **`src/three/utils/PerlinNoise.ts`** - Perlin noise implementation for procedural terrain generation.
- **`src/three/utils/RoundedBoxGeometry.ts`** - Utility class for creating boxes with rounded corners, used for the hoverboard.

### Store

- **`src/three/store/gameStore.ts`** - Jotai-based state management for game state, distance tracking, and score.

### Entry Point

- **`src/three/init.ts`** - Initialization module that exposes functions to start and clean up the ThreeJS application.

## Game Controls & Mechanics

The application now includes gameplay functionality with the following features:

1. **Start Game Button**:
   - Added a clickable "START GAME" button
   - When clicked, the game UI transitions to gameplay mode
   - Hides title and start button, showing only the distance counter

2. **Temple Run Style 3-Lane System**:
   - Simplified lane mechanics with three fixed positions (left, center, right)
   - Visual lane markers to indicate the three lanes
   - Left/Right arrow keys and A/D keys for switching lanes
   - Smooth transitions between lanes with animation
   - Board tilts when turning for visual effect

3. **Continuous Forward Movement**:
   - Hoverboard stays in a fixed position relative to the camera
   - The scene (grid, mountains) moves toward the player creating an illusion of forward movement
   - Speed gradually increases as the player advances
   - Parallax effect with different movement speeds for distant objects

4. **Distance Counter**:
   - Real-time distance meter shown during gameplay
   - Distance increases automatically as the game progresses
   - Displayed with leading zeros for visual appeal (e.g., 000123 m)

5. **Game State Management**:
   - Implemented with Jotai for clean state management
   - Tracks game state (idle/playing/gameOver)
   - Manages distance and score
   - Enables future expansion for more game elements

6. **Visual Feedback**:
   - Lighting and glow effects enhance the gameplay experience
   - Scene elements loop/reset when they move past certain thresholds
   - Smooth acceleration as the game progresses

## Key Improvements

1. **Modular Structure**: Split monolithic `CyberpunkGrid` class into logical components
2. **Enhanced Grid**: 
   - Replaced transparent grid with an opaque floor
   - Added gradient coloring from cyan to dark blue/purple
   - Separated grid lines from the floor surface
   - Fixed perspective with proper orientation
   - Implemented continuous movement for Temple Run style mechanics

3. **Mountains Optimization**:
   - Reduced mountain heights for better visual balance
   - Positioned mountains further back in the scene
   - Adjusted geometry and materials for better performance
   - Implemented proper fog integration
   - Added parallax scrolling effect

4. **Hoverboard Enhancements**:
   - Improved hover effect with consistent height
   - Added glow underneath for visual effect
   - Ensured correct positioning above the grid
   - Simplified controls to 3-lane system like Temple Run
   - Added visual feedback during lane changes
   - Implemented physics-based motion

5. **Lighting Improvements**:
   - Added spotlight to highlight the hoverboard
   - Enhanced ambient and directional lighting
   - Added ground glow for cyberpunk effect
   - Balanced light intensities for better visual appeal

6. **General Enhancements**:
   - Improved resource disposal for better memory management
   - Added documentation to all classes and methods
   - Standardized interfaces for objects (initialize, update, dispose)
   - Organized shaders for better reusability
   - Implemented game controls and state management
   - Added UI components for game interaction
   - Created virtual camera mechanics for infinite scrolling

## Future Development

The modular architecture makes it easier to:

1. Add new scene objects (obstacles, collectibles)
2. Implement advanced game mechanics
3. Create additional scene types
4. Enhance visual effects
5. Optimize performance for different devices
6. Add scoring and game progression systems
7. Implement difficulty levels and challenges
8. Add power-ups and special abilities
9. Create multiplayer capabilities

Each component can be developed, tested, and optimized independently, making future enhancements simpler and more maintainable.
