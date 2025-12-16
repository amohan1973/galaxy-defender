/**
 * Galaxy Defender - Space Object Avoidance Game
 * A game where players control a rocket to avoid asteroids and UFOs while collecting stars
 */

class GalaxyDefender {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.gameState = 'start'; // 'start', 'playing', 'gameOver'
        this.score = 0;
        this.gameTime = 0;
        this.level = 1;
        this.lastTime = 0;
        
        // Game settings
        this.baseSpeed = 3;
        this.currentSpeed = this.baseSpeed;
        this.speedIncreaseInterval = 10000; // 10 seconds
        this.lastSpeedIncrease = 0;
        
        // Player properties
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 80,
            width: 40,
            height: 40,
            emoji: '🚀'
        };
        
        // Mouse position
        this.mouseX = this.canvas.width / 2;
        
        // Game objects
        this.objects = [];
        this.particles = [];
        
        // Spawn settings
        this.spawnRate = 0.02;
        this.maxObjects = 8;
        
        // Object types
        this.objectTypes = {
            star: { emoji: '⭐', points: 50, harmful: false, weight: 0.4 },
            asteroid: { emoji: '☄️', points: 0, harmful: true, weight: 0.35 },
            ufo: { emoji: '🛸', points: 0, harmful: true, weight: 0.25 }
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateUI();
        this.gameLoop();
    }
    
    setupEventListeners() {
        // Mouse movement for player control
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
        });
        
        // Touch support for mobile
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.touches[0].clientX - rect.left;
        });
        
        // Game control buttons
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restartGame();
        });
        
        // Prevent context menu on right click
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
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
        this.level = 1;
        this.currentSpeed = this.baseSpeed;
        this.lastSpeedIncrease = 0;
        this.objects = [];
        this.particles = [];
        this.player.x = this.canvas.width / 2;
        this.updateUI();
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('time').textContent = Math.floor(this.gameTime / 1000);
        document.getElementById('level').textContent = this.level;
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
        if (this.gameTime - this.lastSpeedIncrease >= this.speedIncreaseInterval) {
            this.increaseDifficulty();
            this.lastSpeedIncrease = this.gameTime;
        }
        
        this.updatePlayer();
        this.spawnObjects();
        this.updateObjects();
        this.updateParticles();
        this.checkCollisions();
        this.updateUI();
    }
    
    increaseDifficulty() {
        this.level++;
        this.currentSpeed += 0.5;
        this.spawnRate = Math.min(this.spawnRate + 0.005, 0.05);
        this.maxObjects = Math.min(this.maxObjects + 1, 12);
        
        // Create visual feedback for level up
        this.createLevelUpEffect();
    }
    
    createLevelUpEffect() {
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: this.canvas.width / 2,
                y: this.canvas.height / 2,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 60,
                maxLife: 60,
                color: `hsl(${Math.random() * 360}, 100%, 50%)`,
                size: Math.random() * 4 + 2
            });
        }
    }
    
    updatePlayer() {
        // Smooth player movement following mouse
        const targetX = Math.max(this.player.width / 2, 
                        Math.min(this.canvas.width - this.player.width / 2, this.mouseX));
        
        this.player.x += (targetX - this.player.x) * 0.15;
    }
    
    spawnObjects() {
        if (this.objects.length < this.maxObjects && Math.random() < this.spawnRate) {
            const type = this.getRandomObjectType();
            const object = {
                x: Math.random() * (this.canvas.width - 40) + 20,
                y: -40,
                width: 35,
                height: 35,
                speed: this.currentSpeed + Math.random() * 2,
                type: type,
                emoji: this.objectTypes[type].emoji,
                rotation: 0,
                rotationSpeed: (Math.random() - 0.5) * 0.2
            };
            this.objects.push(object);
        }
    }
    
    getRandomObjectType() {
        const rand = Math.random();
        let cumulative = 0;
        
        for (const [type, config] of Object.entries(this.objectTypes)) {
            cumulative += config.weight;
            if (rand <= cumulative) {
                return type;
            }
        }
        return 'asteroid'; // fallback
    }
    
    updateObjects() {
        for (let i = this.objects.length - 1; i >= 0; i--) {
            const obj = this.objects[i];
            obj.y += obj.speed;
            obj.rotation += obj.rotationSpeed;
            
            // Remove objects that are off screen
            if (obj.y > this.canvas.height + 50) {
                this.objects.splice(i, 1);
            }
        }
    }
    
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    checkCollisions() {
        for (let i = this.objects.length - 1; i >= 0; i--) {
            const obj = this.objects[i];
            
            if (this.isColliding(this.player, obj)) {
                if (this.objectTypes[obj.type].harmful) {
                    // Game over on collision with harmful objects
                    this.gameOver();
                    return;
                } else {
                    // Collect star
                    this.collectStar(obj);
                    this.objects.splice(i, 1);
                }
            }
        }
    }
    
    isColliding(rect1, rect2) {
        const distance = Math.sqrt(
            Math.pow(rect1.x - rect2.x, 2) + 
            Math.pow(rect1.y - rect2.y, 2)
        );
        return distance < (rect1.width + rect2.width) / 2.5;
    }
    
    collectStar(star) {
        this.score += this.objectTypes[star.type].points;
        
        // Create collection effect
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: star.x,
                y: star.y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 30,
                maxLife: 30,
                color: '#ffff00',
                size: Math.random() * 3 + 1
            });
        }
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalTime').textContent = Math.floor(this.gameTime / 1000);
        document.getElementById('gameOverScreen').classList.remove('hidden');
        
        // Create explosion effect
        for (let i = 0; i < 30; i++) {
            this.particles.push({
                x: this.player.x,
                y: this.player.y,
                vx: (Math.random() - 0.5) * 15,
                vy: (Math.random() - 0.5) * 15,
                life: 60,
                maxLife: 60,
                color: '#ff4444',
                size: Math.random() * 5 + 2
            });
        }
    }
    
    render() {
        // Clear canvas with space background
        this.ctx.fillStyle = 'rgba(0, 0, 17, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw stars background
        this.drawStarField();
        
        if (this.gameState === 'playing') {
            this.drawPlayer();
        }
        
        this.drawObjects();
        this.drawParticles();
    }
    
    drawStarField() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 50; i++) {
            const x = (i * 137.5) % this.canvas.width;
            const y = (i * 73.7 + this.gameTime * 0.02) % this.canvas.height;
            const size = Math.sin(i + this.gameTime * 0.001) * 0.5 + 1;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawPlayer() {
        this.ctx.font = `${this.player.width}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Add glow effect
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = 10;
        
        this.ctx.fillText(
            this.player.emoji,
            this.player.x,
            this.player.y
        );
        
        this.ctx.shadowBlur = 0;
    }
    
    drawObjects() {
        this.ctx.font = '35px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        for (const obj of this.objects) {
            this.ctx.save();
            this.ctx.translate(obj.x, obj.y);
            this.ctx.rotate(obj.rotation);
            
            // Add glow for stars
            if (obj.type === 'star') {
                this.ctx.shadowColor = '#ffff00';
                this.ctx.shadowBlur = 15;
            } else {
                this.ctx.shadowColor = '#ff4444';
                this.ctx.shadowBlur = 8;
            }
            
            this.ctx.fillText(obj.emoji, 0, 0);
            this.ctx.restore();
        }
        
        this.ctx.shadowBlur = 0;
    }
    
    drawParticles() {
        for (const particle of this.particles) {
            const alpha = particle.life / particle.maxLife;
            this.ctx.fillStyle = particle.color.replace(')', `, ${alpha})`);
            
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    try {
        new GalaxyDefender();
    } catch (error) {
        console.error('Failed to initialize Galaxy Defender:', error);
        alert('Failed to start the game. Please refresh the page and try again.');
    }
});

// Handle window resize
window.addEventListener('resize', () => {
    const canvas = document.getElementById('gameCanvas');
    if (canvas && window.innerWidth < 900) {
        const container = canvas.parentElement;
        const containerWidth = container.offsetWidth;
        const scale = Math.min(1, containerWidth / 800);
        canvas.style.transform = `scale(${scale})`;
        canvas.style.transformOrigin = 'top center';
    }
});