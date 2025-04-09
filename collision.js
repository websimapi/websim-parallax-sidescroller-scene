import { config } from 'config';

// Generate collision map from midground image
export async function generateCollisionMap(imageUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = function() {
            const collisionCanvas = document.getElementById('collisionCanvas');
            const ctx = collisionCanvas.getContext('2d');
            
            // Set canvas dimensions
            collisionCanvas.width = img.width;
            collisionCanvas.height = img.height;
            
            // Draw the image to canvas
            ctx.drawImage(img, 0, 0);
            
            // Get the image data
            const imageData = ctx.getImageData(0, 0, collisionCanvas.width, collisionCanvas.height);
            const data = imageData.data;
            
            // Create collision map (simplified for performance)
            // 1 = solid, 0 = air
            const mapWidth = Math.ceil(collisionCanvas.width / config.collisionPrecision);
            const mapHeight = Math.ceil(collisionCanvas.height / config.collisionPrecision);
            const collisionMap = new Array(mapHeight).fill().map(() => new Array(mapWidth).fill(0));
            
            // Parse platform color
            const platformR = parseInt(config.platformColor.slice(1, 3), 16);
            const platformG = parseInt(config.platformColor.slice(3, 5), 16);
            const platformB = parseInt(config.platformColor.slice(5, 7), 16);
            
            // Check each pixel block for platform color or high opacity
            for (let y = 0; y < mapHeight; y++) {
                for (let x = 0; x < mapWidth; x++) {
                    // Sample the center of each block
                    const pixelX = Math.min(x * config.collisionPrecision + Math.floor(config.collisionPrecision / 2), collisionCanvas.width - 1);
                    const pixelY = Math.min(y * config.collisionPrecision + Math.floor(config.collisionPrecision / 2), collisionCanvas.height - 1);
                    
                    const i = (pixelY * collisionCanvas.width + pixelX) * 4;
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    const a = data[i + 3];
                    
                    // Check if the pixel is a platform
                    // Either: Close to platform color OR highly opaque and in the bottom two-thirds of the image
                    const isPlatformColor = Math.sqrt(
                        Math.pow(r - platformR, 2) +
                        Math.pow(g - platformG, 2) +
                        Math.pow(b - platformB, 2)
                    ) < config.platformThreshold;
                    
                    const isHighOpacity = a > 200 && pixelY > collisionCanvas.height / 3;
                    
                    if (isPlatformColor || isHighOpacity) {
                        collisionMap[y][x] = 1;
                        
                        // Visualize collision map (for debug)
                        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
                        ctx.fillRect(x * config.collisionPrecision, y * config.collisionPrecision, 
                                    config.collisionPrecision, config.collisionPrecision);
                    }
                }
            }
            
            // Return collision data
            resolve({
                map: collisionMap,
                width: mapWidth,
                height: mapHeight,
                precision: config.collisionPrecision,
                imageWidth: collisionCanvas.width,
                imageHeight: collisionCanvas.height,
                debug: collisionCanvas.toDataURL()  // For debug visualization
            });
        };
        
        img.onerror = function() {
            reject(new Error('Failed to load image for collision map'));
        };
        
        img.src = imageUrl;
    });
}

// Check if a point collides with the collision map
export function checkCollision(x, y, chunkOffset, collisionData) {
    if (!collisionData || !collisionData.map) return false;
    
    // Convert world coordinates to collision map coordinates
    const chunkX = x - chunkOffset;
    const mapX = Math.floor(chunkX / collisionData.precision);
    const mapY = Math.floor(y / collisionData.precision);
    
    // Check bounds
    if (mapX < 0 || mapX >= collisionData.width || mapY < 0 || mapY >= collisionData.height) {
        return false;
    }
    
    // Return if there's a collision at this point
    return collisionData.map[mapY][mapX] === 1;
}