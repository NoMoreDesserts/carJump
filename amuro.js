let config = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 0 },
                debug: false
            }
        },
        scene: {
            preload: preload,
            create: create,
            update: update
        }
    };

let game = new Phaser.Game(config);
let speed = 1500;
let gameOver = false;
let firstHit = false;
let currentScore = 0;
let highestScore = 0;
let obstacleTween = [];

let currentScoreText;
let highestScoreText;
let car;
let obstacles;
let roadTween;
let obstacleTime;
let scoreTime;
let gameOverText;

let jumpAudio;
let pass100Audio;
let gameOverAudio;

function preload () {
    this.load.image('background', 'assets/amuro/background.png');
    this.load.image('car', 'assets/amuro/car.png');
    this.load.image('road', 'assets/amuro/road.png');
    this.load.image('platform', 'assets/amuro/platform.png');
    this.load.image('gameOverText', 'assets/amuro/game-over.png');   
    this.load.image('obstacle1', 'assets/amuro/obstacle1.png');
    this.load.image('obstacle2', 'assets/amuro/obstacle2.png');
    this.load.image('obstacle3', 'assets/amuro/obstacle3.png');

    this.load.audio('jumpAudio', 'assets/amuro/jump.mp3');
    this.load.audio('pass100Audio', 'assets/amuro/pass-100.mp3');
    this.load.audio('gameOverAudio', 'assets/amuro/game-over.mp3');
}

function create () {
    this.sound.context.resume();
    jumpAudio = this.sound.add('jumpAudio');
    pass100Audio = this.sound.add('pass100Audio');
    gameOverAudio = this.sound.add('gameOverAudio');

    this.add.image(400, 300, 'background');
    gameOverText = this.physics.add.image(400, 200, 'gameOverText');
    gameOverText.disableBody(true, true);

    platforms = this.physics.add.staticGroup();
    platforms.create(400, 400, 'platform').setScale(0.5)

    let road = this.physics.add.image(800, 360, 'road').setScale(0.5);
    roadTween = this.add.tween({
        targets: road,
        x: 0,
        duration: speed,
        loop: -1
    });

    car = this.physics.add.sprite(100, 330, 'car').setScale(0.35);
    car.setBounce(0.2);
    car.setCollideWorldBounds(true);
    car.body.setGravityY(2000);

    this.physics.add.collider(car, road);
    this.physics.add.collider(car, platforms);
    this.physics.add.collider(road, platforms);

    obstacles = this.physics.add.group()
    obstacleTime = this.time.addEvent({ delay: Phaser.Math.Between(2000, 3000), callback: addObstacles, callbackScope: this, loop: true });
    resetTime = this.time.addEvent({ delay: 2000, callback: () => {
        obstacleTime.reset({ delay: Phaser.Math.Between(2000, 3000), callback: addObstacles, callbackScope: this, loop: true, startAt: 2000})
    }, callbackScope: this, loop: true });;
    this.physics.add.overlap(car, obstacles, hitObstacles, null, this);

    highestScoreText = this.add.text(50, 50, 'HI 0', { fontSize: '20px', fill: '#000' })
    currentScoreText = this.add.text(150, 50, '0', { fontSize: '20px', fill: '#000' })
    scoreTime = this.time.addEvent({ delay: 250, callback: () => {
        currentScore++;
        currentScoreText.setText(currentScore);
        if (currentScore != 0 && currentScore % 100 == 0) {
            pass100Audio.play();
        }
    }, callbackScope: this, loop: true })
}

function update () {
    cursors = this.input.keyboard.createCursorKeys();
    enter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

    // 跳起来
    if (cursors.space.isDown && !gameOver && car.body.touching.down) {
        jumpAudio.play();
        car.setVelocityY(-800);
    }

    // 重新开始
    if (Phaser.Input.Keyboard.JustDown(enter) && gameOver) {
        // 重置当前分数
        currentScore = 0;
        currentScoreText.setText('0');

        // 清空所有障碍物
        obstacles.clear(true, true);
        obstacleTween = [];

        this.physics.resume();

        // 恢复动画
        roadTween.resume();

        // 恢复时间线
        obstacleTime.paused = false;
        resetTime.paused = false;
        scoreTime.paused = false;
        
        // 移除Game Over
        gameOverText.disableBody(true, true);

        car.clearTint();
        gameOver = false;
    }
}

function addObstacles() {
    index = Math.floor(Math.random() * 3 + 1)
    obstacle = obstacles.create(800, 330, 'obstacle' + index).setScale(0.5);
    obstacle.setGravityY(0);
    obstacleTween.push(this.add.tween({
        targets: obstacle,
        x: -100,
        duration: speed,
        loop: 1
    }));
}

function hitObstacles(car, obstacle) {
    if (firstHit) {
        firstHit = false;
        return;
    }
    this.physics.pause();
    gameOverAudio.play();

    // 所有动画停下
    roadTween.pause();
    obstacleTween.forEach(tween => {
        tween.pause();
    });

    // 所有时间线停下
    obstacleTime.paused = true;
    resetTime.paused = true;
    scoreTime.paused = true;

    // Game over字样
    gameOverText.enableBody(true, 400, 200, true, true);

    // 更新最高分
    if(currentScore > highestScore) {
        highestScore = currentScore;
        highestScoreText.setText('HI ' + highestScore)
    }

    // 车子变色
    car.setTint(0x303e4e);

    // 修改控制变量
    gameOver = true;
    firstHit = true;
}