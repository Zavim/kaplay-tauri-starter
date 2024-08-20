import { appWindow } from "@tauri-apps/api/window";
import type { GameObj, Vec2 } from "kaplay";
import kaplay from "kaplay";
import { goToGame, makeBackround } from "./utils";
import {
  ENEMY_BUS_SPEED,
  ENEMY_BATTLE_SPEED,
  SCALE_FACTOR,
  BULLET_SPEED,
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

k.loadSprite("bean", "/bean.png");
k.loadSprite("ghosty", "/ghosty.png");
k.loadSprite("meat", "/meat.png");
k.loadSprite("grapes", "/grapes.png");
k.loadSprite("cake", "/cake.png");
k.loadSprite("mark", "/mark.png");
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
  makeBackround(k);

  const map = k.add([
    k.sprite("background"),
    k.pos(0, 0),
    k.scale(SCALE_FACTOR),
  ]);

  const clouds = map.add([
    k.sprite("clouds"),
    k.pos(),
    {
      speed: 5,
    },
  ]);

  clouds.onUpdate(() => {
    clouds.move(clouds.speed, 0);
    if (clouds.pos.x > 700) {
      clouds.pos.x = -500;
    }
  });

  map.add([k.sprite("obstacles"), k.pos()]);

  const player = k.add(makePlayer(k));
  player.pos = k.vec2(k.center().x - 350, k.center().y + 56);

  const playButton = k.add([
    k.rect(200, 50, { radius: 3 }),
    k.color(k.Color.fromHex("14638e")),
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
  playButton.onClick(() => k.go("bus"));
  k.onKeyPress("space", () => k.go("bus"));
  k.onGamepadButtonPress("south", () => k.go("bus"));

  await saveSystem.load();

  if (saveSystem.data?.maxScore === 0) {
    saveSystem.data.maxScore = 0;
    await saveSystem.save();
    await saveSystem.load();
  }
});

k.scene("main", async () => {
  makeBackround(k);

  let score = 0;

  const colliders = await (await fetch("./collidersData.json")).json();
  const collidersData = colliders.data;

  k.setGravity(2500);

  const map = k.add([k.pos(0, -50), k.scale(SCALE_FACTOR)]);

  map.add([k.sprite("background"), k.pos()]);

  const clouds = map.add([k.sprite("clouds"), k.pos(), { speed: 5 }]);
  clouds.onUpdate(() => {
    clouds.move(clouds.speed, 0);
    if (clouds.pos.x > 700) {
      clouds.pos.x = -500;
    }
  });

  const platforms = map.add([
    k.sprite("obstacles"),
    k.pos(),
    k.area(),
    { speed: 100 },
  ]);

  platforms.onUpdate(() => {
    platforms.move(-platforms.speed, 0);
    if (platforms.pos.x < -490) {
      platforms.pos.x = 300; //put platforms far back
      platforms.speed += 30; //progressively increase speed
    }
  });

  k.loop(1, () => {
    score += 1;
  });

  for (const collider of collidersData) {
    platforms.add([
      k.area({
        shape: new k.Rect(k.vec2(0), collider.width, collider.height),
      }),
      k.body({ isStatic: true }),
      k.pos(collider.x, collider.y),
      "obstacle",
    ]);
  }

  k.add([
    k.rect(k.width(), 50),
    k.pos(0, -100),
    k.area(),
    k.fixed(),
    "obstacle",
  ]);

  k.add([
    k.rect(k.width(), 50),
    k.pos(0, 1000),
    k.area(),
    k.fixed(),
    "obstacle",
  ]);

  const player = k.add(makePlayer(k));
  player.pos = k.vec2(600, 250);
  setControls(k, player);
  player.onCollide("obstacle", async () => {
    if (player.isDead) return;
    k.play("hurt");
    platforms.speed = 0;
    k.add(await makeScoreBox(k, k.center(), score));
    player.isDead = true;
  });
});

k.scene("bus", async () => {
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
    { battles: 0, maxBattles: 3, active: false },
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
  function spawnEnemies() {
    k.wait(k.rand() * 2, () => {
      if (k.get("enemy").length < 10) {
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
  k.add([k.text(`ROUNDS: ${battles}`)]);

  const player = k.add(makePlayer(k));
  player.pos = k.vec2(k.center());
  setControls(k, player);
  player.onCollideEnd("enemy", () => {
    player.lives -= 1;
    k.destroy(player);
    if (player.lives < 0) {
      k.go("end");
    } else {
      k.go("bus");
    }
  });
  player.onCollideEnd("bullet", () => {
    player.lives -= 1;
    k.destroy(player);
    if (player.lives < 0) {
      k.go("end");
    } else {
      k.go("bus");
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
