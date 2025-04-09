// Game variables
let posX = 0;
let playerSpeed = 5;
let keys = {};
let lastTimestamp = 0;
let gameReady = false;

// Layer speeds (different for parallax effect)
const layerSpeeds = {
    background: 0.1,
    midBackground: 0.3,
    midground: 0.7,
    foreground: 1.2
};

// Store layer image widths for repeating calculations
const layerWidths = {
    background: 0,
    midBackground: 0,
    midground: 0,
    foreground: 0
};

// Store layer content elements
const layers = {
    background: null,
    midBackground: null,
    midground: null,
    foreground: null
};

// DOM Elements
let player;
let loading;
let loadingStatus;
let processCanvas;
let ctx;

// Initialize DOM references after page load
function initDomReferences() {
    layers.background = document.getElementById('background-content');
    layers.midBackground = document.getElementById('mid-background-content');
    layers.midground = document.getElementById('midground-content');
    layers.foreground = document.getElementById('foreground-content');
    player = document.getElementById('player');
    loading = document.getElementById('loading');
    loadingStatus = document.getElementById('loading-status');
    processCanvas = document.getElementById('processCanvas');
    ctx = processCanvas.getContext('2d');
}

// Function to create a delay
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to process image and make background transparent
async function processImageTransparency(imageUrl, bgColor = "#FFFFFF", tolerance = 60) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = function() {
            processCanvas.width = img.width;
            processCanvas.height = img.height;
            
            // Draw the image to canvas
            ctx.drawImage(img, 0, 0);
            
            // Get the image data
            const imageData = ctx.getImageData(0, 0, processCanvas.width, processCanvas.height);
            const data = imageData.data;
            
            // Parse background color
            const r1 = parseInt(bgColor.slice(1, 3), 16);
            const g1 = parseInt(bgColor.slice(3, 5), 16);
            const b1 = parseInt(bgColor.slice(5, 7), 16);
            
            // Replace the background color with transparency
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                
                // Calculate color distance using Euclidean distance
                const distance = Math.sqrt(
                    Math.pow(r - r1, 2) +
                    Math.pow(g - g1, 2) +
                    Math.pow(b - b1, 2)
                );
                
                // If the color is close to the background color, make it transparent
                if (distance < tolerance) {
                    data[i + 3] = 0; // Alpha channel
                }
            }
            
            // Put the modified image data back
            ctx.putImageData(imageData, 0, 0);
            
            // Convert canvas to data URL
            const dataUrl = processCanvas.toDataURL('image/png');
            resolve(dataUrl);
        };
        
        img.onerror = function() {
            reject(new Error('Failed to load image'));
        };
        
        img.src = imageUrl;
    });
}

// Function to get image dimensions
function getImageDimensions(imageUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = imageUrl;
    });
}

// Generate images for each layer
async function generateLayers() {
    try {
        let seed = Math.floor(Math.random() * 1000);
        
        loadingStatus.textContent = "GENERATING BACKGROUND LAYER...";
        const backgroundImg = await websim.imageGen({
            prompt: "8-bit pixel art retro game background with distant mountains and night sky with stars, low color palette (4-8 colors), perfectly tileable horizontally with matching left and right edges, seamless repeating pattern, NES or SNES style",
            aspect_ratio: "16:9",
            seed: seed
        });
        
        loadingStatus.textContent = "WAITING FOR NEXT GENERATION...";
        await sleep(3000);
        
        loadingStatus.textContent = "GENERATING MID-BACKGROUND LAYER...";
        const midBackgroundImg = await websim.imageGen({
            prompt: "8-bit pixel art retro game mid-background with silhouetted pine trees and rock formations, perfectly tileable horizontally with matching left and right edges, seamless repeating pattern, low color palette (4-8 colors), NES or SNES style",
            aspect_ratio: "16:9",
            seed: seed
        });
        
        loadingStatus.textContent = "WAITING FOR NEXT GENERATION...";
        await sleep(3000);
        
        loadingStatus.textContent = "GENERATING MIDGROUND LAYER...";
        const midgroundImg = await websim.imageGen({
            prompt: "8-bit pixel art retro game midground with platforms, grass and rocks in classic platformer style with some bright white (#FFFFFF) areas for transparency between platforms, perfectly tileable horizontally with matching left and right edges, seamless repeating pattern, clear pixel art style, Super Mario Bros or Mega Man inspired, low color palette (8-16 colors)",
            aspect_ratio: "16:9",
            seed: seed
        });
        
        loadingStatus.textContent = "WAITING FOR NEXT GENERATION...";
        await sleep(3000);
        
        loadingStatus.textContent = "GENERATING FOREGROUND LAYER...";
        const foregroundImg = await websim.imageGen({
            prompt: "8-bit pixel art retro game foreground with decorative vines and hanging elements on pure bright white background (#FFFFFF), only elements at top and sides with empty center area, perfectly tileable horizontally with matching left and right edges, seamless repeating pattern, low color palette (4-8 colors)",
            aspect_ratio: "16:9",
            seed: seed
        });
        
        loadingStatus.textContent = "PROCESSING TRANSPARENCY...";
        const processedForeground = await processImageTransparency(foregroundImg.url, "#FFFFFF", 100);
        const processedMidground = await processImageTransparency(midgroundImg.url, "#FFFFFF", 100);
        
        // Get and store image dimensions for repeating calculations
        const bgDimensions = await getImageDimensions(backgroundImg.url);
        const midBgDimensions = await getImageDimensions(midBackgroundImg.url);
        const midgroundDimensions = await getImageDimensions(processedMidground);
        const foregroundDimensions = await getImageDimensions(processedForeground);
        
        // Store image widths for repeating
        layerWidths.background = bgDimensions.width;
        layerWidths.midBackground = midBgDimensions.width;
        layerWidths.midground = midgroundDimensions.width;
        layerWidths.foreground = foregroundDimensions.width;
        
        setupLayers(backgroundImg.url, midBackgroundImg.url, processedMidground, processedForeground);
        
        loading.style.display = 'none';
        gameReady = true;
        
        // Start game loop with timestamp
        requestAnimationFrame(timestamp => {
            lastTimestamp = timestamp;
            gameLoop(timestamp);
        });
    } catch (error) {
        console.error("Error generating images:", error);
        loadingStatus.textContent = "ERROR! PRESS F5 TO RETRY";
    }
}

// Setup layer images and create multiple copies for seamless scrolling
function setupLayers(backgroundUrl, midBackgroundUrl, midgroundUrl, foregroundUrl) {
    // Set background images for each layer content
    layers.background.style.backgroundImage = `url(${backgroundUrl})`;
    layers.midBackground.style.backgroundImage = `url(${midBackgroundUrl})`;
    layers.midground.style.backgroundImage = `url(${midgroundUrl})`;
    layers.foreground.style.backgroundImage = `url(${foregroundUrl})`;
    
    // Calculate the number of copies needed (based on screen width)
    const screenWidth = window.innerWidth;
    const numberOfCopies = Math.max(5, Math.ceil((screenWidth * 3) / Math.min(
        layerWidths.background, 
        layerWidths.midBackground,
        layerWidths.midground,
        layerWidths.foreground
    )));
    
    // Create multiple copies of each layer for truly seamless scrolling
    layers.background.style.width = (layerWidths.background * numberOfCopies) + 'px';
    layers.midBackground.style.width = (layerWidths.midBackground * numberOfCopies) + 'px';
    layers.midground.style.width = (layerWidths.midground * numberOfCopies) + 'px';
    layers.foreground.style.width = (layerWidths.foreground * numberOfCopies) + 'px';
}

// Input handling
function setupInputHandlers() {
    window.addEventListener('keydown', (e) => {
        keys[e.key] = true;
    });
    
    window.addEventListener('keyup', (e) => {
        keys[e.key] = false;
    });
}

// Main game loop
function gameLoop(timestamp) {
    if (!gameReady) return;
    
    // Calculate delta time for smooth movement
    const deltaTime = timestamp - lastTimestamp;
    lastTimestamp = timestamp;
    
    // Calculate speed adjusted for framerate
    const adjustedSpeed = playerSpeed * (deltaTime / 16.67); // 60fps base
    
    if (keys['ArrowRight'] || keys['d'] || keys['D']) {
        posX -= adjustedSpeed;
        player.style.transform = 'scaleX(1)';
    }
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        posX += adjustedSpeed;
        player.style.transform = 'scaleX(-1)';
    }
    
    // Fixed smooth scrolling logic to prevent jumping at edges
    updateLayerPosition('background', layerSpeeds.background);
    updateLayerPosition('midBackground', layerSpeeds.midBackground);
    updateLayerPosition('midground', layerSpeeds.midground);
    updateLayerPosition('foreground', layerSpeeds.foreground);
    
    requestAnimationFrame(gameLoop);
}

// Improved layer position update function to prevent jumps
function updateLayerPosition(layerName, speed) {
    const layer = layers[layerName];
    const layerWidth = layerWidths[layerName];
    
    // Calculate raw offset based on position and speed
    const offset = (posX * speed) % layerWidth;
    
    // Apply transform using translateX for smooth scrolling
    // For negative offsets, we need to adjust to prevent jumps
    // by adding the layer width and then using modulo again
    const smoothOffset = offset < 0 ? layerWidth + offset : offset;
    
    // Apply the transform
    layer.style.transform = `translateX(${smoothOffset}px)`;
}

// Initialize the game
function init() {
    initDomReferences();
    setupInputHandlers();
    generateLayers();
}

// Start the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);