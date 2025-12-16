/**
 * Galaxy Defender - Space Object Avoidance Game
 * A space-themed game where players pilot a rocket to dodge asteroids and collect stars
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
        this.baseSpeed = 2;
        this.currentSpeed = this.baseSpeed;
        this.speedIncreaseInterval = 10000; // 10 seconds in milliseconds
        this.lastSpeedIncrease = 0;
        this.difficultyMultiplier = 1;
        
        // Player setup
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
        this.objectSpawnRate = 0.02; // Base spawn rate
        this.objectTypes = [
            { emoji: '☄️', type: 'bad', weight: 0.4 },
            { emoji: '🛸', type: 'bad', weight: 0.3 },
            { emoji: '⭐', type: 'good', weight: 0.3 }
        ];
        
        // UI elements
        this.scoreElement = document.getElementById('score');
        this.timeElement = document.getElementById('time');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.startScreen = document.getElementById('startScreen');
        this.finalScoreElement = document.getElementById('finalScore');
        this.finalTimeElement = document.getElementById('finalTime');
        
        // Initialize game
        this.init();
    }
    
    init() {
        // Event listeners
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        
        // Prevent context menu on right click
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
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
    
    startGame() {
        this.gameState = 'playing';
        this.startScreen.classList.add('hidden');
        this.resetGame();
    }
    
    restartGame() {
        this.gameState = 'playing';
        this.gameOverScreen.classList.add('hidden');
        this.resetGame();
    }
    
    resetGame() {
        // Reset all game variables
        this.score = 0;
        this.gameTime = 0;
        this.lastTime = 0;
        this.lastSpeedIncrease = 0;
        this.currentSpeed = this.baseSpeed;
        this.difficultyMultiplier = 1;
        this.objectSpawnRate = 0.02;
        
        // Reset player position
        this.player.x = this.canvas.width / 2;
        this.player.y = this.canvas.height - 80;
        
        // Clear all objects
        this.objects = [];
        
        // Update UI
        this.updateUI();
    }
    
    updatePlayer() {
        if (this.gameState !== 'playing') return;
        
        // Smooth horizontal movement following mouse
        const targetX = this.mouseX;
        const dx = targetX - this.player.x;
        this.player.x += dx * 0.15; // Smooth interpolation
        
        // Ensure player stays within canvas bounds
        this.player.x = Math.max(this.player.width / 2, 
                                Math.min(this.canvas.width - this.player.width / 2, this.player.x));
    }
    
    spawnObject() {
        if (this.gameState !== 'playing') return;
        
        // Adjust spawn rate based on difficulty
        const adjustedSpawnRate = this.objectSpawnRate * this.difficultyMultiplier;
        
        if (Math.random() < adjustedSpawnRate) {
            // Select object type based on weighted probability
            const rand = Math.random();
            let cumulativeWeight = 0;
            let selectedType = this.objectTypes[0];
            
            for (const type of this.objectTypes) {
                cumulativeWeight += type.weight;
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
                speed: this.currentSpeed + Math.random() * 2,
                emoji: selectedType.emoji,
                type: selectedType.type,
                rotation: Math.random() * Math.PI * 2
            };
            
            this.objects.push(object);
        }
    }
    
    updateObjects() {
        if (this.gameState !== 'playing') return;
        
        for (let i = this.objects.length - 1; i >= 0; i--) {
            const obj = this.objects[i];
            
            // Move object down
            obj.y += obj.speed;
            
            // Add slight rotation for visual effect
            obj.rotation += 0.05;
            
            // Remove objects that are off screen
            if (obj.y > this.canvas.height + 50) {
                this.objects.splice(i, 1);
                continue;
            }
            
            // Check collision with player
            if (this.checkCollision(this.player, obj)) {
                if (obj.type === 'good') {
                    // Collect star - add points
                    this.score += 50;
                    this.objects.splice(i, 1);
                    this.createParticleEffect(obj.x, obj.y, '#FFD700');
                } else {
                    // Hit asteroid or UFO - game over
                    this.gameOver();
                    return;
                }
            }
        }
    }
    
    checkCollision(rect1, rect2) {
        // Simple bounding box collision detection with some padding for better gameplay
        const padding = 5;
        return rect1.x - rect1.width/2 + padding < rect2.x + rect2.width/2 - padding &&
               rect1.x + rect1.width/2 - padding > rect2.x - rect2.width/2 + padding &&
               rect1.y - rect1.height/2 + padding < rect2.y + rect2.height/2 - padding &&
               rect1.y + rect1.height/2 - padding > rect2.y - rect2.height/2 + padding;
    }
    
    createParticleEffect(x, y, color) {
        // Simple particle effect for star collection
        // This could be expanded with a proper particle system
        const particles = [];
        for (let i = 0; i < 8; i++) {
            particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 30,
                color: color
            });
        }
        
        // Animate particles (simplified)
        const animateParticles = () => {
            this.ctx.save();
            particles.forEach((particle, index) => {
                if (particle.life <= 0) {
                    particles.splice(index, 1);
                    return;
                }
                
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.life--;
                
                this.ctx.globalAlpha = particle.life / 30;
                this.ctx.fillStyle = particle.color;
                this.ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4);
            });
            this.ctx.restore();
            
            if (particles.length > 0) {
                requestAnimationFrame(animateParticles);
            }
        };
        
        animateParticles();
    }
    
    updateDifficulty(currentTime) {
        if (this.gameState !== 'playing') return;
        
        // Increase difficulty every 10 seconds
        if (currentTime - this.lastSpeedIncrease >= this.speedIncreaseInterval) {
            this.lastSpeedIncrease = currentTime;
            this.difficultyMultiplier += 0.2;
            this.currentSpeed += 0.5;
            this.objectSpawnRate += 0.005;
            
            // Visual feedback for difficulty increase
            this.showDifficultyIncrease();
        }
    }
    
    showDifficultyIncrease() {
        // Flash effect to indicate difficulty increase
        this.canvas.style.boxShadow = '0 0 50px rgba(255, 0, 0, 0.8)';
        setTimeout(() => {
            this.canvas.style.boxShadow = '0 0 30px rgba(255, 255, 255, 0.2)';
        }, 200);
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
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.gameState === 'playing') {
            // Draw player
            this.drawEmoji(this.player.emoji, this.player.x, this.player.y, this.player.width);
            
            // Draw objects
            this.objects.forEach(obj => {
                this.ctx.save();
                this.ctx.translate(obj.x, obj.y);
                this.ctx.rotate(obj.rotation);
                this.drawEmoji(obj.emoji, 0, 0, obj.width);
                this.ctx.restore();
            });
            
            // Draw speed indicator
            this.drawSpeedIndicator();
        }
    }
    
    drawEmoji(emoji, x, y, size) {
        this.ctx.font = `${size}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(emoji, x, y);
    }
    
    drawSpeedIndicator() {
        // Draw a small speed/difficulty indicator
        const level = Math.floor(this.difficultyMultiplier);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Level: ${level}`, 10, 30);
        
        // Speed bar
        const barWidth = 100;
        const barHeight = 8;
        const speedPercent = Math.min((this.currentSpeed - this.baseSpeed) / 5, 1);
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(10, 40, barWidth, barHeight);
        
        this.ctx.fillStyle = `hsl(${120 - speedPercent * 120}, 100%, 50%)`;
        this.ctx.fillRect(10, 40, barWidth * speedPercent, barHeight);
    }
    
    gameLoop(currentTime = 0) {
        // Calculate delta time
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        if (this.gameState === 'playing') {
            // Update game time
            this.gameTime += deltaTime;
            
            // Update game systems
            this.updatePlayer();
            this.spawnObject();
            this.updateObjects();
            this.updateDifficulty(this.gameTime);
            this.updateUI();
        }
        
        // Render game
        this.render();
        
        // Continue game loop
        requestAnimationFrame((time) => this.gameLoop(time));
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
    
    // Show error message to user
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
        font-family: Arial, sans-serif;
        text-align: center;
        z-index: 9999;
    `;
    errorDiv.innerHTML = `
        <h3>Game Loading Error</h3>
        <p>Sorry, there was an error loading the game.</p>
        <p>Please refresh the page to try again.</p>
        <button onclick="location.reload()" style="
            background: white;
            color: red;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin-top: 10px;
        ">Refresh Page</button>
    `;
    document.body.appendChild(errorDiv);
}