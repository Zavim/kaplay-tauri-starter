import type { KAPLAYCtx, GameObj } from "kaplay";

export function makePlayer(k: KAPLAYCtx) {
  const bean = k.make([
    k.sprite("bean"),
    k.area({ shape: new k.Rect(k.vec2(0, 1.5), 8, 5) }),
    k.anchor("center"),
    k.body({ jumpForce: 600 }),
    k.pos(),
    k.scale(),
    {
      isDead: false,
      speed: 600,
      lives: 3,
    },
  ]);
  return bean;
}

export function setControls(k: KAPLAYCtx, player: GameObj) {
  k.onKeyDown((key) => {
    switch (key) {
      case "left":
        player.direction = "left";
        player.flipX = true;
        player.move(-player.speed, 0);
        break;
      case "right":
        player.direction = "right";
        player.flipX = false;
        player.move(player.speed, 0);
        break;
      case "up":
        player.direction = "right";
        player.flipX = false;
        player.move(0, -player.speed);
        break;
      case "down":
        player.direction = "right";
        player.flipX = false;
        player.move(0, player.speed);
        break;
      default:
    }
  });

  k.onKeyPress("space", () => {
    k.play("jump");
    player.jump();
  });
}
