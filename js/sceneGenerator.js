import { processImageTransparency, getImageDimensions } from 'imageProcessor';

// Function to create a delay
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Generate scene layers with a specific seed
export async function generateScene(seed, loadingStatus) {
    try {
        // If no seed provided, generate a random one
        seed = seed || Math.floor(Math.random() * 1000);
        
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
            prompt: "8-bit pixel art retro game midground with platforms, grass and rocks in classic platformer style. Use only magenta (#FF00FF) for areas that should be transparent between platforms. Perfectly tileable horizontally with matching left and right edges, seamless repeating pattern, clear pixel art style, Super Mario Bros or Mega Man inspired, low color palette (8-16 colors)",
            aspect_ratio: "16:9",
            seed: seed
        });
        
        loadingStatus.textContent = "WAITING FOR NEXT GENERATION...";
        await sleep(3000);
        
        loadingStatus.textContent = "GENERATING FOREGROUND LAYER...";
        const foregroundImg = await websim.imageGen({
            prompt: "8-bit pixel art retro game foreground with decorative vines and hanging elements on pure magenta background (#FF00FF), elements only at top and sides with empty center area, perfectly tileable horizontally with matching left and right edges, seamless repeating pattern, low color palette (4-8 colors)",
            aspect_ratio: "16:9",
            seed: seed
        });
        
        loadingStatus.textContent = "PROCESSING TRANSPARENCY...";
        // Use magenta as the transparent color
        const processedForeground = await processImageTransparency(foregroundImg.url, "#FF00FF", 100);
        const processedMidground = await processImageTransparency(midgroundImg.url, "#FF00FF", 100);
        
        // Get and store image dimensions
        const bgDimensions = await getImageDimensions(backgroundImg.url);
        const midBgDimensions = await getImageDimensions(midBackgroundImg.url);
        const midgroundDimensions = await getImageDimensions(processedMidground);
        const foregroundDimensions = await getImageDimensions(processedForeground);
        
        return {
            background: {
                url: backgroundImg.url,
                width: bgDimensions.width,
                height: bgDimensions.height
            },
            midBackground: {
                url: midBackgroundImg.url,
                width: midBgDimensions.width,
                height: midBgDimensions.height
            },
            midground: {
                url: processedMidground,
                width: midgroundDimensions.width,
                height: midgroundDimensions.height
            },
            foreground: {
                url: processedForeground,
                width: foregroundDimensions.width,
                height: foregroundDimensions.height
            },
            seed: seed
        };
    } catch (error) {
        console.error("Error generating scene:", error);
        throw error;
    }
}

