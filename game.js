/**
 * Galaxy Defender - Space Avoidance Game
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
        this.spawnRate = 0.02;
        this.difficultyIncreaseInterval = 10000; // 10 seconds in milliseconds
        this.lastDifficultyIncrease = 0;
        
        // Player settings
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
            star: { emoji: '⭐', points: 50, dangerous: false, size: 30 },
            asteroid: { emoji: '☄️', points: 0, dangerous: true, size: 35 },
            ufo: { emoji: '🛸', points: 0, dangerous: true, size: 40 }
        };
        
        // Initialize game
        this.init();
    }
    
    init() {
        // Set up event listeners
        this.setupEventListeners();
        
        // Set canvas font for emojis
        this.ctx.font = '30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Start game loop
        this.gameLoop();
    }
    
    setupEventListeners() {
        // Mouse movement for player control
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
        });
        
        // Start button
        document.getElementById('startButton').addEventListener('click', () => {
            this.startGame();
        });
        
        // Restart button
        document.getElementById('restartButton').addEventListener('click', () => {
            this.restartGame();
        });
        
        // Keyboard controls for restart
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.gameState === 'gameOver') {
                this.restartGame();
            }
        });
    }
    
    startGame() {
        this.gameState = 'playing';
        document.getElementById('startScreen').classList.add('hidden');
        this.resetGame();
    }
    
    restartGame() {
        this.gameState = 'playing';
        document.getElementById('gameOverScreen').classList.add('hidden');
        this.resetGame();
    }
    
    resetGame() {
        this.score = 0;
        this.gameTime = 0;
        this.currentSpeed = this.baseSpeed;
        this.lastDifficultyIncrease = 0;
        this.objects = [];
        this.particles = [];
        this.player.x = this.canvas.width / 2;
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
        // Update game time
        this.gameTime += deltaTime;
        
        // Update difficulty every 10 seconds
        if (this.gameTime - this.lastDifficultyIncrease >= this.difficultyIncreaseInterval) {
            this.increaseDifficulty();
            this.lastDifficultyIncrease = this.gameTime;
        }
        
        // Update player position (follow mouse horizontally)
        this.updatePlayer();
        
        // Spawn new objects
        this.spawnObjects();
        
        // Update objects
        this.updateObjects();
        
        // Update particles
        this.updateParticles();
        
        // Check collisions
        this.checkCollisions();
        
        // Update UI
        this.updateUI();
    }
    
    updatePlayer() {
        // Smooth movement towards mouse position
        const targetX = Math.max(this.player.width / 2, 
                        Math.min(this.canvas.width - this.player.width / 2, this.mouseX));
        
        const moveSpeed = 0.15;
        this.player.x += (targetX - this.player.x) * moveSpeed;
    }
    
    spawnObjects() {
        if (Math.random() < this.spawnRate) {
            const types = Object.keys(this.objectTypes);
            const randomType = types[Math.floor(Math.random() * types.length)];
            const objectData = this.objectTypes[randomType];
            
            const object = {
                type: randomType,
                x: Math.random() * (this.canvas.width - objectData.size) + objectData.size / 2,
                y: -objectData.size,
                width: objectData.size,
                height: objectData.size,
                speed: this.currentSpeed + Math.random() * 2,
                emoji: objectData.emoji,
                points: objectData.points,
                dangerous: objectData.dangerous
            };
            
            this.objects.push(object);
        }
    }
    
    updateObjects() {
        for (let i = this.objects.length - 1; i >= 0; i--) {
            const obj = this.objects[i];
            obj.y += obj.speed;
            
            // Remove objects that have gone off screen
            if (obj.y > this.canvas.height + obj.height) {
                this.objects.splice(i, 1);
            }
        }
    }
    
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= 1;
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
            const minDistance = (this.player.width + obj.width) / 2 * 0.7; // Slightly smaller for better gameplay
            
            if (distance < minDistance) {
                if (obj.dangerous) {
                    // Game over on collision with dangerous objects
                    this.gameOver();
                    return;
                } else {
                    // Collect star
                    this.score += obj.points;
                    this.createCollectionEffect(obj.x, obj.y);
                    this.objects.splice(i, 1);
                }
            }
        }
    }
    
    createCollectionEffect(x, y) {
        // Create particle effect for collecting stars
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const speed = 2 + Math.random() * 3;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 30,
                maxLife: 30,
                alpha: 1,
                color: '#FFD700'
            });
        }
    }
    
    increaseDifficulty() {
        // Increase speed and spawn rate
        this.currentSpeed += 0.5;
        this.spawnRate = Math.min(0.05, this.spawnRate + 0.005);
        
        // Visual feedback for difficulty increase
        this.createDifficultyEffect();
    }
    
    createDifficultyEffect() {
        // Create screen flash effect
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: 0,
                vy: 0,
                life: 20,
                maxLife: 20,
                alpha: 1,
                color: '#FF0080'
            });
        }
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalTime').textContent = Math.floor(this.gameTime / 1000);
        document.getElementById('gameOverScreen').classList.remove('hidden');
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('time').textContent = Math.floor(this.gameTime / 1000);
    }
    
    render() {
        // Clear canvas with space background
        this.ctx.fillStyle = 'rgba(0, 4, 40, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background stars
        this.drawBackgroundStars();
        
        if (this.gameState === 'playing') {
            // Draw particles
            this.drawParticles();
            
            // Draw objects
            this.drawObjects();
            
            // Draw player
            this.drawPlayer();
        }
    }
    
    drawBackgroundStars() {
        // Draw animated background stars
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        const time = Date.now() * 0.001;
        
        for (let i = 0; i < 50; i++) {
            const x = (i * 37) % this.canvas.width;
            const y = (i * 73 + time * 20) % this.canvas.height;
            const size = 1 + Math.sin(time + i) * 0.5;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawPlayer() {
        this.ctx.font = `${this.player.width}px Arial`;
        this.ctx.fillText(
            this.player.emoji,
            this.player.x,
            this.player.y
        );
        
        // Draw player glow effect
        this.ctx.shadowColor = '#00FFFF';
        this.ctx.shadowBlur = 10;
        this.ctx.fillText(
            this.player.emoji,
            this.player.x,
            this.player.y
        );
        this.ctx.shadowBlur = 0;
    }
    
    drawObjects() {
        this.objects.forEach(obj => {
            this.ctx.font = `${obj.width}px Arial`;
            
            // Add glow effect for different object types
            if (obj.type === 'star') {
                this.ctx.shadowColor = '#FFD700';
                this.ctx.shadowBlur = 15;
            } else if (obj.type === 'asteroid') {
                this.ctx.shadowColor = '#FF4500';
                this.ctx.shadowBlur = 10;
            } else if (obj.type === 'ufo') {
                this.ctx.shadowColor = '#FF00FF';
                this.ctx.shadowBlur = 12;
            }
            
            this.ctx.fillText(obj.emoji, obj.x, obj.y);
            this.ctx.shadowBlur = 0;
        });
    }
    
    drawParticles() {
        this.particles.forEach(particle => {
            this.ctx.save();
            this.ctx.globalAlpha = particle.alpha;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
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
        z-index: 10000;
    `;
    errorDiv.innerHTML = `
        <h2>Game Error</h2>
        <p>Failed to load Galaxy Defender. Please refresh the page.</p>
        <p>Error: ${error.message}</p>
    `;
    document.body.appendChild(errorDiv);
}