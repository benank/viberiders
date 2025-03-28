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

2. **Authentic Temple Run Style 3-Lane System**:
   - Simplified lane mechanics with three fixed positions (left, center, right)
   - Visual lane markers to indicate the three lanes
   - Left/Right arrow keys and A/D keys for switching lanes
   - Movement cooldown to prevent accidental rapid lane changes
   - Fixed lane-change logic to prevent lane-skipping issues
   - Smooth transitions between lanes with animation
   - Board tilts when turning for visual effect
   - Increased lane movement responsiveness

3. **Continuous Forward Movement**:
   - Faster base movement speed for more exciting gameplay
   - Hoverboard stays in a fixed position relative to the camera
   - The scene (grid, mountains) moves toward the player creating an illusion of forward movement
   - Speed gradually increases as the player advances
   - Parallax effect with different movement speeds for distant objects
   - Proper depth management to prevent scene elements from intersecting the player

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
   - Enhanced lighting and glow effects for better gameplay experience
   - Scene elements loop/reset when they move past certain thresholds
   - Smooth acceleration as the game progresses
   - Increased visual tilt feedback during lane changes
   - Longer lane markers for better visibility
   - Optimized scene reset mechanics

## Key Improvements

1. **Modular Structure**: Split monolithic `CyberpunkGrid` class into logical components
2. **Enhanced Grid**: 
   - Replaced transparent grid with an opaque floor
   - Added gradient coloring from cyan to dark blue/purple
   - Separated grid lines from the floor surface
   - Fixed perspective with proper orientation
   - Implemented continuous movement for Temple Run style mechanics
   - Expanded grid size for smoother infinite scrolling

3. **Mountains Optimization**:
   - Reduced mountain heights for better visual balance
   - Positioned mountains further back in the scene
   - Adjusted geometry and materials for better performance
   - Implemented proper fog integration
   - Added parallax scrolling effect
   - Fixed mountains positioning to prevent player intersection
   - Improved scaling for better scene composition

4. **Hoverboard Enhancements**:
   - Improved hover effect with consistent height
   - Added glow underneath for visual effect
   - Ensured correct positioning above the grid
   - Simplified controls to 3-lane system like Temple Run
   - Fixed lane movement logic to prevent position skipping bugs
   - Added cooldown between lane changes for more controlled movement
   - Increased movement speed and responsiveness
   - Enhanced visual feedback during lane changes
   - Implemented physics-based motion

5. **Lighting Improvements**:
   - Added spotlight to highlight the hoverboard
   - Enhanced ambient and directional lighting
   - Added ground glow for cyberpunk effect
   - Balanced light intensities for better visual appeal
   - Extended fog distance for more immersive visuals

6. **General Enhancements**:
   - Improved resource disposal for better memory management
   - Added documentation to all classes and methods
   - Standardized interfaces for objects (initialize, update, dispose)
   - Organized shaders for better reusability
   - Implemented game controls and state management
   - Added UI components for game interaction
   - Created virtual camera mechanics for infinite scrolling
   - Fixed movement bugs and improved responsiveness

## Recent Updates

### Cyberpunk Skybox with Mountain Silhouettes

1. **Enlarged Sun Background**:
   - Dramatically increased the size of the pink gradient sun to cover the entire background
   - Made the sun 4 times larger (200x100 units) to create a full skybox effect
   - Positioned the sun at the far back of the scene (z = -140)
   - Raised the sun higher in the background for better visibility
   - Created an encompassing gradient effect that fills the visual field
   - Enhanced the dramatic backdrop for the cyberpunk aesthetic

2. **Enhanced Mountain Silhouettes**:
   - Created prominent dark mountain silhouettes positioned in front of the pink sun
   - Increased mountain height and width for better visibility against the background
   - Used slightly brighter purple colors (0x330044, 0x220033) for improved contrast
   - Added five distinct mountain ranges with varied sizes for a more interesting horizon
   - Positioned silhouettes higher in the scene to ensure visibility at horizon line
   - Scaled silhouettes up by 1.5x vertically to enhance their presence
   - Added additional accent mountains in the foreground for depth

3. **Improved Scene Layering**:
   - Implemented proper visual scene layering from back to front:
     - Large pink sun as the furthest background element
     - Mountain silhouettes creating a horizon line
     - Grid system as the interactive foreground
   - Adjusted the render order to ensure correct element visibility
   - Optimized scene composition with natural visual hierarchy
   - Enhanced the overall cyberpunk aesthetic with dramatic backlighting effect
   - Extended fog distance to ensure all background elements remain visible
   - Fine-tuned z-positioning for perfect layering (sun at -140, mountains at -138)

### Visual Background Improvements

1. **Stationary Background Elements**:
   - Modified mountains to remain completely stationary in the far background
   - Positioned mountains much further back (z = -150) to create a permanent distant horizon
   - Made the sun (pink gradient light) completely stationary in the background
   - Positioned sun further back (z = -140) to serve as a fixed skybox element
   - Removed all parallax movement code for background elements
   - Improved sense of depth with fixed distant elements and moving foreground

2. **Enhanced Visual Composition**:
   - Better separation between moving elements (grid) and fixed background elements
   - More consistent visual experience with stationary horizon elements
   - Clearer spatial relationship between game elements
   - More focused gameplay with fewer distracting background movements

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

## Obstacle System and Game Mechanics

1. **Random Obstacles**:
   - Added cyberpunk-themed obstacles that appear randomly in the three lanes
   - Designed with glowing edges, holographic elements, and neon lighting
   - Created pooling system for efficient obstacle management
   - Implemented staggered spawn timing for better game flow
   - Applied subtle animations (rotation) to obstacles for visual appeal

2. **Collision Detection System**:
   - Implemented bounding box collision detection between hoverboard and obstacles
   - Added lane-aware obstacle positioning to match the 3-lane system
   - Optimized collision checks for better performance
   - Ensured accurate detection timing for responsive gameplay
   - Added proper obstacle cleanup when they pass the player

3. **Game Over Experience**:
   - Created stylish game over screen with cyberpunk aesthetics
   - Displays final distance and score (distance + points from avoided obstacles)
   - Shows high score that persists between sessions using localStorage
   - Added "Play Again" button with proper hover effects
   - Implemented clean game state transitions

4. **Scoring System**:
   - Added points for successfully avoiding obstacles (10 points each)
   - Combined distance and obstacle points for final score
   - Implemented high score tracking with persistent storage
   - Displays score prominently on game over screen
   - Shows high score on start screen when available

5. **Visual Enhancements**:
   - Added glowing effects to obstacles to match cyberpunk theme
   - Improved UI styling with consistent cyberpunk color scheme
   - Enhanced button hover effects for better feedback
   - Added game control instructions on start screen
   - Ensured consistent visual language across all UI elements

6. **Technical Improvements**:
   - Implemented object pooling for better performance
   - Added robust state management for game states
   - Improved collision detection accuracy
   - Ensured proper cleanup of game resources
   - Added responsive feedback on obstacle collisions

## Performance Optimizations and Obstacle Improvements

1. **Obstacle Visual Optimization**:
   - Redesigned obstacles as glowing cyberpunk walls for better visual clarity
   - Simplified geometry to improve performance and reduce lag when spawning
   - Removed expensive point lights in favor of emissive materials
   - Added grid-like patterns to walls for authentic cyberpunk aesthetic
   - Created thinner, wider obstacles that appear more like barriers/walls
   - Used MeshBasicMaterial instead of MeshStandardMaterial for better performance

2. **Spawning System Improvements**:
   - Enhanced obstacle spawning logic to ensure proper distribution across all three lanes
   - Implemented distance-based spawn timing adjustment for progressive difficulty
   - Increased initial spawn delay to give player time to prepare
   - Modified obstacle pool management for better memory usage
   - Ensured obstacles spawn far enough away to avoid pop-in visibility issues
   - Improved obstacle reuse system for better memory management
   - Added proper obstacle cleanup for better memory management

3. **Performance Enhancements**:
   - Optimized collision detection to only check nearby obstacles
   - Reduced number of simultaneously updated objects for better performance
   - Prioritized updating obstacles closer to the player
   - Removed unnecessary animations (rotation) from obstacles
   - Limited maximum number of visible obstacles to maintain frame rate
   - Implemented more efficient bounding box updates
   - Sorted obstacles by proximity for more efficient processing
   - Reduced complexity of obstacle geometry and materials

## Visual and Performance Refinements

1. **Z-Fighting and Flickering Resolution**:
   - Fixed flickering issues in obstacle walls by implementing proper z-spacing
   - Added renderOrder properties to control precise drawing sequence of overlapping elements
   - Configured proper depth buffer handling for transparent materials
   - Optimized material settings with correct transparency and depth parameters
   - Restructured wall elements to prevent visual artifacts in overlapping geometry
   - Improved z-index and layer separation between edge frames and grid lines

2. **Collision and Gameplay Adjustments**:
   - Enhanced lane selection algorithm to prevent obstacles from spawning too close to each other
   - Optimized obstacle bounding box updates to only occur when near the player
   - Adjusted obstacle spawning distance for better gradual appearance
   - Increased obstacle spawn spacing for better gameplay rhythm
   - Improved lane distribution logic to avoid repetitive patterns
   - Implemented smarter obstacle placement to ensure fair challenge across all lanes

## Crystal Collection System and Enhanced Scoring

1. **Collectible Crystals**:
   - Added glowing, diamond-shaped crystals that spawn randomly across the three lanes
   - Designed crystals with a distinct teal/cyan color scheme to differentiate from obstacles
   - Implemented smooth rotation animations to make crystals visually appealing
   - Created proper collision detection to collect crystals when the hoverboard touches them
   - Optimized crystal rendering with low-poly geometry and efficient materials
   - Incorporated small point lights to give crystals an inner glow effect

2. **Spawning Mechanics**:
   - Implemented balanced spawn timing separate from obstacles
   - Created intelligent lane distribution to avoid placing crystals in the same lane as obstacles
   - Designed progressive spawn rate that increases with game difficulty
   - Utilized object pooling for better performance when spawning crystals
   - Implemented proper cleanup for crystals that pass the player
   - Balanced spawn rates to ensure a fun but challenging collection experience

3. **UI and Scoring Integration**:
   - Added crystal counter to the gameplay UI with a distinct visual style
   - Implemented 💎 emoji and green color scheme for crystal-related UI elements
   - Updated the game over screen to show total crystals collected
   - Enhanced scoring system to factor in crystal collection (50 points per crystal)
   - Preserved crystal count in game state for accurate score calculation
   - Made crystal display visually cohesive with the existing cyberpunk aesthetic

4. **Technical Implementation**:
   - Created a dedicated Crystal class with proper composition and inheritance
   - Added crystal state management to the game store
   - Integrated crystals into the scene update lifecycle
   - Implemented optimized collision detection for crystals
   - Added proper memory management and disposal for crystal resources
   - Ensured crystals work correctly with the game state system

## Dynamic Speed and Progressive Difficulty

1. **Enhanced Speed Acceleration**:
   - Implemented more aggressive speed ramping to make the game progressively more challenging
   - Increased maximum speed cap from 18 to 30 units for an exhilarating endgame experience
   - Reduced acceleration factor from 300 to 200 for faster speed growth
   - Modified distance calculation to directly tie to speed for faster score accumulation
   - Created a speed feedback loop where faster speeds lead to higher distance traveled
   - Added dynamic difficulty scaling based on time spent playing

2. **Improved Speed Management**:
   - Implemented a centralized speed control system in the CyberpunkScene
   - Decoupled hoverboard acceleration from the HoverBoard class for better control
   - Added a setSpeed method to dynamically update hoverboard speed from the scene controller
   - Ensured consistent speed application across all moving elements (obstacles, crystals, grid)
   - Fine-tuned speed parameters for optimal gameplay progression
   - Balanced increasing difficulty with player reaction time

3. **Score and High Score System**:
   - Enhanced persistent high score storage using localStorage
   - Ensured proper high score updates at game over
   - Added crystal count to the high score calculation (50 points per crystal)
   - Fixed reset functionality to properly clear crystal count between games
   - Implemented proper state management for all game variables
   - Created a balanced scoring system that rewards both distance and collectibles

## Audio System and UI Refinements

1. **Immersive Audio Experience**:
   - Added dynamic background music system with custom soundtrack
   - Implemented looping music at reduced volume for perfect background ambiance
   - Created crystal collection sound effect for satisfying feedback
   - Added explosion sound effect for dramatic game over experience
   - Implemented proper audio management with play/pause based on game state
   - Added error handling for browsers with autoplay restrictions
   - Optimized audio performance and memory usage with proper cleanup

2. **Sound Design**:
   - Background music starts only when player clicks "Play Game" for better user experience
   - Crystal pickup sound provides instant positive feedback when collecting gems
   - Explosion sound creates dramatic impact when colliding with obstacles
   - Balanced volume levels across all audio elements (background: 0.25, crystal: 0.5, explosion: 0.6)
   - Added audio timers to allow for rapid successive sound triggering
   - Ensured clean audio during transitions between game states

3. **UI and Gameplay Refinements**:
   - Removed visible lane markers for cleaner aesthetic while maintaining 3-lane functionality
   - Reduced obstacle width by 20% for more forgiving gameplay
   - Improved object collision systems with more responsive feedback
   - Enhanced overall game feel with synchronized audio-visual feedback
   - Streamlined visual presentation with less UI clutter
   - Maintained consistent cyberpunk aesthetic across all elements

## Touch and Click Control System

1. **Mobile-Friendly Controls**:
   - Added touch and click input support for mobile devices and desktop
   - Implemented left/right screen regions for intuitive lane changes
   - Touching/clicking the left side of the screen moves the hoverboard left
   - Touching/clicking the right side of the screen moves the hoverboard right
   - Maintained consistent control responsiveness across all input methods

2. **Multi-Input Support**:
   - Seamless integration with existing keyboard controls
   - Players can freely switch between touch/click and keyboard input
   - Improved accessibility for mobile players
   - Updated game instructions to explain all control options
   - Maintained the same movement cooldown system for consistent gameplay feel

3. **Technical Implementation**:
   - Added event listeners for both mouse clicks and touch events
   - Implemented responsive screen region detection based on window width
   - Properly handled event propagation to prevent unwanted behavior
   - Added clean removal of event listeners during game cleanup
   - Ensured consistent gameplay experience across all platforms and input methods

## Gameplay and UI Refinements

1. **Enhanced Touch Controls**:
   - Added first-tap prevention system to ignore the initial tap when starting the game
   - Prevents accidental lane changes when tapping the "Start Game" button
   - Improved touch responsiveness for a more intuitive mobile experience
   - Created seamless transition between menu interaction and gameplay

2. **Visual Balancing and Difficulty Tuning**:
   - Reduced obstacle width by approximately 14% for better gameplay balance
   - Provides more forgiving hitboxes while maintaining challenge
   - Updated wall rendering to match narrower dimensions
   - Adjusted edge frames and grid lines to match new obstacle proportions

3. **Speed and Progression Improvements**:
   - Increased initial hoverboard speed from 12 to 16 for more exciting gameplay from the start
   - Provides a more immediate sense of speed when beginning a new game
   - Maintains the same progressive acceleration curve for long-term challenge
   - Better matches the difficulty progression to player skill development

4. **UI Enhancement**:
   - Center-aligned all text elements for improved visual consistency
   - Enhanced readability across all screen sizes and orientations
   - Applied consistent text styling throughout the game interface
   - Maintained cyberpunk aesthetic while improving information presentation
