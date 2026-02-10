import assert from "node:assert/strict";
import { createGame, setDirection, step, placeFood } from "../src/game.mjs";

function fixedRng(values) {
  let index = 0;
  return () => {
    const value = values[index % values.length];
    index += 1;
    return value;
  };
}

function makeGame(overrides = {}) {
  return createGame({ width: 5, height: 5, rng: fixedRng([0]), ...overrides });
}

{
  const game = makeGame();
  const next = step(game);
  assert.equal(next.snake[0].x, game.snake[0].x + 1);
  assert.equal(next.snake[0].y, game.snake[0].y);
}

{
  let game = makeGame();
  game = setDirection(game, "down");
  game = step(game);
  assert.equal(game.direction, "down");
  assert.equal(game.snake[0].y, Math.floor(game.height / 2) + 1);
}

{
  const game = makeGame({ rng: fixedRng([0.5]) });
  const next = step(game);
  const lengthBefore = game.snake.length;
  const moved = step(next);
  assert.equal(moved.snake.length, lengthBefore);
}

{
  const rng = fixedRng([0]);
  const game = createGame({ width: 4, height: 4, rng });
  const food = { x: game.snake[0].x + 1, y: game.snake[0].y };
  const forced = { ...game, food };
  const next = step(forced);
  assert.equal(next.snake.length, game.snake.length + 1);
  assert.equal(next.score, 1);
}

{
  const game = {
    width: 3,
    height: 3,
    snake: [
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 0, y: 2 },
    ],
  };
  const { food } = placeFood({ ...game, rng: fixedRng([0.9]) });
  assert.ok(food);
  assert.ok(!game.snake.some((seg) => seg.x === food.x && seg.y === food.y));
}

{
  const game = makeGame();
  const blocked = setDirection(game, "left");
  assert.equal(blocked.nextDirection, "right");
}

{
  const game = makeGame();
  const hitWall = {
    ...game,
    snake: [{ x: 4, y: 2 }],
    direction: "right",
    nextDirection: "right",
  };
  const next = step(hitWall);
  assert.equal(next.gameOver, true);
}

console.log("All tests passed.");
