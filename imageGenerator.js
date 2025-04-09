import { config } from 'config';

// Process image and make background transparent
export async function processImageTransparency(imageUrl, bgColor = "#FFFFFF", tolerance = 60) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = function() {
            const processCanvas = document.getElementById('processCanvas');
            const ctx = processCanvas.getContext('2d');
            
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

// Generate a single layer for a specific chunk
export async function generateLayer(layer, chunkIndex, seed) {
    let prompt = "";
    
    switch(layer) {
        case "background":
            prompt = `8-bit pixel art retro game background with distant mountains and ${chunkIndex % 2 === 0 ? 'night sky with stars' : 'sunset with gradients'}, low color palette (4-8 colors), perfectly tileable horizontally with matching left and right edges, seamless repeating pattern, NES or SNES style, wide panoramic view`;
            break;
        case "midBackground":
            prompt = `8-bit pixel art retro game mid-background with silhouetted ${chunkIndex % 3 === 0 ? 'pine trees' : chunkIndex % 3 === 1 ? 'ruins and ancient monuments' : 'rock formations and hills'} and rock formations, perfectly tileable horizontally with matching left and right edges, seamless repeating pattern, low color palette (4-8 colors), NES or SNES style, wide panoramic view`;
            break;
        case "midground":
            prompt = `8-bit pixel art retro game midground with clear platforms marked with ${config.platformColor} edges, ${chunkIndex % 4 === 0 ? 'grass and rocks' : chunkIndex % 4 === 1 ? 'metal and industrial structures' : chunkIndex % 4 === 2 ? 'sand and desert elements' : 'snow and ice formations'} in classic platformer style, perfectly tileable horizontally with matching left and right edges, seamless repeating pattern, clear pixel art style, Super Mario Bros or Mega Man inspired, low color palette (8-16 colors), wide panoramic view. Include solid walkable areas clearly defined with ${config.platformColor} top edges.`;
            break;
        case "foreground":
            prompt = `8-bit pixel art retro game foreground with decorative ${chunkIndex % 2 === 0 ? 'vines and hanging elements' : 'ruins and debris'} on pure bright white background (#FFFFFF), only elements at top and sides with empty center area, perfectly tileable horizontally with matching left and right edges, seamless repeating pattern, low color palette (4-8 colors), wide panoramic view`;
            break;
    }
    
    try {
        const image = await websim.imageGen({
            prompt: prompt,
            aspect_ratio: config.imageAspectRatio,
            seed: seed || (chunkIndex * 10 + Object.keys(layer).length)
        });
        
        if (layer === "foreground") {
            return await processImageTransparency(image.url, "#FFFFFF", 100);
        }
        
        return image.url;
    } catch (error) {
        console.error(`Error generating ${layer} for chunk ${chunkIndex}:`, error);
        // Return a fallback color in case of error
        return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23${layer === 'background' ? '000033' : layer === 'midBackground' ? '003366' : layer === 'midground' ? '006699' : '009933'}"/></svg>`;
    }
}