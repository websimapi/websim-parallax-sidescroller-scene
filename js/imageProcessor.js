// Functions for image processing

// Function to process image and make background transparent
export async function processImageTransparency(imageUrl, bgColor = "#FFFFFF", tolerance = 60) {
    return new Promise((resolve, reject) => {
        const processCanvas = document.getElementById('processCanvas');
        const ctx = processCanvas.getContext('2d');
        
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
export function getImageDimensions(imageUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = imageUrl;
    });
}