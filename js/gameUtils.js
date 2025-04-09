// Game utility functions

// Function to create a unique identifier for areas
export function createAreaId(seed, direction) {
    return `area_${seed}_${direction}`;
}

// Function to handle area transitions
export function transitionToArea(callback) {
    const transitionElement = document.getElementById('area-transition');
    
    // Show transition
    transitionElement.classList.remove('hidden');
    transitionElement.classList.add('active');
    
    // After transition completes, run callback
    setTimeout(() => {
        if (callback) callback();
        
        // Hide transition
        setTimeout(() => {
            transitionElement.classList.remove('active');
            setTimeout(() => {
                transitionElement.classList.add('hidden');
            }, 500);
        }, 1000);
    }, 1000);
}

// Apply layer images to the DOM
export function applyLayerImages(scene, domElements, numberOfCopies = 5) {
    // Set background images for each layer content
    domElements.background.style.backgroundImage = `url(${scene.background.url})`;
    domElements.midBackground.style.backgroundImage = `url(${scene.midBackground.url})`;
    domElements.midground.style.backgroundImage = `url(${scene.midground.url})`;
    domElements.foreground.style.backgroundImage = `url(${scene.foreground.url})`;
    
    // Create multiple copies of each layer for truly seamless scrolling
    domElements.background.style.width = (scene.background.width * numberOfCopies) + 'px';
    domElements.midBackground.style.width = (scene.midBackground.width * numberOfCopies) + 'px';
    domElements.midground.style.width = (scene.midground.width * numberOfCopies) + 'px';
    domElements.foreground.style.width = (scene.foreground.width * numberOfCopies) + 'px';
    
    // Ensure proper positioning
    domElements.background.style.left = '0px';
    domElements.midBackground.style.left = '0px';
    domElements.midground.style.left = '0px';
    domElements.foreground.style.left = '0px';
    
    return {
        background: scene.background.width,
        midBackground: scene.midBackground.width,
        midground: scene.midground.width,
        foreground: scene.foreground.width
    };
}