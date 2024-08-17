import type { KAPLAYCtx, Vec2 } from "kaplay";
import { saveSystem } from "./save";
import { computeRank, goToGame } from "./utils";

export default async function makeScoreBox(
  k: KAPLAYCtx,
  pos: Vec2,
  score: number
) {
  saveSystem.load();

  if (score > saveSystem.data.maxScore) {
    saveSystem.data.maxScore = score;

    await saveSystem.save();
  }

  const container = k.make([
    k.rect(600, 500),
    k.pos(pos),
    k.color(k.Color.fromHex("#d7f2f7")),
    k.area(),
    k.anchor("center"),
    k.outline(4, k.Color.fromHex("#14638e")),
  ]);

  container.add([
    k.text(`Previous best score: ${saveSystem.data.maxScore}`),
    k.color(k.Color.fromHex("#14638e")),
    k.area(),
    k.pos(-240, -200),
  ]);

  container.add([
    k.text(`Current score: ${score}`),
    k.color(k.Color.fromHex("#14638e")),
    k.area(),
    k.pos(-240, -150),
  ]);

  container.add([
    k.text(`Previous best rank: ${computeRank(saveSystem.data.maxScore)}`),
    k.color(k.Color.fromHex("#14638e")),
    k.area(),
    k.pos(-240, 100),
  ]);

  container.add([
    k.text(`Current rank: ${computeRank(score)}`),
    k.color(k.Color.fromHex("#14638e")),
    k.area(),
    k.pos(-240, 50),
  ]);

  const restartBtn = container.add([
    k.rect(200, 50, { radius: 3 }),
    k.color(k.Color.fromHex("#14638e")),
    k.area(),
    k.anchor("center"),
    k.pos(0, 200),
  ]);

  restartBtn.add([
    k.text("Play Again", { size: 24 }),
    k.color(k.Color.fromHex("#d7f2f7")),
    k.area(),
    k.anchor("center"),
  ]);

  restartBtn.onClick(() => goToGame(k));
  k.onKeyPress("space", () => goToGame(k));
  k.onGamepadButtonPress("south", () => goToGame(k));

  return container;
}
