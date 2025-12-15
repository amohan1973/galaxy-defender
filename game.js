/**
 * Galaxy Defender - Space Object Avoidance Game
 * A game where players pilot a rocket to avoid asteroids and UFOs while collecting stars
 */

class GalaxyDefender {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.timeElement = document.getElementById('time');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.finalScoreElement = document.getElementById('finalScore');
        this.restartBtn = document.getElementById('restartBtn');
        
        // Game state
        this.gameState = 'playing'; // 'playing' or 'gameOver'
        this.score = 0;
        this.startTime = Date.now();
        this.lastSpeedIncrease = 0;
        
        // Game settings
        this.baseSpeed = 3;
        this.speedMultiplier = 1;
        this.spawnRate = 0.02; // Probability of spawning per frame
        this.difficultyIncreaseInterval = 10000; // 10 seconds in milliseconds
        
        // Player settings
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 80,
            width: 40,
            height: 40,
            emoji: '🚀'
        };
        
        // Mouse tracking
        this.mouseX = this.canvas.width / 2;
        
        // Game objects
        this.objects = [];
        
        // Object types
        this.objectTypes = {
            star: { emoji: '⭐', points: 50, deadly: false, spawnWeight: 0.4 },
            asteroid: { emoji: '☄️', points: 0, deadly: true, spawnWeight: 0.3 },
            ufo: { emoji: '🛸', points: 0, deadly: true, spawnWeight: 0.3 }
        };
        
        this.init();
    }
    
    init() {
        // Set up event listeners
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.restartBtn.addEventListener('click', () => this.restart());
        
        // Set canvas font for emojis
        this.ctx.font = '30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Start game loop
        this.gameLoop();
    }
    
    handleMouseMove(e) {
        if (this.gameState !== 'playing') return;
        
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        
        // Constrain mouse position to canvas boundaries
        this.mouseX = Math.max(this.player.width / 2, 
                              Math.min(this.canvas.width - this.player.width / 2, this.mouseX));
    }
    
    updatePlayer() {
        if (this.gameState !== 'playing') return;
        
        // Smooth movement towards mouse position
        const targetX = this.mouseX;
        const dx = targetX - this.player.x;
        this.player.x += dx * 0.1; // Smooth following
        
        // Ensure player stays within bounds
        this.player.x = Math.max(this.player.width / 2, 
                                Math.min(this.canvas.width - this.player.width / 2, this.player.x));
    }
    
    spawnObject() {
        if (this.gameState !== 'playing') return;
        
        if (Math.random() < this.spawnRate) {
            // Choose object type based on weights
            const rand = Math.random();
            let objectType;
            
            if (rand < 0.4) {
                objectType = 'star';
            } else if (rand < 0.7) {
                objectType = 'asteroid';
            } else {
                objectType = 'ufo';
            }
            
            const object = {
                x: Math.random() * (this.canvas.width - 40) + 20,
                y: -40,
                width: 35,
                height: 35,
                speed: (this.baseSpeed + Math.random() * 2) * this.speedMultiplier,
                type: objectType,
                ...this.objectTypes[objectType]
            };
            
            this.objects.push(object);
        }
    }
    
    updateObjects() {
        if (this.gameState !== 'playing') return;
        
        for (let i = this.objects.length - 1; i >= 0; i--) {
            const obj = this.objects[i];
            obj.y += obj.speed;
            
            // Remove objects that are off screen
            if (obj.y > this.canvas.height + 50) {
                this.objects.splice(i, 1);
                continue;
            }
            
            // Check collision with player
            if (this.checkCollision(this.player, obj)) {
                if (obj.deadly) {
                    // Game over on collision with deadly objects
                    this.gameOver();
                    return;
                } else {
                    // Collect star
                    this.score += obj.points;
                    this.updateScore();
                    this.objects.splice(i, 1);
                    
                    // Visual feedback for collection
                    this.showCollectionEffect(obj.x, obj.y);
                }
            }
        }
    }
    
    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    showCollectionEffect(x, y) {
        // Simple visual feedback - could be enhanced with particles
        const originalFont = this.ctx.font;
        this.ctx.font = '20px Arial';
        this.ctx.fillStyle = '#00ff00';
        this.ctx.fillText('+50', x, y);
        this.ctx.font = originalFont;
    }
    
    updateDifficulty() {
        if (this.gameState !== 'playing') return;
        
        const currentTime = Date.now();
        const elapsedTime = currentTime - this.startTime;
        
        // Increase difficulty every 10 seconds
        if (elapsedTime - this.lastSpeedIncrease >= this.difficultyIncreaseInterval) {
            this.speedMultiplier += 0.2;
            this.spawnRate = Math.min(0.05, this.spawnRate + 0.005); // Cap spawn rate
            this.lastSpeedIncrease = elapsedTime;
        }
    }
    
    updateScore() {
        this.scoreElement.textContent = this.score;
    }
    
    updateTime() {
        if (this.gameState !== 'playing') return;
        
        const elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
        this.timeElement.textContent = elapsedTime;
    }
    
    render() {
        // Clear canvas with space background
        this.ctx.fillStyle = 'rgba(0, 0, 17, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Add stars background effect
        this.renderStarField();
        
        if (this.gameState === 'playing') {
            // Render player
            this.ctx.font = '35px Arial';
            this.ctx.fillText(this.player.emoji, this.player.x, this.player.y);
            
            // Render objects
            this.ctx.font = '30px Arial';
            this.objects.forEach(obj => {
                this.ctx.fillText(obj.emoji, obj.x, obj.y);
            });
        }
    }
    
    renderStarField() {
        // Simple star field effect
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 50; i++) {
            const x = (i * 137.5) % this.canvas.width;
            const y = (i * 73.3 + Date.now() * 0.01) % this.canvas.height;
            this.ctx.fillRect(x, y, 1, 1);
        }
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        this.finalScoreElement.textContent = this.score;
        this.gameOverScreen.classList.remove('hidden');
    }
    
    restart() {
        // Reset all game state
        this.gameState = 'playing';
        this.score = 0;
        this.startTime = Date.now();
        this.lastSpeedIncrease = 0;
        this.speedMultiplier = 1;
        this.spawnRate = 0.02;
        this.objects = [];
        
        // Reset player position
        this.player.x = this.canvas.width / 2;
        this.player.y = this.canvas.height - 80;
        this.mouseX = this.canvas.width / 2;
        
        // Update UI
        this.updateScore();
        this.gameOverScreen.classList.add('hidden');
    }
    
    gameLoop() {
        try {
            // Update game logic
            this.updatePlayer();
            this.spawnObject();
            this.updateObjects();
            this.updateDifficulty();
            this.updateTime();
            
            // Render everything
            this.render();
            
            // Continue game loop
            requestAnimationFrame(() => this.gameLoop());
        } catch (error) {
            console.error('Game loop error:', error);
            // Attempt to continue the game loop even if there's an error
            requestAnimationFrame(() => this.gameLoop());
        }
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        new GalaxyDefender();
    } catch (error) {
        console.error('Failed to initialize Galaxy Defender:', error);
        alert('Failed to start the game. Please refresh the page and try again.');
    }
});

// Handle window resize
window.addEventListener('resize', () => {
    // Could implement canvas resizing here if needed
});

// Prevent context menu on canvas
document.getElementById('gameCanvas').addEventListener('contextmenu', (e) => {
    e.preventDefault();
});