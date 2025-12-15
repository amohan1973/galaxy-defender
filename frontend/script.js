/**
 * Galaxy Defender - Space Object Avoidance Game
 * A space-themed game where players pilot a rocket to dodge asteroids and UFOs while collecting stars
 * Features optimized object pooling for better performance
 */

class ObjectPool {
    constructor(createFn, resetFn, initialSize = 50) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.pool = [];
        this.active = [];
        
        // Pre-populate pool
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.createFn());
        }
    }
    
    get() {
        let obj;
        if (this.pool.length > 0) {
            obj = this.pool.pop();
        } else {
            obj = this.createFn();
        }
        this.active.push(obj);
        return obj;
    }
    
    release(obj) {
        const index = this.active.indexOf(obj);
        if (index > -1) {
            this.active.splice(index, 1);
            this.resetFn(obj);
            this.pool.push(obj);
        }
    }
    
    releaseAll() {
        while (this.active.length > 0) {
            this.release(this.active[0]);
        }
    }
    
    getActiveCount() {
        return this.active.length;
    }
}

class GalaxyDefender {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
        
        // Game state
        this.gameState = 'menu'; // 'menu', 'playing', 'gameOver'
        this.score = 0;
        this.highScore = localStorage.getItem('galaxyDefenderHighScore') || 0;
        this.startTime = 0;
        this.currentTime = 0;
        this.level = 1;
        
        // Player properties
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 80,
            width: 40,
            height: 40,
            emoji: '🚀'
        };
        
        // Mouse tracking
        this.mouseX = this.canvas.width / 2;
        
        // Game mechanics
        this.baseSpeed = 3;
        this.currentSpeed = this.baseSpeed;
        this.spawnRate = 0.02;
        this.lastDifficultyIncrease = 0;
        this.difficultyInterval = 10000; // 10 seconds in milliseconds
        
        // Object types with their properties
        this.objectTypes = {
            star: { emoji: '⭐', points: 50, dangerous: false, weight: 0.4 },
            asteroid: { emoji: '☄️', points: 0, dangerous: true, weight: 0.35 },
            ufo: { emoji: '🛸', points: 0, dangerous: true, weight: 0.25 }
        };
        
        // Initialize object pools for better performance
        this.initializeObjectPools();
        
        this.setupEventListeners();
        this.updateUI();
        
        // Start the game loop
        this.gameLoop();
    }
    
    initializeObjectPools() {
        // Object pool for game objects
        this.objectPool = new ObjectPool(
            () => ({
                x: 0,
                y: 0,
                width: 35,
                height: 35,
                type: 'star',
                emoji: '⭐',
                speed: 3,
                rotation: 0,
                rotationSpeed: 0,
                active: false
            }),
            (obj) => {
                obj.active = false;
                obj.x = 0;
                obj.y = 0;
                obj.rotation = 0;
                obj.rotationSpeed = 0;
            },
            100 // Initial pool size
        );
        
        // Particle pool for visual effects
        this.particlePool = new ObjectPool(
            () => ({
                x: 0,
                y: 0,
                vx: 0,
                vy: 0,
                life: 1,
                decay: 0.02,
                color: '#FFFFFF',
                size: 2,
                active: false
            }),
            (particle) => {
                particle.active = false;
                particle.life = 1;
                particle.x = 0;
                particle.y = 0;
                particle.vx = 0;
                particle.vy = 0;
            },
            200 // Initial pool size for particles
        );
    }
    
    setupCanvas() {
        // Set canvas size based on window size, with maximum dimensions
        const maxWidth = 800;
        const maxHeight = 600;
        const padding = 40;
        
        const availableWidth = window.innerWidth - padding;
        const availableHeight = window.innerHeight - padding;
        
        this.canvas.width = Math.min(maxWidth, availableWidth);
        this.canvas.height = Math.min(maxHeight, availableHeight);
        
        // Set canvas style for crisp rendering
        this.ctx.imageSmoothingEnabled = false;
    }
    
    setupEventListeners() {
        // Mouse movement for player control
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.gameState === 'playing') {
                const rect = this.canvas.getBoundingClientRect();
                this.mouseX = e.clientX - rect.left;
            }
        });
        
        // Touch support for mobile devices
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.gameState === 'playing') {
                const rect = this.canvas.getBoundingClientRect();
                const touch = e.touches[0];
                this.mouseX = touch.clientX - rect.left;
            }
        });
        
        // Prevent context menu on right click
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Window resize handler
        window.addEventListener('resize', () => {
            if (this.gameState === 'menu') {
                this.setupCanvas();
            }
        });
    }
    
    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.level = 1;
        this.startTime = Date.now();
        this.lastDifficultyIncrease = 0;
        this.currentSpeed = this.baseSpeed;
        this.spawnRate = 0.02;
        
        // Reset player position
        this.player.x = this.canvas.width / 2;
        this.player.y = this.canvas.height - 80;
        
        // Clear all pooled objects
        this.objectPool.releaseAll();
        this.particlePool.releaseAll();
        
        // Hide start screen
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
        
        this.updateUI();
    }
    
    restartGame() {
        this.startGame();
    }
    
    showStartScreen() {
        this.gameState = 'menu';
        document.getElementById('startScreen').classList.remove('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        
        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('galaxyDefenderHighScore', this.highScore);
        }
        
        // Show game over screen with stats
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalTime').textContent = Math.floor((this.currentTime - this.startTime) / 1000);
        document.getElementById('finalLevel').textContent = this.level;
        document.getElementById('highScore').textContent = this.highScore;
        document.getElementById('gameOverScreen').classList.remove('hidden');
        
        // Create explosion particles at player position
        this.createExplosion(this.player.x, this.player.y);
    }
    
    updatePlayer() {
        if (this.gameState !== 'playing') return;
        
        // Smooth movement towards mouse position
        const targetX = this.mouseX;
        const dx = targetX - this.player.x;
        this.player.x += dx * 0.1;
        
        // Keep player within canvas bounds
        const halfWidth = this.player.width / 2;
        this.player.x = Math.max(halfWidth, Math.min(this.canvas.width - halfWidth, this.player.x));
    }
    
    spawnObject() {
        if (this.gameState !== 'playing') return;
        
        // Adjust spawn rate based on level
        const adjustedSpawnRate = this.spawnRate * (1 + this.level * 0.1);
        
        if (Math.random() < adjustedSpawnRate) {
            // Choose object type based on weighted probabilities
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
            
            // Get object from pool instead of creating new one
            const object = this.objectPool.get();
            object.x = Math.random() * (this.canvas.width - 40) + 20;
            object.y = -40;
            object.type = selectedType;
            object.emoji = this.objectTypes[selectedType].emoji;
            object.speed = this.currentSpeed + Math.random() * 2;
            object.rotation = 0;
            object.rotationSpeed = (Math.random() - 0.5) * 0.2;
            object.active = true;
        }
    }
    
    updateObjects() {
        if (this.gameState !== 'playing') return;
        
        const activeObjects = [...this.objectPool.active];
        
        for (let i = activeObjects.length - 1; i >= 0; i--) {
            const obj = activeObjects[i];
            if (!obj.active) continue;
            
            // Move object down
            obj.y += obj.speed;
            obj.rotation += obj.rotationSpeed;
            
            // Remove objects that are off-screen
            if (obj.y > this.canvas.height + 50) {
                this.objectPool.release(obj);
                continue;
            }
            
            // Check collision with player
            if (this.checkCollision(this.player, obj)) {
                if (this.objectTypes[obj.type].dangerous) {
                    // Game over on collision with dangerous objects
                    this.gameOver();
                    return;
                } else {
                    // Collect good objects (stars)
                    this.score += this.objectTypes[obj.type].points;
                    this.createCollectParticles(obj.x, obj.y);
                    this.objectPool.release(obj);
                    this.updateUI();
                }
            }
        }
    }
    
    checkCollision(rect1, rect2) {
        // Simple rectangular collision detection with some padding for better gameplay
        const padding = 5;
        return rect1.x - rect1.width/2 + padding < rect2.x + rect2.width/2 - padding &&
               rect1.x + rect1.width/2 - padding > rect2.x - rect2.width/2 + padding &&
               rect1.y - rect1.height/2 + padding < rect2.y + rect2.height/2 - padding &&
               rect1.y + rect1.height/2 - padding > rect2.y - rect2.height/2 + padding;
    }
    
    updateDifficulty() {
        if (this.gameState !== 'playing') return;
        
        const elapsedTime = this.currentTime - this.startTime;
        const difficultyIncreases = Math.floor(elapsedTime / this.difficultyInterval);
        
        if (difficultyIncreases > this.lastDifficultyIncrease) {
            this.lastDifficultyIncrease = difficultyIncreases;
            this.level = difficultyIncreases + 1;
            
            // Increase speed and spawn rate
            this.currentSpeed = this.baseSpeed + difficultyIncreases * 0.5;
            this.spawnRate = Math.min(0.05, 0.02 + difficultyIncreases * 0.005);
            
            this.updateUI();
            
            // Visual feedback for level up
            this.createLevelUpEffect();
        }
    }
    
    createExplosion(x, y) {
        for (let i = 0; i < 15; i++) {
            const particle = this.particlePool.get();
            particle.x = x;
            particle.y = y;
            particle.vx = (Math.random() - 0.5) * 10;
            particle.vy = (Math.random() - 0.5) * 10;
            particle.life = 1;
            particle.decay = 0.02;
            particle.color = `hsl(${Math.random() * 60}, 100%, 50%)`;
            particle.size = Math.random() * 4 + 2;
            particle.active = true;
        }
    }
    
    createCollectParticles(x, y) {
        for (let i = 0; i < 8; i++) {
            const particle = this.particlePool.get();
            particle.x = x;
            particle.y = y;
            particle.vx = (Math.random() - 0.5) * 6;
            particle.vy = (Math.random() - 0.5) * 6;
            particle.life = 1;
            particle.decay = 0.03;
            particle.color = '#FFD700';
            particle.size = Math.random() * 3 + 1;
            particle.active = true;
        }
    }
    
    createLevelUpEffect() {
        for (let i = 0; i < 20; i++) {
            const particle = this.particlePool.get();
            particle.x = this.canvas.width / 2;
            particle.y = this.canvas.height / 2;
            particle.vx = (Math.random() - 0.5) * 8;
            particle.vy = (Math.random() - 0.5) * 8;
            particle.life = 1;
            particle.decay = 0.015;
            particle.color = `hsl(${180 + Math.random() * 60}, 100%, 70%)`;
            particle.size = Math.random() * 5 + 3;
            particle.active = true;
        }
    }
    
    updateParticles() {
        const activeParticles = [...this.particlePool.active];
        
        for (let i = activeParticles.length - 1; i >= 0; i--) {
            const particle = activeParticles[i];
            if (!particle.active) continue;
            
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= particle.decay;
            particle.vx *= 0.98;
            particle.vy *= 0.98;
            
            if (particle.life <= 0) {
                this.particlePool.release(particle);
            }
        }
    }
    
    render() {
        // Clear canvas with space background
        this.ctx.fillStyle = 'rgba(12, 12, 46, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw stars background
        this.drawStarfield();
        
        if (this.gameState === 'playing') {
            // Draw player
            this.drawEmoji(this.player.emoji, this.player.x, this.player.y, this.player.width);
            
            // Draw active objects from pool
            this.objectPool.active.forEach(obj => {
                if (obj.active) {
                    this.ctx.save();
                    this.ctx.translate(obj.x, obj.y);
                    this.ctx.rotate(obj.rotation);
                    this.drawEmoji(obj.emoji, 0, 0, obj.width);
                    this.ctx.restore();
                }
            });
        }
        
        // Draw active particles from pool
        this.particlePool.active.forEach(particle => {
            if (particle.active) {
                this.ctx.save();
                this.ctx.globalAlpha = particle.life;
                this.ctx.fillStyle = particle.color;
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
            }
        });
    }
    
    drawStarfield() {
        // Simple animated starfield background
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 50; i++) {
            const x = (i * 37) % this.canvas.width;
            const y = (i * 47 + this.currentTime * 0.1) % this.canvas.height;
            const size = (i % 3) + 1;
            this.ctx.fillRect(x, y, size, size);
        }
    }
    
    drawEmoji(emoji, x, y, size) {
        this.ctx.font = `${size}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(emoji, x, y);
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        
        if (this.gameState === 'playing') {
            const elapsedSeconds = Math.floor((this.currentTime - this.startTime) / 1000);
            document.getElementById('time').textContent = elapsedSeconds;
        }
    }
    
    // Performance monitoring method
    getPerformanceStats() {
        return {
            activeObjects: this.objectPool.getActiveCount(),
            pooledObjects: this.objectPool.pool.length,
            activeParticles: this.particlePool.getActiveCount(),
            pooledParticles: this.particlePool.pool.length,
            totalObjectsInMemory: this.objectPool.getActiveCount() + this.objectPool.pool.length,
            totalParticlesInMemory: this.particlePool.getActiveCount() + this.particlePool.pool.length
        };
    }
    
    gameLoop() {
        this.currentTime = Date.now();
        
        if (this.gameState === 'playing') {
            this.updatePlayer();
            this.spawnObject();
            this.updateObjects();
            this.updateDifficulty();
            this.updateParticles();
        } else {
            // Update particles even in menu/game over for visual effects
            this.updateParticles();
        }
        
        this.render();
        this.updateUI();
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Global functions for button handlers
function startGame() {
    if (window.game) {
        window.game.startGame();
    }
}

function restartGame() {
    if (window.game) {
        window.game.restartGame();
    }
}

function showStartScreen() {
    if (window.game) {
        window.game.showStartScreen();
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    try {
        window.game = new GalaxyDefender();
        console.log('Galaxy Defender initialized successfully');
        
        // Optional: Log performance stats periodically in development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            setInterval(() => {
                console.log('Performance Stats:', window.game.getPerformanceStats());
            }, 5000);
        }
    } catch (error) {
        console.error('Failed to initialize Galaxy Defender:', error);
        alert('Failed to load the game. Please refresh the page and try again.');
    }
});

// Handle page visibility changes to pause/resume game
document.addEventListener('visibilitychange', () => {
    if (window.game && window.game.gameState === 'playing') {
        if (document.hidden) {
            // Game is hidden, could implement pause here
            console.log('Game paused (tab hidden)');
        } else {
            // Game is visible again
            console.log('Game resumed (tab visible)');
            window.game.startTime += Date.now() - window.game.currentTime;
        }
    }
});