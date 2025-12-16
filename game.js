/**
 * Galaxy Defender - Space Object Avoidance Game
 * A game where the player pilots a rocket to dodge asteroids and UFOs while collecting stars
 */

class GalaxyDefender {
    constructor() {
        // Canvas and context setup
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.gameState = 'start'; // 'start', 'playing', 'gameOver'
        this.score = 0;
        this.startTime = 0;
        this.elapsedTime = 0;
        this.lastDifficultyIncrease = 0;
        
        // Game settings
        this.baseSpeed = 3;
        this.currentSpeed = this.baseSpeed;
        this.spawnRate = 0.02; // Probability of spawning an object per frame
        this.difficultyIncreaseInterval = 10000; // 10 seconds in milliseconds
        
        // Player setup
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 80,
            width: 40,
            height: 40,
            emoji: '🚀'
        };
        
        // Game objects arrays
        this.objects = [];
        
        // Object types configuration
        this.objectTypes = {
            star: {
                emoji: '⭐',
                type: 'good',
                points: 50,
                spawnWeight: 0.4 // 40% chance
            },
            asteroid: {
                emoji: '☄️',
                type: 'bad',
                points: 0,
                spawnWeight: 0.35 // 35% chance
            },
            ufo: {
                emoji: '🛸',
                type: 'bad',
                points: 0,
                spawnWeight: 0.25 // 25% chance
            }
        };
        
        // Mouse tracking
        this.mouseX = this.canvas.width / 2;
        
        // UI elements
        this.scoreElement = document.getElementById('score');
        this.timeElement = document.getElementById('time');
        this.finalScoreElement = document.getElementById('finalScore');
        this.finalTimeElement = document.getElementById('finalTime');
        this.startScreen = document.getElementById('startScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.startButton = document.getElementById('startButton');
        this.restartButton = document.getElementById('restartButton');
        
        this.init();
    }
    
    init() {
        // Event listeners
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.startButton.addEventListener('click', () => this.startGame());
        this.restartButton.addEventListener('click', () => this.restartGame());
        
        // Handle window resize
        window.addEventListener('resize', () => this.handleResize());
        
        // Start the game loop
        this.gameLoop();
    }
    
    handleMouseMove(e) {
        if (this.gameState !== 'playing') return;
        
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        this.mouseX = (e.clientX - rect.left) * scaleX;
        
        // Constrain mouse position to canvas boundaries
        this.mouseX = Math.max(this.player.width / 2, 
                              Math.min(this.canvas.width - this.player.width / 2, this.mouseX));
    }
    
    handleResize() {
        // Maintain aspect ratio and responsive design
        const container = this.canvas.parentElement;
        const maxWidth = Math.min(window.innerWidth * 0.9, 800);
        const maxHeight = Math.min(window.innerHeight * 0.6, 600);
        
        this.canvas.style.width = maxWidth + 'px';
        this.canvas.style.height = maxHeight + 'px';
    }
    
    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.startTime = Date.now();
        this.elapsedTime = 0;
        this.lastDifficultyIncrease = 0;
        this.currentSpeed = this.baseSpeed;
        this.spawnRate = 0.02;
        this.objects = [];
        
        // Reset player position
        this.player.x = this.canvas.width / 2;
        this.player.y = this.canvas.height - 80;
        
        // Hide start screen
        this.startScreen.classList.add('hidden');
        
        // Update UI
        this.updateUI();
    }
    
    restartGame() {
        this.gameOverScreen.classList.add('hidden');
        this.startGame();
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        
        // Update final stats
        this.finalScoreElement.textContent = this.score;
        this.finalTimeElement.textContent = Math.floor(this.elapsedTime / 1000);
        
        // Show game over screen
        this.gameOverScreen.classList.remove('hidden');
    }
    
    updateDifficulty() {
        const timeSinceLastIncrease = this.elapsedTime - this.lastDifficultyIncrease;
        
        if (timeSinceLastIncrease >= this.difficultyIncreaseInterval) {
            this.currentSpeed += 0.5; // Increase falling speed
            this.spawnRate = Math.min(this.spawnRate + 0.005, 0.05); // Increase spawn rate (cap at 0.05)
            this.lastDifficultyIncrease = this.elapsedTime;
            
            console.log(`Difficulty increased! Speed: ${this.currentSpeed}, Spawn Rate: ${this.spawnRate}`);
        }
    }
    
    spawnObject() {
        if (Math.random() < this.spawnRate) {
            const objectType = this.getRandomObjectType();
            const object = {
                x: Math.random() * (this.canvas.width - 40) + 20,
                y: -40,
                width: 35,
                height: 35,
                speed: this.currentSpeed + Math.random() * 2, // Add some variation
                ...objectType
            };
            
            this.objects.push(object);
        }
    }
    
    getRandomObjectType() {
        const rand = Math.random();
        let cumulativeWeight = 0;
        
        for (const [key, config] of Object.entries(this.objectTypes)) {
            cumulativeWeight += config.spawnWeight;
            if (rand <= cumulativeWeight) {
                return { ...config, objectType: key };
            }
        }
        
        // Fallback to asteroid
        return { ...this.objectTypes.asteroid, objectType: 'asteroid' };
    }
    
    updateObjects() {
        // Update object positions
        for (let i = this.objects.length - 1; i >= 0; i--) {
            const obj = this.objects[i];
            obj.y += obj.speed;
            
            // Remove objects that are off-screen
            if (obj.y > this.canvas.height + 50) {
                this.objects.splice(i, 1);
                continue;
            }
            
            // Check collision with player
            if (this.checkCollision(this.player, obj)) {
                if (obj.type === 'good') {
                    // Collect star
                    this.score += obj.points;
                    this.objects.splice(i, 1);
                    this.createCollectionEffect(obj.x, obj.y);
                } else {
                    // Hit asteroid or UFO - game over
                    this.gameOver();
                    return;
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
    
    createCollectionEffect(x, y) {
        // Simple visual feedback for collecting stars
        // This could be enhanced with particle effects
        console.log(`Star collected at (${x}, ${y})! +50 points`);
    }
    
    updatePlayer() {
        // Smooth movement towards mouse position
        const targetX = this.mouseX - this.player.width / 2;
        const diff = targetX - this.player.x;
        this.player.x += diff * 0.15; // Smooth interpolation
        
        // Ensure player stays within bounds
        this.player.x = Math.max(0, Math.min(this.canvas.width - this.player.width, this.player.x));
    }
    
    updateUI() {
        this.scoreElement.textContent = this.score;
        this.timeElement.textContent = Math.floor(this.elapsedTime / 1000);
    }
    
    render() {
        // Clear canvas with space background effect
        this.ctx.fillStyle = 'rgba(0, 0, 17, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw stars background
        this.drawStarField();
        
        if (this.gameState === 'playing') {
            // Draw player
            this.drawEmoji(this.player.emoji, this.player.x, this.player.y, this.player.width);
            
            // Draw objects
            this.objects.forEach(obj => {
                this.drawEmoji(obj.emoji, obj.x, obj.y, obj.width);
            });
            
            // Draw player glow effect
            this.drawPlayerGlow();
        }
    }
    
    drawStarField() {
        // Simple animated star field background
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 50; i++) {
            const x = (i * 137.5 + this.elapsedTime * 0.01) % this.canvas.width;
            const y = (i * 73.3 + this.elapsedTime * 0.02) % this.canvas.height;
            const size = Math.sin(this.elapsedTime * 0.001 + i) * 0.5 + 1;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawPlayerGlow() {
        // Add glow effect around player
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'screen';
        this.ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(
            this.player.x + this.player.width / 2,
            this.player.y + this.player.height / 2,
            this.player.width,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        this.ctx.restore();
    }
    
    drawEmoji(emoji, x, y, size) {
        this.ctx.font = `${size}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Add shadow for better visibility
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillText(emoji, x + size/2 + 2, y + size/2 + 2);
        
        // Draw the emoji
        this.ctx.fillStyle = 'white';
        this.ctx.fillText(emoji, x + size/2, y + size/2);
    }
    
    update() {
        if (this.gameState === 'playing') {
            // Update elapsed time
            this.elapsedTime = Date.now() - this.startTime;
            
            // Update difficulty
            this.updateDifficulty();
            
            // Update game objects
            this.updatePlayer();
            this.spawnObject();
            this.updateObjects();
            
            // Update UI
            this.updateUI();
        }
    }
    
    gameLoop() {
        try {
            this.update();
            this.render();
        } catch (error) {
            console.error('Game loop error:', error);
            // Attempt to recover by resetting to start state
            this.gameState = 'start';
            this.startScreen.classList.remove('hidden');
            this.gameOverScreen.classList.add('hidden');
        }
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
    try {
        const game = new GalaxyDefender();
        console.log('Galaxy Defender initialized successfully!');
    } catch (error) {
        console.error('Failed to initialize Galaxy Defender:', error);
        alert('Failed to load the game. Please refresh the page and try again.');
    }
});

// Handle page visibility changes to pause/resume game
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('Game paused (tab hidden)');
    } else {
        console.log('Game resumed (tab visible)');
    }
});