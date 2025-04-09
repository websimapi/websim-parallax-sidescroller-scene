import { generateScene } from 'sceneGenerator';
import { createAreaId, transitionToArea, applyLayerImages } from 'gameUtils';

// Game variables
let posX = 0;
let playerSpeed = 5;
let keys = {};
let lastTimestamp = 0;
let currentAreaSeed = null;
let currentAreaDirection = 'start';
let areaWidth = 2000; // Default width before actual images load
let isTransitioning = false;

// Layer speeds (different for parallax effect)
const layerSpeeds = {
    background: 0.1,
    midBackground: 0.3,
    midground: 0.7,
    foreground: 1.2
};

// Store layer image widths for repeating calculations
let layerWidths = {
    background: 0,
    midBackground: 0,
    midground: 0,
    foreground: 0
};

// Store generated areas for quick transitioning back
const generatedAreas = new Map();

// DOM Elements
const domElements = {
    background: document.getElementById('background-content'),
    midBackground: document.getElementById('mid-background-content'),
    midground: document.getElementById('midground-content'),
    foreground: document.getElementById('foreground-content'),
    player: document.getElementById('player'),
    loading: document.getElementById('loading'),
    loadingStatus: document.getElementById('loading-status'),
    areaTransition: document.getElementById('area-transition')
};

// Init game
initGame();

async function initGame() {
    // Set initial seed
    currentAreaSeed = Math.floor(Math.random() * 1000);
    
    // Event listeners
    window.addEventListener('keydown', (e) => {
        keys[e.key] = true;
    });
    
    window.addEventListener('keyup', (e) => {
        keys[e.key] = false;
    });
    
    try {
        await loadArea(currentAreaSeed, 'start');
        
        // Start game loop with timestamp
        requestAnimationFrame(timestamp => {
            lastTimestamp = timestamp;
            gameLoop(timestamp);
        });
    } catch (error) {
        console.error("Error initializing game:", error);
        domElements.loadingStatus.textContent = "ERROR! PRESS F5 TO RETRY";
    }
}

async function loadArea(seed, direction) {
    // Check if we already have this area generated
    const areaId = createAreaId(seed, direction);
    
    if (generatedAreas.has(areaId)) {
        // Use existing area
        const area = generatedAreas.get(areaId);
        layerWidths = applyLayerImages(area, domElements);
        areaWidth = layerWidths.midground * 1.5; // Use midground as the reference width
        domElements.loading.style.display = 'none';
        return;
    }
    
    // Generate new area
    domElements.loading.style.display = 'flex';
    
    try {
        // Determine seed modification based on direction
        let newSeed = seed;
        if (direction === 'right') {
            newSeed = seed + 1;
        } else if (direction === 'left') {
            newSeed = seed - 1;
        }
        
        // Generate the scene
        const scene = await generateScene(newSeed, domElements.loadingStatus);
        
        // Store generated area
        generatedAreas.set(areaId, scene);
        
        // Apply images
        layerWidths = applyLayerImages(scene, domElements);
        
        // Set area width based on midground (the main gameplay layer)
        areaWidth = layerWidths.midground * 1.5;
        
        // Update current area info
        currentAreaSeed = newSeed;
        currentAreaDirection = direction;
        
        domElements.loading.style.display = 'none';
    } catch (error) {
        console.error("Error loading area:", error);
        domElements.loadingStatus.textContent = "ERROR LOADING AREA! PRESS F5 TO RETRY";
    }
}

function gameLoop(timestamp) {
    // Calculate delta time for smooth movement
    const deltaTime = timestamp - lastTimestamp;
    lastTimestamp = timestamp;
    
    // Calculate speed adjusted for framerate
    const adjustedSpeed = playerSpeed * (deltaTime / 16.67); // 60fps base
    
    if (!isTransitioning) {
        if (keys['ArrowRight'] || keys['d'] || keys['D']) {
            posX -= adjustedSpeed;
            domElements.player.style.transform = 'scaleX(1)';
            
            // Check if we need to transition to next area
            if (posX < -areaWidth) {
                isTransitioning = true;
                transitionToArea(() => {
                    // Reset position to start of new area
                    posX = 0;
                    
                    // Load new area to the right
                    loadArea(currentAreaSeed, 'right')
                        .then(() => {
                            isTransitioning = false;
                        })
                        .catch(error => {
                            console.error("Error transitioning to right area:", error);
                            isTransitioning = false;
                        });
                });
            }
        }
        
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
            posX += adjustedSpeed;
            domElements.player.style.transform = 'scaleX(-1)';
            
            // Check if we need to transition to previous area
            if (posX > areaWidth) {
                isTransitioning = true;
                transitionToArea(() => {
                    // Reset position to end of new area
                    posX = 0;
                    
                    // Load new area to the left
                    loadArea(currentAreaSeed, 'left')
                        .then(() => {
                            isTransitioning = false;
                        })
                        .catch(error => {
                            console.error("Error transitioning to left area:", error);
                            isTransitioning = false;
                        });
                });
            }
        }
    }
    
    // Apply smooth scrolling with precise position calculations
    
    // Background layer (slowest)
    const bgOffset = (posX * layerSpeeds.background) % layerWidths.background;
    
    // Mid-background layer
    const midBgOffset = (posX * layerSpeeds.midBackground) % layerWidths.midBackground;
    
    // Midground layer
    const midOffset = (posX * layerSpeeds.midground) % layerWidths.midground;
    
    // Foreground layer (fastest)
    const fgOffset = (posX * layerSpeeds.foreground) % layerWidths.foreground;
    
    // Apply transforms using translateX for smooth GPU-accelerated scrolling
    domElements.background.style.transform = `translateX(${bgOffset}px)`;
    domElements.midBackground.style.transform = `translateX(${midBgOffset}px)`;
    domElements.midground.style.transform = `translateX(${midOffset}px)`;
    domElements.foreground.style.transform = `translateX(${fgOffset}px)`;
    
    requestAnimationFrame(gameLoop);
}