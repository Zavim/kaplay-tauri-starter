import type { KAPLAYCtx, GameObj, Vec2 } from "kaplay";
// import { ENEMY_SPEED } from "./constants";

function drag(k) {
  let currentlyDraggin: GameObj;

  // The displacement between object pos and mouse pos
  let offset = k.vec2(0);

  // Check if someone is picked
  k.onMousePress(() => {
    if (currentlyDraggin) {
      return;
    }
    // Loop all "bean"s in reverse, so we pick the topmost one
    for (const obj of k.get("drag").reverse()) {
      // If mouse is pressed and mouse position is inside, we pick

      if (obj.isHovering()) {
        obj.pick();
        break;
      }
    }
  });

  // Drop whatever is dragged on mouse release
  k.onMouseRelease(() => {
    if (currentlyDraggin) {
      currentlyDraggin.trigger("dragEnd");
      currentlyDraggin = null;
    }
  });

  return {
    // Name of the component
    id: "drag",
    // This component requires the "pos" and "area" component to work
    require: ["pos", "area"],
    pick() {
      // Set the current global dragged object to this
      currentlyDraggin = this;
      offset = k.mousePos().sub(this.pos);
      this.trigger("drag");
    },
    // "update" is a lifecycle method gets called every frame the obj is in scene
    update() {
      if (currentlyDraggin === this) {
        this.pos = k.mousePos().sub(offset);
        this.trigger("dragUpdate");
      }
    },
    onDrag(action) {
      return this.on("drag", action);
    },
    onDragUpdate(action) {
      return this.on("dragUpdate", action);
    },
    onDragEnd(action) {
      return this.on("dragEnd", action);
    },
  };
}

export function addEnemy(k: KAPLAYCtx, pos: Vec2) {
  const enemy = k.add([
    k.sprite("ghosty"),
    k.area(),
    k.anchor("center"),
    k.pos(pos),
    k.color(),
    "enemy",
    { isFrozen: false, action: "wait", stock: 10 },
  ]);

  //   enemy.onClick(() => {
  //     freeze(k);
  //   });

  //   enemy.onDrag(() => {
  //     // Remove the object and re-add it, so it'll be drawn on top
  //     k.readd(enemy);
  //   });

  //   enemy.onDragUpdate(() => {});

  return enemy;
}
