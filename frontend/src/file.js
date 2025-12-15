// File: game.js
/**
 * Galaxy Defender - Space Object Avoidance Game
 * A vertical scrolling space game where players pilot a rocket to avoid asteroids and collect stars
 */

class GalaxyDefender {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.gameState = 'start'; // 'start', 'playing', 'gameOver'
        this.score = 0;
        this.gameTime = 0;
        this.lastTime = 0;
        
        // Game speed and difficulty
        this.baseSpeed = 2;
        this.currentSpeed = this.baseSpeed;
        this.speedMultiplier = 1.0;
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
        this.particles = [];
        
        // Object spawn timing
        this.lastObjectSpawn = 0;
        this.objectSpawnRate = 1000; // milliseconds
        
        // Object types configuration
        this.objectTypes = {
            star: { emoji: '⭐', points: 50, harmful: false, weight: 0.4 },
            asteroid: { emoji: '☄️', points: 0, harmful: true, weight: 0.35 },
            ufo: { emoji: '🛸', points: 0, harmful: true, weight: 0.25 }
        };
        
        // Mouse tracking
        this.mouseX = this.canvas.width / 2;
        
        // DOM elements
        this.scoreElement = document.getElementById('score');
        this.timeElement = document.getElementById('time');
        this.speedElement = document.getElementById('speed');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.startScreen = document.getElementById('startScreen');
        this.finalScoreElement = document.getElementById('finalScore');
        this.survivalTimeElement = document.getElementById('survivalTime');
        this.restartButton = document.getElementById('restartButton');
        this.startButton = document.getElementById('startButton');
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupCanvas();
        this.gameLoop();
    }
    
    setupEventListeners() {
        // Mouse movement for player control
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.gameState === 'playing') {
                const rect = this.canvas.getBoundingClientRect();
                this.mouseX = e.clientX - rect.left;
                
                // Keep player within canvas bounds
                this.mouseX = Math.max(this.player.width / 2, 
                    Math.min(this.canvas.width - this.player.width / 2, this.mouseX));
            }
        });
        
        // Game control buttons
        this.startButton.addEventListener('click', () => this.startGame());
        this.restartButton.addEventListener('click', () => this.restartGame());
        
        // Keyboard controls for accessibility
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                if (this.gameState === 'start') {
                    this.startGame();
                } else if (this.gameState === 'gameOver') {
                    this.restartGame();
                }
            }
        });
        
        // Prevent context menu on right click
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    setupCanvas() {
        // Set canvas size for crisp rendering
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        
        // Configure canvas context
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
    }
    
    startGame() {
        this.gameState = 'playing';
        this.startScreen.classList.add('hidden');
        this.resetGameState();
    }
    
    restartGame() {
        this.gameState = 'playing';
        this.gameOverScreen.classList.add('hidden');
        this.resetGameState();
    }
    
    resetGameState() {
        this.score = 0;
        this.gameTime = 0;
        this.currentSpeed = this.baseSpeed;
        this.speedMultiplier = 1.0;
        this.lastSpeedIncrease = 0;
        this.lastObjectSpawn = 0;
        this.objects = [];
        this.particles = [];
        
        // Reset player position
        this.player.x = this.canvas.width / 2;
        this.mouseX = this.canvas.width / 2;
        
        this.updateUI();
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
        this.gameTime += deltaTime;
        
        // Update difficulty every 10 seconds
        if (this.gameTime - this.lastSpeedIncrease >= 10000) {
            this.increaseDifficulty();
            this.lastSpeedIncrease = this.gameTime;
        }
        
        // Update player position (follows mouse horizontally)
        this.player.x += (this.mouseX - this.player.x) * 0.1;
        
        // Spawn objects
        if (this.gameTime - this.lastObjectSpawn >= this.objectSpawnRate / this.speedMultiplier) {
            this.spawnObject();
            this.lastObjectSpawn = this.gameTime;
        }
        
        // Update objects
        this.updateObjects(deltaTime);
        
        // Update particles
        this.updateParticles(deltaTime);
        
        // Check collisions
        this.checkCollisions();
        
        // Update UI
        this.updateUI();
    }
    
    increaseDifficulty() {
        this.speedMultiplier += 0.2;
        this.currentSpeed = this.baseSpeed * this.speedMultiplier;
        
        // Slightly increase spawn rate
        this.objectSpawnRate = Math.max(500, this.objectSpawnRate - 50);
        
        // Create visual feedback for difficulty increase
        this.createSpeedUpEffect();
    }
    
    createSpeedUpEffect() {
        // Create particles to indicate speed increase
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 1000,
                maxLife: 1000,
                color: `hsl(${Math.random() * 60 + 180}, 100%, 70%)`,
                size: Math.random() * 3 + 2
            });
        }
    }
    
    spawnObject() {
        // Weighted random selection of object type
        const rand = Math.random();
        let cumulativeWeight = 0;
        let selectedType = 'star';
        
        for (const [type, config] of Object.entries(this.objectTypes)) {
            cumulativeWeight += config.weight;
            if (rand <= cumulativeWeight) {
                selectedType = type;
                break;
            }
        }
        
        const object = {
            x: Math.random() * (this.canvas.width - 40) + 20,
            y: -40,
            width: 35,
            height: 35,
            type: selectedType,
            emoji: this.objectTypes[selectedType].emoji,
            speed: this.currentSpeed + Math.random() * 2,
            rotation: 0,
            rotationSpeed: (Math.random() - 0.5) * 0.1
        };
        
        this.objects.push(object);
    }
    
    updateObjects(deltaTime) {
        for (let i = this.objects.length - 1; i >= 0; i--) {
            const obj = this.objects[i];
            
            // Move object down
            obj.y += obj.speed;
            obj.rotation += obj.rotationSpeed;
            
            // Remove objects that are off-screen
            if (obj.y > this.canvas.height + 50) {
                this.objects.splice(i, 1);
            }
        }
    }
    
    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= deltaTime;
            
            // Fade out particles
            particle.alpha = particle.life / particle.maxLife;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    checkCollisions() {
        for (let i = this.objects.length - 1; i >= 0; i--) {
            const obj = this.objects[i];
            
            // Simple circular collision detection
            const dx = this.player.x - obj.x;
            const dy = this.player.y - obj.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = (this.player.width + obj.width) / 2 - 5; // Slightly more forgiving
            
            if (distance < minDistance) {
                this.handleCollision(obj, i);
            }
        }
    }
    
    handleCollision(obj, index) {
        const objConfig = this.objectTypes[obj.type];
        
        if (objConfig.harmful) {
            // Game over on collision with harmful objects
            this.gameOver();
        } else {
            // Collect beneficial objects
            this.score += objConfig.points;
            this.createCollectionEffect(obj.x, obj.y);
            this.objects.splice(index, 1);
        }
    }
    
    createCollectionEffect(x, y) {
        // Create star collection particles
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 800,
                maxLife: 800,
                color: '#FFD700',
                size: Math.random() * 4 + 2
            });
        }
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        this.finalScoreElement.textContent = this.score;
        this.survivalTimeElement.textContent = Math.floor(this.gameTime / 1000);
        this.gameOverScreen.classList.remove('hidden');
        
        // Create explosion effect
        this.createExplosionEffect(this.player.x, this.player.y);
    }
    
    createExplosionEffect(x, y) {
        for (let i = 0; i < 30; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 1500,
                maxLife: 1500,
                color: `hsl(${Math.random() * 60}, 100%, 60%)`,
                size: Math.random() * 6 + 3
            });
        }
    }
    
    updateUI() {
        this.scoreElement.textContent = this.score;
        this.timeElement.textContent = Math.floor(this.gameTime / 1000);
        this.speedElement.textContent = this.speedMultiplier.toFixed(1);
    }
    
    render() {
        // Clear canvas with space background effect
        this.ctx.fillStyle = 'rgba(12, 12, 46, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw starfield background
        this.drawStarfield();
        
        if (this.gameState === 'playing') {
            // Draw game objects
            this.drawObjects();
            this.drawPlayer();
        }
        
        // Draw particles
        this.drawParticles();
    }
    
    drawStarfield() {
        // Simple animated starfield
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        const time = this.gameTime * 0.001;
        
        for (let i = 0; i < 50; i++) {
            const x = (i * 137.5) % this.canvas.width;
            const y = ((i * 73.3 + time * 50) % this.canvas.height);
            const size = (i % 3) + 1;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawPlayer() {
        this.ctx.save();
        this.ctx.translate(this.player.x, this.player.y);
        
        // Add slight hover animation
        const hover = Math.sin(this.gameTime * 0.005) * 2;
        this.ctx.translate(0, hover);
        
        // Draw player rocket
        this.ctx.font = `${this.player.width}px Arial`;
        this.ctx.fillText(this.player.emoji, 0, 0);
        
        this.ctx.restore();
    }
    
    drawObjects() {
        this.objects.forEach(obj => {
            this.ctx.save();
            this.ctx.translate(obj.x, obj.y);
            this.ctx.rotate(obj.rotation);
            
            this.ctx.font = `${obj.width}px Arial`;
            this.ctx.fillText(obj.emoji, 0, 0);
            
            this.ctx.restore();
        });
    }
    
    drawParticles() {
        this.particles.forEach(particle => {
            this.ctx.save();
            this.ctx.globalAlpha = particle.alpha || 1;
            this.ctx.fillStyle = particle.color;
            
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.restore();
        });
    }
}

// Error handling wrapper
try {
    // Initialize game when DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            new GalaxyDefender();
        });
    } else {
        new GalaxyDefender();
    }
} catch (error) {
    console.error('Failed to initialize Galaxy Defender:', error);
    
    // Display error message to user
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 0, 0, 0.9);
        color: white;
        padding: 20px;
        border-radius: 10px;
        text-align: center;
        z-index: 1000;
    `;
    errorDiv.innerHTML = `
        <h3>Game Error</h3>
        <p>Failed to load Galaxy Defender. Please refresh the page.</p>
        <button onclick="location.reload()" style="margin-top: 10px; padding: 5px 15px;">Refresh</button>
    `;
    document.body.appendChild(errorDiv);
}