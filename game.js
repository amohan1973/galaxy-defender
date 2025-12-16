/**
 * Galaxy Defender - Space Avoidance Game
 * A vertical scrolling space game where players pilot a rocket to avoid asteroids and UFOs
 * while collecting stars for points.
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
        this.spawnRate = 0.02;
        this.difficultyIncreaseInterval = 10000; // 10 seconds in milliseconds
        this.lastDifficultyIncrease = 0;
        
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
        this.particles = [];
        
        // Mouse tracking
        this.mouseX = this.canvas.width / 2;
        
        // Object types
        this.objectTypes = {
            star: { emoji: '⭐', points: 50, harmful: false, size: 30 },
            asteroid: { emoji: '☄️', points: 0, harmful: true, size: 35 },
            ufo: { emoji: '🛸', points: 0, harmful: true, size: 40 }
        };
        
        // Initialize game
        this.init();
    }
    
    /**
     * Initialize game event listeners and UI
     */
    init() {
        // Mouse movement tracking
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
        });
        
        // Button event listeners
        document.getElementById('startButton').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('restartButton').addEventListener('click', () => {
            this.restartGame();
        });
        
        // Start the game loop
        this.gameLoop();
    }
    
    /**
     * Start a new game
     */
    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.gameTime = 0;
        this.currentSpeed = this.baseSpeed;
        this.lastDifficultyIncrease = 0;
        this.objects = [];
        this.particles = [];
        
        // Hide start screen
        document.getElementById('startScreen').classList.add('hidden');
        
        // Reset player position
        this.player.x = this.canvas.width / 2;
        this.player.y = this.canvas.height - 80;
        
        this.updateUI();
    }
    
    /**
     * Restart the game after game over
     */
    restartGame() {
        // Hide game over screen
        document.getElementById('gameOverScreen').classList.add('hidden');
        this.startGame();
    }
    
    /**
     * End the game and show game over screen
     */
    gameOver() {
        this.gameState = 'gameOver';
        
        // Update final score display
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('survivalTime').textContent = Math.floor(this.gameTime / 1000) + 's';
        
        // Show game over screen
        document.getElementById('gameOverScreen').classList.remove('hidden');
        
        // Create explosion particles
        this.createExplosion(this.player.x, this.player.y);
    }
    
    /**
     * Update game logic
     */
    update(deltaTime) {
        if (this.gameState !== 'playing') return;
        
        this.gameTime += deltaTime;
        
        // Update player position (follows mouse horizontally)
        this.player.x = Math.max(this.player.width / 2, 
                        Math.min(this.canvas.width - this.player.width / 2, this.mouseX));
        
        // Increase difficulty every 10 seconds
        if (this.gameTime - this.lastDifficultyIncrease >= this.difficultyIncreaseInterval) {
            this.increaseDifficulty();
            this.lastDifficultyIncrease = this.gameTime;
        }
        
        // Spawn new objects
        this.spawnObjects();
        
        // Update objects
        this.updateObjects(deltaTime);
        
        // Update particles
        this.updateParticles(deltaTime);
        
        // Check collisions
        this.checkCollisions();
        
        // Update UI
        this.updateUI();
    }
    
    /**
     * Increase game difficulty
     */
    increaseDifficulty() {
        this.currentSpeed += 0.5;
        this.spawnRate += 0.005;
        
        // Create visual feedback for difficulty increase
        this.createDifficultyParticles();
    }
    
    /**
     * Spawn new falling objects
     */
    spawnObjects() {
        if (Math.random() < this.spawnRate) {
            const types = Object.keys(this.objectTypes);
            const randomType = types[Math.floor(Math.random() * types.length)];
            const objectData = this.objectTypes[randomType];
            
            const object = {
                x: Math.random() * (this.canvas.width - objectData.size) + objectData.size / 2,
                y: -objectData.size,
                width: objectData.size,
                height: objectData.size,
                type: randomType,
                emoji: objectData.emoji,
                speed: this.currentSpeed + Math.random() * 2,
                harmful: objectData.harmful,
                points: objectData.points
            };
            
            this.objects.push(object);
        }
    }
    
    /**
     * Update all falling objects
     */
    updateObjects(deltaTime) {
        for (let i = this.objects.length - 1; i >= 0; i--) {
            const object = this.objects[i];
            object.y += object.speed;
            
            // Remove objects that have fallen off screen
            if (object.y > this.canvas.height + object.height) {
                this.objects.splice(i, 1);
            }
        }
    }
    
    /**
     * Update particle effects
     */
    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= deltaTime;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    /**
     * Check collisions between player and objects
     */
    checkCollisions() {
        for (let i = this.objects.length - 1; i >= 0; i--) {
            const object = this.objects[i];
            
            if (this.isColliding(this.player, object)) {
                if (object.harmful) {
                    // Game over on collision with harmful objects
                    this.gameOver();
                    return;
                } else {
                    // Collect star
                    this.score += object.points;
                    this.createCollectionParticles(object.x, object.y);
                    this.objects.splice(i, 1);
                }
            }
        }
    }
    
    /**
     * Check if two objects are colliding
     */
    isColliding(obj1, obj2) {
        const distance = Math.sqrt(
            Math.pow(obj1.x - obj2.x, 2) + Math.pow(obj1.y - obj2.y, 2)
        );
        return distance < (obj1.width + obj2.width) / 3; // Adjusted for better gameplay
    }
    
    /**
     * Create explosion particles
     */
    createExplosion(x, y) {
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 1000,
                color: `hsl(${Math.random() * 60}, 100%, 50%)`
            });
        }
    }
    
    /**
     * Create collection particles when collecting stars
     */
    createCollectionParticles(x, y) {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                life: 500,
                color: '#FFD700'
            });
        }
    }
    
    /**
     * Create particles for difficulty increase feedback
     */
    createDifficultyParticles() {
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                life: 800,
                color: '#4a90e2'
            });
        }
    }
    
    /**
     * Render the game
     */
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.gameState === 'playing' || this.gameState === 'gameOver') {
            // Draw stars background
            this.drawStarField();
            
            // Draw falling objects
            this.drawObjects();
            
            // Draw player
            this.drawPlayer();
            
            // Draw particles
            this.drawParticles();
        }
    }
    
    /**
     * Draw animated star field background
     */
    drawStarField() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 50; i++) {
            const x = (i * 137.5 + this.gameTime * 0.01) % this.canvas.width;
            const y = (i * 73.3 + this.gameTime * 0.02) % this.canvas.height;
            this.ctx.fillRect(x, y, 1, 1);
        }
    }
    
    /**
     * Draw all falling objects
     */
    drawObjects() {
        this.objects.forEach(object => {
            this.ctx.font = `${object.width}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(object.emoji, object.x, object.y);
        });
    }
    
    /**
     * Draw the player rocket
     */
    drawPlayer() {
        if (this.gameState === 'gameOver') return;
        
        this.ctx.font = `${this.player.width}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(this.player.emoji, this.player.x, this.player.y);
        
        // Draw thruster effect
        this.ctx.fillStyle = `rgba(255, 100, 0, ${0.5 + Math.sin(this.gameTime * 0.01) * 0.3})`;
        this.ctx.fillRect(this.player.x - 5, this.player.y + 20, 10, 15);
    }
    
    /**
     * Draw particle effects
     */
    drawParticles() {
        this.particles.forEach(particle => {
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.life / 1000;
            this.ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4);
        });
        this.ctx.globalAlpha = 1;
    }
    
    /**
     * Update UI elements
     */
    updateUI() {
        document.getElementById('score').textContent = `Score: ${this.score}`;
        document.getElementById('timer').textContent = `Time: ${Math.floor(this.gameTime / 1000)}s`;
    }
    
    /**
     * Main game loop
     */
    gameLoop(currentTime = 0) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Update game logic
        this.update(deltaTime);
        
        // Render game
        this.render();
        
        // Continue the loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// Error handling wrapper
try {
    // Initialize the game when the page loads
    window.addEventListener('load', () => {
        new GalaxyDefender();
    });
} catch (error) {
    console.error('Failed to initialize Galaxy Defender:', error);
    alert('Sorry, there was an error loading the game. Please refresh the page and try again.');
}

// Handle window resize
window.addEventListener('resize', () => {
    // Adjust canvas size if needed for responsive design
    const canvas = document.getElementById('gameCanvas');
    if (canvas && window.innerWidth < 900) {
        const container = canvas.parentElement;
        const containerWidth = container.clientWidth * 0.9;
        const containerHeight = containerWidth * 0.75; // 4:3 aspect ratio
        
        if (containerHeight <= window.innerHeight * 0.8) {
            canvas.style.width = containerWidth + 'px';
            canvas.style.height = containerHeight + 'px';
        }
    }
});