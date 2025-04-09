// Game configuration
export const config = {
    // Layer speeds for parallax effect
    layerSpeeds: {
        background: 0.1,
        midBackground: 0.3,
        midground: 0.7,
        foreground: 1.2
    },
    
    // Chunk system
    chunkWidth: window.innerWidth * 2, // Each chunk is twice the screen width
    chunksToKeep: 3, // Number of chunks to keep in memory (previous, current, next)
    chunkLoadThreshold: 0.7, // Load new chunk when player is 70% through current chunk
    
    // Player physics
    gravity: 0.5,
    jumpForce: -12,
    maxFallSpeed: 15,
    moveSpeed: 5,
    
    // Collision detection
    platformColor: '#00FF00', // Green for platforms in generated images
    platformThreshold: 100,   // RGB distance threshold for detecting platforms
    collisionPrecision: 8,    // Lower = more precise but more expensive
    
    // Image generation
    imageAspectRatio: "21:9"  // Panoramic aspect ratio for generated images
};