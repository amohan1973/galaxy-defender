/**
 * Galaxy Defender - Space Avoidance Game
 * A vertical scrolling space game where players dodge asteroids and collect stars
 */

class GalaxyDefender {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.timeElement = document.getElementById('time');
        this.speedElement = document.getElementById('speed');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.startScreen = document.getElementById('startScreen');
        this.finalScoreElement = document.getElementById('finalScore');
        this.finalTimeElement = document.getElementById('finalTime');
        this.restartButton = document.getElementById('restartButton');
        this.startButton = document.getElementById('startButton');
        
        // Game state
        this.gameState = 'start'; // 'start', 'playing', 'gameOver'
        this.score = 0;
        this.gameTime = 0;
        this.lastTime = 0;
        this.gameSpeed = 1.0;
        this.lastSpeedIncrease = 0;
        
        // Player properties
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 80,
            width: 40,
            height: 40,
            emoji: '🚀'
        };
        
        // Game objects
        this.objects = [];
        this.objectSpawnTimer = 0;
        this.objectSpawnInterval = 1000; // milliseconds
        
        // Mouse tracking
        this.mouseX = this.canvas.width / 2;
        
        // Object types configuration
        this.objectTypes = {
            star: {
                emoji: '⭐',
                points: 50,
                harmful: false,
                spawnChance: 0.4
            },
            asteroid: {
                emoji: '☄️',
                points: 0,
                harmful: true,
                spawnChance: 0.35
            },
            ufo: {
                emoji: '🛸',
                points: 0,
                harmful: true,
                spawnChance: 0.25
            }
        };
        
        this.init();
    }
    
    init() {
        // Set up event listeners
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.restartButton.addEventListener('click', () => this.restartGame());
        this.startButton.addEventListener('click', () => this.startGame());
        
        // Handle canvas resize for responsiveness
        this.handleResize();
        window.addEventListener('resize', () => this.handleResize());
        
        // Start the game loop
        this.gameLoop();
    }
    
    handleResize() {
        const container = this.canvas.parentElement;
        const maxWidth = Math.min(800, window.innerWidth - 40);
        const maxHeight = Math.min(600, window.innerHeight - 200);
        
        if (maxWidth < 800) {
            const scale = maxWidth / 800;
            this.canvas.style.width = maxWidth + 'px';
            this.canvas.style.height = (600 * scale) + 'px';
        }
    }
    
    handleMouseMove(e) {
        if (this.gameState !== 'playing') return;
        
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        this.mouseX = (e.clientX - rect.left) * scaleX;
        
        // Keep player within canvas bounds
        this.mouseX = Math.max(this.player.width / 2, 
                              Math.min(this.canvas.width - this.player.width / 2, this.mouseX));
    }
    
    startGame() {
        this.gameState = 'playing';
        this.startScreen.classList.add('hidden');
        this.resetGame();
    }
    
    resetGame() {
        this.score = 0;
        this.gameTime = 0;
        this.gameSpeed = 1.0;
        this.lastSpeedIncrease = 0;
        this.objects = [];
        this.objectSpawnTimer = 0;
        this.player.x = this.canvas.width / 2;
        this.mouseX = this.canvas.width / 2;
        
        this.updateUI();
    }
    
    restartGame() {
        this.gameOverScreen.classList.add('hidden');
        this.startGame();
    }
    
    gameLoop(currentTime = 0) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        if (this.gameState === 'playing') {
            this.update(deltaTime);
        }
        
        this.render();
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaTime) {
        // Update game time
        this.gameTime += deltaTime;
        
        // Increase speed every 10 seconds
        const currentSpeedLevel = Math.floor(this.gameTime / 10000);
        if (currentSpeedLevel > this.lastSpeedIncrease) {
            this.gameSpeed += 0.2;
            this.lastSpeedIncrease = currentSpeedLevel;
        }
        
        // Update player position (follows mouse horizontally)
        this.player.x = this.mouseX;
        
        // Spawn objects
        this.objectSpawnTimer += deltaTime;
        if (this.objectSpawnTimer >= this.objectSpawnInterval / this.gameSpeed) {
            this.spawnObject();
            this.objectSpawnTimer = 0;
        }
        
        // Update objects
        this.updateObjects(deltaTime);
        
        // Check collisions
        this.checkCollisions();
        
        // Update UI
        this.updateUI();
    }
    
    spawnObject() {
        const types = Object.keys(this.objectTypes);
        let selectedType = null;
        const random = Math.random();
        let cumulativeChance = 0;
        
        // Select object type based on spawn chances
        for (const type of types) {
            cumulativeChance += this.objectTypes[type].spawnChance;
            if (random <= cumulativeChance) {
                selectedType = type;
                break;
            }
        }
        
        if (!selectedType) selectedType = types[0];
        
        const object = {
            x: Math.random() * (this.canvas.width - 40) + 20,
            y: -40,
            width: 35,
            height: 35,
            speed: (100 + Math.random() * 100) * this.gameSpeed,
            type: selectedType,
            ...this.objectTypes[selectedType]
        };
        
        this.objects.push(object);
    }
    
    updateObjects(deltaTime) {
        for (let i = this.objects.length - 1; i >= 0; i--) {
            const obj = this.objects[i];
            obj.y += obj.speed * (deltaTime / 1000);
            
            // Remove objects that have gone off screen
            if (obj.y > this.canvas.height + 50) {
                this.objects.splice(i, 1);
            }
        }
    }
    
    checkCollisions() {
        for (let i = this.objects.length - 1; i >= 0; i--) {
            const obj = this.objects[i];
            
            // Simple rectangular collision detection
            if (this.isColliding(this.player, obj)) {
                if (obj.harmful) {
                    // Game over on collision with harmful objects
                    this.gameOver();
                    return;
                } else {
                    // Collect beneficial objects (stars)
                    this.score += obj.points;
                    this.objects.splice(i, 1);
                }
            }
        }
    }
    
    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        this.finalScoreElement.textContent = this.score;
        this.finalTimeElement.textContent = Math.floor(this.gameTime / 1000);
        this.gameOverScreen.classList.remove('hidden');
    }
    
    updateUI() {
        this.scoreElement.textContent = this.score;
        this.timeElement.textContent = Math.floor(this.gameTime / 1000);
        this.speedElement.textContent = this.gameSpeed.toFixed(1);
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw starfield background
        this.drawStarfield();
        
        if (this.gameState === 'playing') {
            // Draw player
            this.drawEmoji(this.player.emoji, this.player.x, this.player.y, this.player.width);
            
            // Draw objects
            this.objects.forEach(obj => {
                this.drawEmoji(obj.emoji, obj.x, obj.y, obj.width);
            });
        }
    }
    
    drawStarfield() {
        // Create a simple animated starfield effect
        this.ctx.fillStyle = 'white';
        const time = Date.now() * 0.001;
        
        for (let i = 0; i < 50; i++) {
            const x = (i * 37) % this.canvas.width;
            const y = ((i * 73 + time * 20) % (this.canvas.height + 100)) - 50;
            const size = (i % 3) + 1;
            
            this.ctx.globalAlpha = 0.3 + (i % 3) * 0.2;
            this.ctx.fillRect(x, y, size, size);
        }
        this.ctx.globalAlpha = 1;
    }
    
    drawEmoji(emoji, x, y, size) {
        this.ctx.font = `${size}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Add a subtle glow effect
        this.ctx.shadowColor = 'white';
        this.ctx.shadowBlur = 5;
        
        this.ctx.fillText(emoji, x, y);
        
        // Reset shadow
        this.ctx.shadowBlur = 0;
    }
}

// Error handling wrapper
try {
    // Initialize the game when the page loads
    document.addEventListener('DOMContentLoaded', () => {
        new GalaxyDefender();
    });
} catch (error) {
    console.error('Game initialization failed:', error);
    // Display error message to user
    document.body.innerHTML = `
        <div style="color: white; text-align: center; padding: 50px; font-family: Arial;">
            <h2>Game Loading Error</h2>
            <p>Sorry, the game failed to load. Please refresh the page and try again.</p>
            <p>Error: ${error.message}</p>
        </div>
    `;
}