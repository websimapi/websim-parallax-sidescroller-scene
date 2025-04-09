// Game variables
let posX = 0;
let playerSpeed = 5;
let keys = {};
let lastTimestamp = 0;

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

// DOM Elements
const background = document.getElementById('background-content');
const midBackground = document.getElementById('mid-background-content');
const midground = document.getElementById('midground-content');
const foreground = document.getElementById('foreground-content');
const player = document.getElementById('player');
const loading = document.getElementById('loading');
const loadingStatus = document.getElementById('loading-status');
const processCanvas = document.getElementById('processCanvas');
const ctx = processCanvas.getContext('2d');

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

// Function to prepare each layer with the correct repeating structure
function prepareLayer(layerElement, imageWidth, numberOfCopies = 5) {
    // Clear any existing content
    layerElement.innerHTML = '';
    
    // Create multiple copies of the background
    for (let i = 0; i < numberOfCopies; i++) {
        const copy = document.createElement('div');
        copy.className = 'layer-content-inner';
        copy.style.width = imageWidth + 'px';
        copy.style.left = (i * imageWidth) + 'px';
        layerElement.appendChild(copy);
    }
    
    // Set the total width to accommodate all copies
    layerElement.style.width = (imageWidth * numberOfCopies) + 'px';
    
    return imageWidth * numberOfCopies;
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
        
        // Apply background images to all layers
        background.style.backgroundImage = `url(${backgroundImg.url})`;
        midBackground.style.backgroundImage = `url(${midBackgroundImg.url})`;
        midground.style.backgroundImage = `url(${processedMidground})`;
        foreground.style.backgroundImage = `url(${processedForeground})`;
        
        // Use more copies to ensure the player never reaches the end
        const numberOfCopies = 5;
        
        // Set the width of each layer to be a multiple of the image width
        background.style.width = (layerWidths.background * numberOfCopies) + 'px';
        midBackground.style.width = (layerWidths.midBackground * numberOfCopies) + 'px';
        midground.style.width = (layerWidths.midground * numberOfCopies) + 'px';
        foreground.style.width = (layerWidths.foreground * numberOfCopies) + 'px';
        
        loading.style.display = 'none';
        
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

// Input handling
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Improved game loop with seamless scrolling
function gameLoop(timestamp) {
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
    
    // FIXED: Improved seamless scrolling with precision calculations
    
    // For each layer, calculate the exact position in pixels
    // Use negative posX for right movement, positive for left movement
    
    // Calculate positions for each layer based on parallax speeds
    const bgX = (posX * layerSpeeds.background) % layerWidths.background;
    const midBgX = (posX * layerSpeeds.midBackground) % layerWidths.midBackground;
    const midX = (posX * layerSpeeds.midground) % layerWidths.midground;
    const fgX = (posX * layerSpeeds.foreground) % layerWidths.foreground;
    
    // Ensure we get a smooth transition at the seams by using the decimal remainder
    // This fixes the "jumping" effect that can happen with integer positions
    
    background.style.transform = `translateX(${bgX}px)`;
    midBackground.style.transform = `translateX(${midBgX}px)`;
    midground.style.transform = `translateX(${midX}px)`;
    foreground.style.transform = `translateX(${fgX}px)`;
    
    // When a layer gets close to its edge, we need to reposition it to create
    // the illusion of infinite scrolling - this is handled by the modulo operation
    
    requestAnimationFrame(gameLoop);
}

// Initialize the game
generateLayers();