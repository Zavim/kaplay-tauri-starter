import { appWindow } from "@tauri-apps/api/window";
import kaplay from "kaplay";
import { goToGame, makeBackround } from "./utils";
import { SCALE_FACTOR } from "./constants";
import { makePlayer, setControls } from "./player";
import { saveSystem } from "./save";
import makeScoreBox from "./scoreBox";

const k = kaplay({
  width: 1280,
  height: 720,
  letterbox: true,
  global: false,
  scale: 2,
});

k.loadSprite("bean", "/bean.png");
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

  playButton.onClick(() => goToGame(k));
  k.onKeyPress("space", () => goToGame(k));
  k.onGamepadButtonPress("south", () => goToGame(k));

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

k.go("start");
