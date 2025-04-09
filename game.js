import { config } from 'config';
import { generateLayer, processImageTransparency } from 'imageGenerator';
import { generateCollisionMap } from 'collision';
import { Player } from 'player';

// Game variables
let worldPos = 0;
let keys = {};
let currentChunk = 0;
let loadingNewChunk = false;

// Store generated chunks
const chunks = {
    background: {},
    midBackground: {},
    midground: {},
    foreground: {}
};

// Store collision data for chunks
const chunkCollisionData = {};

// DOM Elements
const gameContainer = document.getElementById('game-container');
const background = document.getElementById('background');
const midBackground = document.getElementById('mid-background');
const midground = document.getElementById('midground');
const foreground = document.getElementById('foreground');
const loading = document.getElementById('loading');
const loadingStatus = document.getElementById('loading-status');
const chunkInfo = document.getElementById('chunk-info');
const positionInfo = document.getElementById('position-info');

// Initialize player
const player = new Player();

// Create a chunk element and add it to the layer
function createChunkElement(layer, chunkIndex, imageUrl) {
    const chunkElement = document.createElement('div');
    chunkElement.className = 'chunk';
    chunkElement.id = `${layer}-chunk-${chunkIndex}`;
    chunkElement.style.backgroundImage = `url(${imageUrl})`;
    chunkElement.style.width = `${config.chunkWidth}px`;
    chunkElement.style.left = `${chunkIndex * config.chunkWidth}px`;
    chunkElement.style.zIndex = layer === 'background' ? 1 : 
                                 layer === 'mid-background' ? 2 : 
                                 layer === 'midground' ? 3 : 4;
    
    document.getElementById(layer === 'midBackground' ? 'mid-background' : layer).appendChild(chunkElement);
    return chunkElement;
}

// Generate or retrieve a chunk for a specific layer and index
async function getChunk(layer, chunkIndex) {
    const layerKey = layer === 'mid-background' ? 'midBackground' : layer;
    
    // Check if chunk already exists
    if (chunks[layerKey][chunkIndex]) {
        return chunks[layerKey][chunkIndex];
    }
    
    // Generate new chunk
    const imageUrl = await generateLayer(layerKey, chunkIndex);
    chunks[layerKey][chunkIndex] = imageUrl;
    
    // Generate collision data for midground
    if (layer === 'midground') {
        try {
            chunkCollisionData[chunkIndex] = await generateCollisionMap(imageUrl);
        } catch (error) {
            console.error("Error generating collision map:", error);
        }
    }
    
    return imageUrl;
}

// Load chunks around the current chunk
async function loadChunksAround(chunkIndex) {
    if (loadingNewChunk) return;
    loadingNewChunk = true;
    
    const chunksToLoad = [chunkIndex - 1, chunkIndex, chunkIndex + 1];
    const layerNames = ['background', 'mid-background', 'midground', 'foreground'];
    
    try {
        // Load each chunk for each layer
        for (const layer of layerNames) {
            for (const idx of chunksToLoad) {
                if (idx < 0) continue; // Don't load chunks before the start
                
                const existingChunk = document.getElementById(`${layer}-chunk-${idx}`);
                if (!existingChunk) {
                    const imageUrl = await getChunk(layer, idx);
                    createChunkElement(layer, idx, imageUrl);
                }
            }
        }
        
        // Clean up old chunks that are too far away
        for (const layer of layerNames) {
            const chunks = document.querySelectorAll(`#${layer} .chunk`);
            chunks.forEach(chunk => {
                const chunkId = parseInt(chunk.id.split('-').pop());
                if (chunkId < chunkIndex - 1 || chunkId > chunkIndex + 1) {
                    chunk.remove();
                }
            });
        }
    } catch (error) {
        console.error("Error loading chunks:", error);
    } finally {
        loadingNewChunk = false;
    }
}

// Initialize the first chunks
async function initializeGame() {
    try {
        loadingStatus.textContent = "GENERATING INITIAL WORLD...";
        await loadChunksAround(0);
        
        // Hide loading screen
        loading.style.display = 'none';
        
        // Start game loop
        gameLoop();
    } catch (error) {
        console.error("Error initializing game:", error);
        loadingStatus.textContent = "ERROR! PRESS F5 TO RETRY";
    }
}

// Handle keyboard input
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Game loop
function gameLoop() {
    // Update player position and get movement data
    const playerUpdate = player.update(keys, worldPos, currentChunk, chunkCollisionData[currentChunk]);
    
    // Update world position
    worldPos = playerUpdate.worldPos;
    
    // Calculate current chunk based on world position
    const newChunk = Math.floor(worldPos / config.chunkWidth);
    
    // Check if we need to load new chunks
    if (newChunk !== currentChunk) {
        currentChunk = newChunk;
        loadChunksAround(currentChunk);
    } else {
        // Check if we're approaching the edge of the current chunk
        const positionInChunk = worldPos % config.chunkWidth;
        const normalizedPosition = positionInChunk / config.chunkWidth;
        
        if (normalizedPosition > config.chunkLoadThreshold && playerUpdate.moveX < 0) {
            // Approaching right edge, load next chunk
            loadChunksAround(currentChunk + 1);
        } else if (normalizedPosition < (1 - config.chunkLoadThreshold) && playerUpdate.moveX > 0 && currentChunk > 0) {
            // Approaching left edge, load previous chunk
            loadChunksAround(currentChunk - 1);
        }
    }
    
    // Apply parallax effect to each layer
    const layers = ['background', 'mid-background', 'midground', 'foreground'];
    layers.forEach(layer => {
        const layerElement = document.getElementById(layer);
        const speed = config.layerSpeeds[layer === 'mid-background' ? 'midBackground' : layer];
        layerElement.style.transform = `translateX(${-worldPos * speed}px)`;
    });
    
    // Update debug info
    chunkInfo.textContent = currentChunk;
    positionInfo.textContent = Math.floor(worldPos);
    
    // Continue the loop
    requestAnimationFrame(gameLoop);
}

// Start the game
initializeGame();