import "./style.css";
import Phaser from "phaser";
import VirtualJoystickPlugin from "phaser3-rex-plugins/plugins/virtualjoystick-plugin.js";

const sizes = {
  width: 800,
  height: 600,
};
const speedDown = 300;

class GameScene extends Phaser.Scene {
  constructor() {
    super("scene-game");
    this.joyStick;
    this.text;
    this.platforms;
    this.player;
    this.stars;
    this.bombs;
    this.cursors;
    this.score = 0;
    this.gameOver = false;
    this.scoreText;
  }
  preload() {
    this.load.image("sky", "/assets/sky.png");
    this.load.image("ground", "/assets/platform.png");
    this.load.image("star", "/assets/star.png");
    this.load.image("bomb", "/assets/bomb.png");
    this.load.spritesheet("dude", "/assets/dude.png", {
      frameWidth: 32,
      frameHeight: 48,
    });
  }
  create() {
    // 监听
    this.input.on("pointerdown", (pointer) => {
      // 虚拟摇杆
      this.joyStick = this.plugins
        .get("rexVirtualJoystick")
        .add(this, {
          x: pointer.x,
          y: pointer.y,
          radius: 100,
          base: this.add.circle(0, 0, 100, 0x888888, 0.4).setDepth(1),
          thumb: this.add.circle(0, 0, 50, 0xcccccc, 0.4).setDepth(2),
          // dir: '8dir',   // 'up&down'|0|'left&right'|1|'4dir'|2|'8dir'|3
          // forceMin: 16,
          // enable: true
        })
        .on("update", this.dumpJoyStickState, this);
    });
    this.input.on("pointerup", () => {
      this.joyStick.destroy();
      this.joyStick = null;
    });
    // 对象
    this.add.image(400, 300, "sky");
    this.platforms = this.physics.add.staticGroup();

    this.platforms.create(400, 568, "ground").setScale(2).refreshBody();

    this.platforms.create(600, 400, "ground");
    this.platforms.create(50, 250, "ground");
    this.platforms.create(750, 220, "ground");

    this.player = this.physics.add.sprite(100, 450, "dude");

    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);

    this.anims.create({
      key: "left",
      frames: this.anims.generateFrameNumbers("dude", { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "turn",
      frames: [{ key: "dude", frame: 4 }],
      frameRate: 20,
    });

    this.anims.create({
      key: "right",
      frames: this.anims.generateFrameNumbers("dude", { start: 5, end: 8 }),
      frameRate: 10,
      repeat: -1,
    });

    this.stars = this.physics.add.group({
      key: "star",
      repeat: 11,
      setXY: { x: 12, y: 0, stepX: 70 },
    });

    this.stars.children.iterate(function (child) {
      child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    });

    this.bombs = this.physics.add.group();
    this.scoreText = this.add.text(600, 16, "score: 0", {
      fontSize: "32px",
      fill: "#000",
    });

    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.stars, this.platforms);
    this.physics.add.collider(this.bombs, this.platforms);

    this.physics.add.overlap(
      this.player,
      this.stars,
      this.collectStar,
      null,
      this
    );
    this.physics.add.collider(
      this.player,
      this.bombs,
      this.hitBomb,
      null,
      this
    );
    /* // 虚拟摇杆
    this.joyStick = this.plugins
      .get("rexVirtualJoystick")
      .add(this, {
        x: 700,
        y: 500,
        radius: 100,
        base: this.add.circle(0, 0, 100, 0x888888, 0.4).setDepth(1),
        thumb: this.add.circle(0, 0, 50, 0xcccccc, 0.4).setDepth(2),
        // dir: '8dir',   // 'up&down'|0|'left&right'|1|'4dir'|2|'8dir'|3
        // forceMin: 16,
        // enable: true
      })
      .on("update", this.dumpJoyStickState, this); */
    this.text = this.add.text(0, 0);
    this.dumpJoyStickState();
  }
  update() {
    if (this.gameOver) {
      return;
    }
    if (this.joyStick) {
      var cursorKeys = this.joyStick.createCursorKeys();
      if (cursorKeys.left.isDown) {
        // 左
        this.player.setVelocityX(-160);
        this.player.anims.play("left", true);
      } else if (cursorKeys.right.isDown) {
        // 右
        this.player.setVelocityX(160);
        this.player.anims.play("right", true);
      } else if (cursorKeys.up.isDown && this.player.body.touching.down) {
        // 同时也检测玩家是不是正与地面接触
        this.player.setVelocityY(-330);
      } else if (cursorKeys.down.isDown) {
        this.player.setVelocityX(0);
        this.player.anims.play("turn");
      }
    }
  }
  dumpJoyStickState() {
    if (this.joyStick) {
      var cursorKeys = this.joyStick.createCursorKeys();
      var s = "Key down: ";
      for (var name in cursorKeys) {
        if (cursorKeys[name].isDown) {
          s += `${name} `;
        }
      }

      s += `
Force: ${Math.floor(this.joyStick.force * 100) / 100}
Angle: ${Math.floor(this.joyStick.angle * 100) / 100}
`;

      s += "\nTimestamp:\n";
      for (var name in cursorKeys) {
        var key = cursorKeys[name];
        s += `${name}: duration=${key.duration / 1000}\n`;
      }
      this.text.setText(s);
    }
  }
  collectStar(player, star) {
    star.disableBody(true, true);

    //  Add and update the score
    this.score += 10;
    this.scoreText.setText("Score: " + this.score);

    if (this.stars.countActive(true) === 0) {
      //  A new batch of stars to collect
      this.stars.children.iterate(function (child) {
        child.enableBody(true, child.x, 0, true, true);
      });

      var x =
        player.x < 400
          ? Phaser.Math.Between(400, 800)
          : Phaser.Math.Between(0, 400);

      var bomb = this.bombs.create(x, 16, "bomb");
      bomb.setBounce(1);
      bomb.setCollideWorldBounds(true);
      bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
      bomb.allowGravity = false;
    }
  }

  hitBomb(player, bomb) {
    this.physics.pause();
    player.setTint(0xff0000);
    player.anims.play("turn");
    this.gameOver = true;
  }
}

const config = {
  type: Phaser.WEBGL,
  width: sizes.width,
  height: sizes.height,
  canvas: gameCanvas,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: speedDown },
      debug: false,
    },
  },
  scene: [GameScene],
  plugins: {
    global: [
      {
        key: "rexVirtualJoystick",
        plugin: VirtualJoystickPlugin,
        start: true,
      },
      // ...
    ],
  },
};

const game = new Phaser.Game(config);
