import { appWindow } from "@tauri-apps/api/window";
import type { GameObj, Vec2 } from "kaplay";
import kaplay from "kaplay";
import { goToGame, makeBackround } from "./utils";
import {
  ENEMY_BUS_SPEED,
  ENEMY_BATTLE_SPEED,
  SCALE_FACTOR,
  BULLET_SPEED,
  enemiesToSpawn,
} from "./constants";
import { makePlayer, setControls } from "./player";
import { saveSystem } from "./save";
import makeScoreBox from "./scoreBox";
import { addEnemy } from "./enemy";

const k = kaplay({
  width: 1280,
  height: 720,
  background: [74, 48, 82],
  letterbox: true,
  global: false,
  scale: 2,
});

// k.loadSprite("bean", "src/assets/bean.png");
// k.loadSprite("ghosty", "src/assets/ghosty.png");
// k.loadSprite("meat", "src/assets/meat.png");
// k.loadSprite("grapes", "src/assets/grapes.png");
// k.loadSprite("cake", "src/assets/cake.png");
// k.loadSprite("mark", "src/assets/mark.png");
// k.loadSprite("obstacles", "src/assets/obstacles.png");
// k.loadSprite("background", "src/assets/background.png");
// k.loadSprite("clouds", "src/assets/clouds.png");

// k.loadSound("jump", "/assets/jump.wav");
// k.loadSound("hurt", "/assets/hurt.wav");
// k.loadSound("confirm", "/assets/confirm.wav");
// k.loadSprite("bean", "src/assets/bean.png");

k.loadSprite("bean", "/bean.png");
k.loadSprite("ghosty", "/ghosty.png");
k.loadSprite("meat", "/meat.png");
k.loadSprite("grapes", "/grapes.png");
k.loadSprite("cake", "/cake.png");
k.loadSprite("mark", "/mark.png");
k.loadSprite("spark", "/spark.png");
k.loadSprite("obstacles", "/obstacles.png");
k.loadSprite("background", "/background.png");
k.loadSprite("clouds", "/clouds.png");

k.loadSound("jump", "/jump.wav");
k.loadSound("hurt", "/hurt.wav");
k.loadSound("confirm", "/confirm.wav");

addEventListener("keydown", async (key) => {
  if (key.code === "F11") {
    if (await appWindow.isFullscreen()) {
      await appWindow.setFullscreen(false);
      return;
    }

    appWindow.setFullscreen(true);
  }
});

k.scene("start", async () => {
  const playButton = k.add([
    k.rect(200, 50, { radius: 3 }),
    k.color(k.Color.fromHex("315C2B")),
    k.area(),
    k.anchor("center"),
    k.pos(k.center().x + 30, k.center().y + 60),
  ]);

  playButton.add([
    k.text("play", { size: 24 }),
    k.color(k.Color.fromHex("#d7f2f7")),
    k.area(),
    k.anchor("center"),
  ]);

  // playButton.onClick(() => goToGame(k));
  let enemiesDead = 0;
  playButton.onClick(() =>
    k.go("bus", { enemiesToSpawn: enemiesToSpawn, enemiesDead: enemiesDead })
  );
  k.onKeyPress("space", () =>
    k.go("bus", { enemiesToSpawn: enemiesToSpawn, enemiesDead: enemiesDead })
  );
  k.onGamepadButtonPress("south", () =>
    k.go("bus", { enemiesToSpawn: enemiesToSpawn, enemiesDead: enemiesDead })
  );

  await saveSystem.load();

  if (saveSystem.data?.maxScore === 0) {
    saveSystem.data.maxScore = 0;
    await saveSystem.save();
    await saveSystem.load();
  }
});

k.scene("bus", async ({ enemiesToSpawn, enemiesDead }) => {
  if (enemiesToSpawn) {
    k.add([k.text(`GERMS LEFT: ${enemiesToSpawn - enemiesDead}`)]);
  }

  function late(t) {
    let timer = 0;
    return {
      add() {
        this.hidden = true;
      },
      update() {
        timer += k.dt();
        if (timer >= t) {
          this.hidden = false;
        }
      },
    };
  }
  k.add([
    k.text("OBLITERATE", { size: 160 }),
    k.pos(k.width() / 2, k.height() / 2),
    k.anchor("center"),
    k.opacity(),
    k.lifespan(1),
    k.fixed(),
    k.z(3),
  ]);
  k.add([
    k.text("THE", { size: 160 }),
    k.pos(k.width() / 2, k.height() / 2),
    k.anchor("center"),
    k.opacity(),
    k.lifespan(2),
    late(1),
    k.fixed(),
    k.z(3),
  ]);
  k.add([
    k.text("GERMS", { size: 200 }),
    k.pos(k.width() / 2, k.height() / 2),
    k.anchor("center"),
    k.opacity(),
    k.lifespan(4),
    late(2),
    k.fixed(),
    k.z(3),
  ]);
  const targetSprite = k.choose(["meat", "grapes", "cake"]);
  const target = k.add([
    k.sprite(targetSprite),
    k.pos(k.center()),
    k.anchor("center"),
    k.area(),
    "target",
  ]);

  const cursor = k.add([
    k.sprite("mark"),
    k.pos(k.center()),
    k.anchor("center"),
    k.area(),
    k.z(2),
    k.scale(0.75),
    { battles: 0, maxBattles: 5, active: false },
  ]);

  cursor.onUpdate(() => {
    cursor.pos = k.mousePos();
    if (cursor.battles >= 1) {
      for (let i = 0; i < cursor.battles; i++) {
        cursor.add([k.sprite("ghosty"), k.pos(i * 15, i * 15)]);
      }
    }
  });
  // cursor.onMouseDown(() => {
  //   cursor.active = true;
  // });
  // cursor.onMouseRelease(() => {
  //   cursor.active = false;
  // });
  // cursor.onCollide("enemy", (enemy) => {
  //   if (cursor.active === true && cursor.battles < cursor.maxBattles) {
  //     k.destroy(enemy);
  //     cursor.battles += 1;
  //   }
  // });
  enemiesToSpawn -= enemiesDead;
  function spawnEnemies() {
    k.wait(k.rand() * 2, () => {
      if (k.get("enemy").length < enemiesToSpawn) {
        addEnemy(k, k.vec2(k.width() + k.rand() * 20, k.rand(0, k.height())));
      }
    });
  }

  k.onUpdate(() => {
    spawnEnemies();
    if (cursor.battles >= 1) {
      k.wait(3, () => {
        k.go("battle", { battles: cursor.battles });
        // k.camPos(cursor.pos);
        // k.camScale(k.vec2(3));
        // ENEMY_SPEED = 10
      });
    }
  });

  k.onClick("enemy", (enemy) => {
    if (cursor.battles < cursor.maxBattles) {
      cursor.battles += 1;
      enemy.isFrozen = true;
    }
  });

  k.onUpdate("enemy", (enemy) => {
    if (!enemy.isFrozen) {
      enemy.color = k.WHITE;
      let dir = target.pos.sub(enemy.pos).unit();
      enemy.move(dir.scale(ENEMY_BUS_SPEED));
    } else {
      enemy.color = k.BLUE;
    }
  });
});

k.scene("battle", ({ battles }) => {
  let enemiesLeft = battles;
  // k.add([k.text(`ROUNDS: ${battles}`)]);
  k.camScale(k.vec2(1.2));

  k.wait(1.5, () => {
    player.invincible = false;
  });

  const cursor = k.add([
    k.sprite("mark"),
    k.pos(k.center()),
    k.anchor("center"),
    k.area(),
    k.z(2),
    k.scale(0.75),
    { battles: 0, maxBattles: 3, active: false },
  ]);

  cursor.onUpdate(() => {
    cursor.pos = k.mousePos();
  });

  k.onUpdate(() => {
    if (enemiesLeft <= 0) {
      k.go("bus", { enemiesToSpawn: enemiesToSpawn, enemiesDead: battles });
    }
  });
  k.onMouseDown(() => {
    player.attacking = true;
    player.moveTo(cursor.pos, 400);
  });
  k.onMouseRelease(() => {
    player.attacking = false;
  });

  const player = k.add(makePlayer(k));
  player.pos = k.vec2(k.center());
  setControls(k, player);

  player.onUpdate(async () => {
    if (player.attacking) {
      // player.color = k.rgb(k.rand(0, 255), k.rand(0, 255), k.rand(0, 255));
      player.color = k.rgb(255, 255, 0);
    } else {
      player.color = k.WHITE;
    }
  });

  player.onCollideUpdate("enemy", (enemy) => {
    if (player.attacking === true) {
      k.destroy(enemy);
      enemiesLeft -= 1;
    }
    if (player.attacking === false && player.invincible === false) {
      player.lives -= 1;
      k.destroy(player);
      k.go("bus", { enemiesToSpawn: enemiesToSpawn, enemiesDead: 0 });
    }
    // if (player.lives < 0) {
    //   k.go("end");
    // } else {
    // }
  });
  player.onCollideEnd("bullet", () => {
    if (player.invincible === false) {
      k.destroy(player);
      k.go("bus", { enemiesToSpawn: enemiesToSpawn, enemiesDead: 0 });
    }
  });

  for (let i = 0; i < battles; i++) {
    addEnemy(k, k.vec2(k.rand(20, k.width()), k.rand(20, k.height())));
  }

  k.onUpdate("enemy", async (enemy) => {
    switch (enemy.action) {
      case "wait": {
        if (player.exists()) {
          await k.wait(k.rand() * 0.5);
          enemy.action = "pursuit";
        }
        break;
      }
      case "pursuit": {
        if (player.exists()) {
          let dir = player.pos.sub(enemy.pos).unit();
          enemy.move(dir.scale(ENEMY_BATTLE_SPEED));
        } else {
          enemy.action = "wait";
        }
        break;
      }
      case "attack": {
        if (player.exists()) {
          const dir = player.pos.sub(enemy.pos).unit();

          if (k.get("bullet").length < enemy.stock) {
            k.add([
              k.pos(enemy.pos),
              k.move(dir, BULLET_SPEED),
              k.rect(24, 24),
              k.area(),
              k.offscreen({ destroy: true }),
              k.anchor("center"),
              k.color(k.WHITE),
              "bullet",
            ]);
          }
          await k.wait(k.rand() * 0.5);
          enemy.action = "pursuit";
        }

        break;
      }
    }
    if (enemy.action === "pursuit") {
      await k.wait(2);
      enemy.action = "attack";
    }
  });
});

k.go("start");
