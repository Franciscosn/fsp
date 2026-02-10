const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITES = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

function defaultRng() {
  return Math.random();
}

function isSame(a, b) {
  return a.x === b.x && a.y === b.y;
}

function buildEmptyCells(width, height, snake) {
  const occupied = new Set(snake.map((seg) => `${seg.x},${seg.y}`));
  const empty = [];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const key = `${x},${y}`;
      if (!occupied.has(key)) {
        empty.push({ x, y });
      }
    }
  }
  return empty;
}

export function placeFood({ width, height, snake, rng }) {
  const empty = buildEmptyCells(width, height, snake);
  if (empty.length === 0) {
    return { food: null, won: true };
  }
  const index = Math.floor(rng() * empty.length);
  return { food: empty[index], won: false };
}

export function createGame({ width = 20, height = 20, rng = defaultRng } = {}) {
  const startX = Math.floor(width / 2);
  const startY = Math.floor(height / 2);
  const snake = [
    { x: startX, y: startY },
    { x: startX - 1, y: startY },
  ];
  const { food } = placeFood({ width, height, snake, rng });
  return {
    width,
    height,
    snake,
    direction: "right",
    nextDirection: "right",
    food,
    score: 0,
    gameOver: false,
    won: false,
    rng,
  };
}

export function setDirection(state, direction) {
  if (!DIRECTIONS[direction]) {
    return state;
  }
  if (direction === OPPOSITES[state.direction]) {
    return state;
  }
  return { ...state, nextDirection: direction };
}

function hitsWall(head, width, height) {
  return head.x < 0 || head.y < 0 || head.x >= width || head.y >= height;
}

function hitsSelf(head, snake) {
  return snake.some((segment) => isSame(segment, head));
}

export function step(state) {
  if (state.gameOver) {
    return state;
  }

  const direction = state.nextDirection;
  const vector = DIRECTIONS[direction];
  const head = state.snake[0];
  const nextHead = { x: head.x + vector.x, y: head.y + vector.y };

  if (hitsWall(nextHead, state.width, state.height)) {
    return { ...state, direction, gameOver: true };
  }

  if (hitsSelf(nextHead, state.snake)) {
    return { ...state, direction, gameOver: true };
  }

  let snake = [nextHead, ...state.snake];
  let food = state.food;
  let score = state.score;
  let won = state.won;

  if (food && isSame(nextHead, food)) {
    score += 1;
    const placement = placeFood({
      width: state.width,
      height: state.height,
      snake,
      rng: state.rng,
    });
    food = placement.food;
    won = placement.won;
  } else {
    snake = snake.slice(0, -1);
  }

  const gameOver = won ? true : false;

  return {
    ...state,
    snake,
    food,
    score,
    direction,
    nextDirection: direction,
    gameOver,
    won,
  };
}

export function serialize(state) {
  return {
    width: state.width,
    height: state.height,
    snake: state.snake.map((seg) => ({ ...seg })),
    direction: state.direction,
    nextDirection: state.nextDirection,
    food: state.food ? { ...state.food } : null,
    score: state.score,
    gameOver: state.gameOver,
    won: state.won,
  };
}

export { DIRECTIONS };
