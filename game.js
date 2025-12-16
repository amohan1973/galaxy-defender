/**
 * Galaxy Defender - Space Object Avoidance Game
 * A vertical scrolling space game where players dodge asteroids and collect stars
 */

class GalaxyDefender {
    constructor() {
        // Canvas and context setup
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.gameState = 'start'; // 'start', 'playing', 'gameOver'
        this.score = 0;
        this.gameTime = 0;
        this.lastTime = 0;
        
        // Game settings
        this.baseSpeed = 3;
        this.currentSpeed = this.baseSpeed;
        this.speedIncrement = 0.5;
        this.difficultyInterval = 10000; // 10 seconds in milliseconds
        this.lastDifficultyIncrease = 0;
        
        // Spawn settings
        this.spawnRate = 0.02; // Base spawn probability per frame
        this.currentSpawnRate = this.spawnRate;
        
        // Player setup
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 80,
            width: 40,
            height: 40,
            emoji: '🚀'
        };
        
        // Game objects
        this.objects = [];
        
        // Object types configuration
        this.objectTypes = {
            star: {
                emoji: '⭐',
                points: 50,
                isGood: true,
                spawnWeight: 0.3
            },
            asteroid: {
                emoji: '☄️',
                points: 0,
                isGood: false,
                spawnWeight: 0.4
            },
            ufo: {
                emoji: '🛸',
                points: 0,
                isGood: false,
                spawnWeight: 0.3
            }
        };
        
        // Mouse tracking
        this.mouseX = this.canvas.width / 2;
        
        // UI elements
        this.scoreElement = document.getElementById('score');
        this.timerElement = document.getElementById('timer');
        this.startScreen = document.getElementById('startScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.finalScoreElement = document.getElementById('finalScore');
        this.survivalTimeElement = document.getElementById('survivalTime');
        
        // Initialize game
        this.init();
    }
    
    init() {
        // Event listeners
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.getElementById('startButton').addEventListener('click', () => this.startGame());
        document.getElementById('restartButton').addEventListener('click', () => this.restartGame());
        
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
        
        // Constrain mouse position to canvas bounds
        this.mouseX = Math.max(this.player.width / 2, 
                              Math.min(this.canvas.width - this.player.width / 2, this.mouseX));
    }
    
    handleResize() {
        // Maintain aspect ratio on resize
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        
        if (rect.width / rect.height > 800 / 600) {
            this.canvas.style.height = '100%';
            this.canvas.style.width = 'auto';
        } else {
            this.canvas.style.width = '100%';
            this.canvas.style.height = 'auto';
        }
    }
    
    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.gameTime = 0;
        this.currentSpeed = this.baseSpeed;
        this.currentSpawnRate = this.spawnRate;
        this.lastDifficultyIncrease = 0;
        this.objects = [];
        
        // Reset player position
        this.player.x = this.canvas.width / 2;
        
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
        
        // Update final score display
        this.finalScoreElement.textContent = `Final Score: ${this.score}`;
        this.survivalTimeElement.textContent = `Survival Time: ${Math.floor(this.gameTime / 1000)}s`;
        
        // Show game over screen
        this.gameOverScreen.classList.remove('hidden');
    }
    
    spawnObject() {
        if (Math.random() < this.currentSpawnRate) {
            // Select object type based on weights
            const rand = Math.random();
            let cumulativeWeight = 0;
            let selectedType = 'asteroid';
            
            for (const [type, config] of Object.entries(this.objectTypes)) {
                cumulativeWeight += config.spawnWeight;
                if (rand <= cumulativeWeight) {
                    selectedType = type;
                    break;
                }
            }
            
            const objectConfig = this.objectTypes[selectedType];
            
            this.objects.push({
                x: Math.random() * (this.canvas.width - 40) + 20,
                y: -40,
                width: 35,
                height: 35,
                type: selectedType,
                emoji: objectConfig.emoji,
                points: objectConfig.points,
                isGood: objectConfig.isGood,
                speed: this.currentSpeed + Math.random() * 2
            });
        }
    }
    
    updateObjects() {
        // Update object positions
        for (let i = this.objects.length - 1; i >= 0; i--) {
            const obj = this.objects[i];
            obj.y += obj.speed;
            
            // Remove objects that are off screen
            if (obj.y > this.canvas.height + 50) {
                this.objects.splice(i, 1);
            }
        }
    }
    
    checkCollisions() {
        for (let i = this.objects.length - 1; i >= 0; i--) {
            const obj = this.objects[i];
            
            // Simple rectangular collision detection
            if (this.player.x - this.player.width / 2 < obj.x + obj.width / 2 &&
                this.player.x + this.player.width / 2 > obj.x - obj.width / 2 &&
                this.player.y - this.player.height / 2 < obj.y + obj.height / 2 &&
                this.player.y + this.player.height / 2 > obj.y - obj.height / 2) {
                
                if (obj.isGood) {
                    // Collect star
                    this.score += obj.points;
                    this.objects.splice(i, 1);
                    this.updateUI();
                } else {
                    // Hit asteroid or UFO - game over
                    this.gameOver();
                    return;
                }
            }
        }
    }
    
    updateDifficulty(deltaTime) {
        // Increase difficulty every 10 seconds
        if (this.gameTime - this.lastDifficultyIncrease >= this.difficultyInterval) {
            this.currentSpeed += this.speedIncrement;
            this.currentSpawnRate = Math.min(this.currentSpawnRate + 0.005, 0.05); // Cap spawn rate
            this.lastDifficultyIncrease = this.gameTime;
        }
    }
    
    updatePlayer() {
        // Smooth player movement towards mouse position
        const targetX = this.mouseX;
        const moveSpeed = 0.15;
        this.player.x += (targetX - this.player.x) * moveSpeed;
        
        // Ensure player stays within bounds
        this.player.x = Math.max(this.player.width / 2, 
                                Math.min(this.canvas.width - this.player.width / 2, this.player.x));
    }
    
    updateUI() {
        this.scoreElement.textContent = `Score: ${this.score}`;
        this.timerElement.textContent = `Time: ${Math.floor(this.gameTime / 1000)}s`;
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.gameState === 'playing') {
            // Draw stars background effect
            this.drawStarField();
            
            // Draw player
            this.drawEmoji(this.player.emoji, this.player.x, this.player.y, this.player.width);
            
            // Draw objects
            this.objects.forEach(obj => {
                this.drawEmoji(obj.emoji, obj.x, obj.y, obj.width);
            });
        }
    }
    
    drawStarField() {
        // Simple animated star field background
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        for (let i = 0; i < 50; i++) {
            const x = (i * 137.5 + this.gameTime * 0.01) % this.canvas.width;
            const y = (i * 73.3 + this.gameTime * 0.02) % this.canvas.height;
            this.ctx.fillRect(x, y, 1, 1);
        }
    }
    
    drawEmoji(emoji, x, y, size) {
        this.ctx.font = `${size}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Add glow effect for better visibility
        this.ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
        this.ctx.shadowBlur = 10;
        
        this.ctx.fillText(emoji, x, y);
        
        // Reset shadow
        this.ctx.shadowBlur = 0;
    }
    
    update(deltaTime) {
        if (this.gameState !== 'playing') return;
        
        this.gameTime += deltaTime;
        
        // Update game components
        this.updatePlayer();
        this.spawnObject();
        this.updateObjects();
        this.checkCollisions();
        this.updateDifficulty(deltaTime);
        this.updateUI();
    }
    
    gameLoop(currentTime = 0) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Update game logic
        this.update(deltaTime);
        
        // Render game
        this.render();
        
        // Continue game loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// Error handling and initialization
try {
    // Wait for DOM to be fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            new GalaxyDefender();
        });
    } else {
        new GalaxyDefender();
    }
} catch (error) {
    console.error('Failed to initialize Galaxy Defender:', error);
    
    // Show error message to user
    document.body.innerHTML = `
        <div style="
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background: #0c0c0c;
            color: white;
            font-family: Arial, sans-serif;
            text-align: center;
        ">
            <div>
                <h1>🚀 Galaxy Defender</h1>
                <p>Sorry, the game failed to load.</p>
                <p>Please refresh the page and try again.</p>
                <p style="font-size: 0.8em; color: #888; margin-top: 20px;">
                    Error: ${error.message}
                </p>
            </div>
        </div>
    `;
}