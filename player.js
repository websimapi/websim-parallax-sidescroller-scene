import { config } from './config';
import { checkCollision } from './collision';

// Player states
export const PlayerState = {
    IDLE: 'idle',
    RUNNING: 'running',
    JUMPING: 'jumping',
    FALLING: 'falling'
};

// Player class to handle movement and physics
export class Player {
    constructor() {
        this.x = window.innerWidth * 0.45;  // Player's x position on screen (fixed)
        this.y = window.innerHeight * 0.7;  // Player's y position on screen (changes with gravity)
        this.worldX = 0;                    // Player's position in the world
        this.velocityY = 0;                 // Vertical velocity
        this.onGround = false;              // Is the player on a platform?
        this.state = PlayerState.IDLE;      // Current player state
        this.element = document.getElementById('player');
        this.stateInfo = document.getElementById('state-info');
    }
    
    // Update player physics
    update(keys, worldPos, currentChunk, chunkCollisionData) {
        let moveX = 0;
        
        // Handle horizontal movement
        if (keys['ArrowRight'] || keys['d'] || keys['D']) {
            moveX = -config.moveSpeed;
            this.element.style.transform = 'scaleX(1)'; // Face right
            this.state = this.onGround ? PlayerState.RUNNING : this.state;
        } else if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
            moveX = config.moveSpeed;
            this.element.style.transform = 'scaleX(-1)'; // Face left
            this.state = this.onGround ? PlayerState.RUNNING : this.state;
        } else if (this.onGround) {
            this.state = PlayerState.IDLE;
        }
        
        // Handle jumping
        if ((keys[' '] || keys['ArrowUp'] || keys['w'] || keys['W']) && this.onGround) {
            this.velocityY = config.jumpForce;
            this.onGround = false;
            this.state = PlayerState.JUMPING;
        }
        
        // Apply gravity
        this.velocityY += config.gravity;
        
        // Limit fall speed
        if (this.velocityY > config.maxFallSpeed) {
            this.velocityY = config.maxFallSpeed;
        }
        
        // Update vertical position
        this.y += this.velocityY;
        
        // Set falling state
        if (this.velocityY > 0 && !this.onGround) {
            this.state = PlayerState.FALLING;
        }
        
        // Check for ground collision
        this.checkGroundCollision(currentChunk, chunkCollisionData);
        
        // Update horizontal position and world position
        this.worldX -= moveX;
        
        // Update player element position
        this.element.style.bottom = `${window.innerHeight - this.y}px`;
        
        // Update state display
        this.stateInfo.textContent = this.state;
        
        return {
            moveX,
            worldPos: this.worldX
        };
    }
    
    // Check for collision with ground
    checkGroundCollision(currentChunk, chunkCollisionData) {
        if (!chunkCollisionData) return;
        
        // Calculate feet position
        const feetY = this.y + 64; // Player height
        
        // Check for collision at feet
        const chunkOffset = currentChunk * config.chunkWidth;
        const onPlatform = checkCollision(this.worldX, feetY, chunkOffset, chunkCollisionData);
        
        if (onPlatform) {
            // Player is on a platform
            if (this.velocityY > 0) { // Only if falling
                // Adjust position to stand on the platform
                const collisionY = Math.floor(feetY / chunkCollisionData.precision) * chunkCollisionData.precision;
                this.y = collisionY - 64; // Position player on top of platform
                this.velocityY = 0;
                this.onGround = true;
            }
        } else {
            // Player is in the air
            this.onGround = false;
            
            // Check if player is below the bottom of the screen
            if (this.y > window.innerHeight) {
                // Reset player to the top of the screen
                this.y = 0;
                this.velocityY = 0;
            }
        }
    }
}