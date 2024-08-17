import type { KAPLAYCtx } from "kaplay";

export function makeBackround(k: KAPLAYCtx) {
  k.add([k.rect(k.width(), k.height()), k.color(k.Color.fromHex("d7f2f7"))]);
}

export function computeRank(score: number) {
  if (score > 30) {
    return "S";
  }
  if (score > 20) {
    return "A";
  }
  if (score > 10) {
    return "B";
  }
  if (score > 5) {
    return "C";
  }
  return "D";
}

export function goToGame(k: KAPLAYCtx) {
  k.play("confirm");
  k.go("main");
}
