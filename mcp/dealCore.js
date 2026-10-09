// dealCore.js — constrained random dealing, mirrors src/workers/deal.worker.ts
// (board classes inlined as plain functions so the MCP server needs no TS build).

const SUITS = ["S", "H", "D", "C"];
const RANK = { A: 0, K: 1, Q: 2, J: 3, 10: 4, 9: 5, 8: 6, 7: 7, 6: 8, 5: 9, 4: 10, 3: 11, 2: 12 };
const POINT = { A: 4, K: 3, Q: 2, J: 1, 10: 0, 9: 0, 8: 0, 7: 0, 6: 0, 5: 0, 4: 0, 3: 0, 2: 0 };
const VUL = [
  "EW", "None", "NS", "EW", "Both", "NS", "EW", "Both", "None",
  "EW", "Both", "None", "NS", "Both", "None", "NS", "EW",
];
const DEALER = ["W", "N", "E", "S", "W"];
// boardNum 是从 1 开始的局号：第1副双方无局、北家开叫，直接按局号取表。
const vulOfBoard = (boardNum) => VUL[((boardNum % 16) + 16) % 16];
const dealerOfBoard = (boardNum) => DEALER[((boardNum % 4) + 4) % 4];
const PLAYERS = ["N", "S", "E", "W"];

function makeCard(suit, rank) {
  return { suit, rank, points: POINT[rank] };
}

function newHand() {
  return { cards: [], hand: { S: [], H: [], D: [], C: [] }, points: 0, shape: { S: 0, H: 0, D: 0, C: 0 } };
}

function addToHand(hand, card) {
  hand.cards.push(card);
  hand.hand[card.suit].push(card.rank);
  hand.points += card.points;
  hand.shape[card.suit] += 1;
}

function addCardsToHand(hand, cards) {
  cards.forEach((card) => addToHand(hand, card));
  sortHand(hand);
}

function sortHand(hand) {
  for (const suit of SUITS) {
    hand.hand[suit].sort((a, b) => RANK[a] - RANK[b]);
  }
}

function getMostCards(hand) {
  const M = Math.max(...Object.values(hand.shape));
  return SUITS.filter((s) => hand.shape[s] === M);
}

function getFewestCards(hand) {
  const M = Math.min(...Object.values(hand.shape));
  return SUITS.filter((s) => hand.shape[s] === M);
}

function oneHandFilter(props) {
  const {
    hand,
    points = [0, 37],
    shapes = null,
    maxsuit = 13,
    minsuit = 0,
    havesuit = null,
    solid = false,
    maxace = 4,
    minace = 0,
    cards = [],
    ambiguousShape,
  } = props;

  if (hand.points < points[0] || hand.points > points[1]) return false;

  if (shapes !== null) {
    const [s, h, d, c] = shapes;
    if (hand.shape.S !== s || hand.shape.H !== h || hand.shape.D !== d || hand.shape.C !== c) return false;
  }

  if (ambiguousShape) {
    const [[minSpades, maxSpades], [minHearts, maxHearts], [minDiamonds, maxDiamonds], [minClubs, maxClubs]] = ambiguousShape;
    if (
      hand.shape.S < minSpades || hand.shape.S > maxSpades ||
      hand.shape.H < minHearts || hand.shape.H > maxHearts ||
      hand.shape.D < minDiamonds || hand.shape.D > maxDiamonds ||
      hand.shape.C < minClubs || hand.shape.C > maxClubs
    ) return false;
  }

  if (hand.shape[getMostCards(hand)[0]] > maxsuit) return false;
  if (hand.shape[getFewestCards(hand)[0]] < minsuit) return false;

  if (havesuit !== null) {
    let have = false;
    for (const suitlength of havesuit) {
      if (Object.values(hand.shape).includes(suitlength)) {
        have = true;
        break;
      }
    }
    if (!have) return false;
  }

  if (solid) {
    const highcard = ["A", "K", "Q", "J"];
    const mostSuit = getMostCards(hand)[0];
    let highcardnum = 0;
    for (const card of hand.cards) {
      if (card.suit === mostSuit && highcard.includes(card.rank)) highcardnum++;
    }
    if (highcardnum < 3) return false;
  }

  let aces = 0;
  for (const card of hand.cards) {
    if (card.rank === "A") aces++;
  }
  if (aces > maxace) return false;
  if (aces < minace) return false;

  return true;
}

function handFilter(props) {
  const { N, S, E, W } = props;
  if (N && !oneHandFilter(N)) return false;
  if (S && !oneHandFilter(S)) return false;
  if (E && !oneHandFilter(E)) return false;
  if (W && !oneHandFilter(W)) return false;
  return true;
}

function binom(n, k) {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  let result = 1;
  for (let i = 1; i <= k; i++) {
    result = (result * (n - k + i)) / i;
  }
  return result;
}

function computeDistributionWeight(distribution) {
  let weight = 1;
  for (const suit of SUITS) {
    let remaining = 13;
    for (const shape of distribution) {
      if (shape) {
        weight *= binom(remaining, shape[suit]);
        remaining -= shape[suit];
      }
    }
  }
  return weight;
}

function generateValidShapes(ambiguousShape) {
  const [[minSpades, maxSpades], [minHearts, maxHearts], [minDiamonds, maxDiamonds], [minClubs, maxClubs]] = ambiguousShape;
  const validShapes = [];
  for (let s = minSpades; s <= maxSpades; s++) {
    for (let h = minHearts; h <= maxHearts; h++) {
      for (let d = minDiamonds; d <= maxDiamonds; d++) {
        const c = 13 - s - h - d;
        if (c >= minClubs && c <= maxClubs) {
          validShapes.push({ S: s, H: h, D: d, C: c });
        }
      }
    }
  }
  return validShapes;
}

function generateGlobalShapeDistribution(filters, fixed_cards) {
  const allPlayerShapes = [];
  const hasConstraints = [false, false, false, false];
  const minRequiredShapes = [
    { S: 0, H: 0, D: 0, C: 0 },
    { S: 0, H: 0, D: 0, C: 0 },
    { S: 0, H: 0, D: 0, C: 0 },
    { S: 0, H: 0, D: 0, C: 0 },
  ];

  if (fixed_cards) {
    for (const player of Object.keys(fixed_cards)) {
      const playerIdx = PLAYERS.indexOf(player);
      if (playerIdx !== -1) {
        for (const card of fixed_cards[player]) {
          minRequiredShapes[playerIdx][card.suit]++;
        }
      }
    }
  }

  for (let i = 0; i < 4; i++) {
    const player = PLAYERS[i];
    const filter = filters[player];
    const minShape = minRequiredShapes[i];

    if (filter && filter.ambiguousShape) {
      const shapes = generateValidShapes(filter.ambiguousShape);
      const validShapes = shapes.filter(
        (shape) =>
          shape.S >= minShape.S && shape.H >= minShape.H &&
          shape.D >= minShape.D && shape.C >= minShape.C
      );
      if (validShapes.length === 0) return [];
      allPlayerShapes.push(validShapes);
      hasConstraints[i] = true;
    } else if (filter && filter.shapes) {
      const [s, h, d, c] = filter.shapes;
      if (s + h + d + c !== 13) return [];
      if (s < minShape.S || h < minShape.H || d < minShape.D || c < minShape.C) return [];
      allPlayerShapes.push([{ S: s, H: h, D: d, C: c }]);
      hasConstraints[i] = true;
    } else {
      allPlayerShapes.push([]);
      hasConstraints[i] = false;
    }
  }

  const validDistributions = [];

  if (!hasConstraints.some(Boolean)) return [];

  const constrainedPlayers = hasConstraints.filter(Boolean).length;

  if (constrainedPlayers === 4) {
    for (const nShape of allPlayerShapes[0]) {
      for (const sShape of allPlayerShapes[1]) {
        for (const eShape of allPlayerShapes[2]) {
          for (const wShape of allPlayerShapes[3]) {
            if (
              nShape.S + sShape.S + eShape.S + wShape.S === 13 &&
              nShape.H + sShape.H + eShape.H + wShape.H === 13 &&
              nShape.D + sShape.D + eShape.D + wShape.D === 13 &&
              nShape.C + sShape.C + eShape.C + wShape.C === 13
            ) {
              validDistributions.push([nShape, sShape, eShape, wShape]);
            }
          }
        }
      }
    }
  } else if (constrainedPlayers === 3) {
    const freePlayerIdx = hasConstraints.indexOf(false);
    const constrainedIndices = [0, 1, 2, 3].filter((i) => i !== freePlayerIdx);

    for (const shape0 of allPlayerShapes[constrainedIndices[0]]) {
      for (const shape1 of allPlayerShapes[constrainedIndices[1]]) {
        for (const shape2 of allPlayerShapes[constrainedIndices[2]]) {
          const constrainedShapes = [shape0, shape1, shape2];
          const freeShape = {
            S: 13 - (constrainedShapes[0].S + constrainedShapes[1].S + constrainedShapes[2].S),
            H: 13 - (constrainedShapes[0].H + constrainedShapes[1].H + constrainedShapes[2].H),
            D: 13 - (constrainedShapes[0].D + constrainedShapes[1].D + constrainedShapes[2].D),
            C: 13 - (constrainedShapes[0].C + constrainedShapes[1].C + constrainedShapes[2].C),
          };
          if (
            freeShape.S >= 0 && freeShape.H >= 0 && freeShape.D >= 0 && freeShape.C >= 0 &&
            freeShape.S + freeShape.H + freeShape.D + freeShape.C === 13
          ) {
            const result = [{}, {}, {}, {}];
            result[constrainedIndices[0]] = constrainedShapes[0];
            result[constrainedIndices[1]] = constrainedShapes[1];
            result[constrainedIndices[2]] = constrainedShapes[2];
            result[freePlayerIdx] = freeShape;
            validDistributions.push(result);
          }
        }
      }
    }
  } else if (constrainedPlayers === 2) {
    const constrainedIndices = [0, 1, 2, 3].filter((i) => hasConstraints[i]);
    for (const shape0 of allPlayerShapes[constrainedIndices[0]]) {
      for (const shape1 of allPlayerShapes[constrainedIndices[1]]) {
        if (
          shape0.S + shape1.S > 13 || shape0.H + shape1.H > 13 ||
          shape0.D + shape1.D > 13 || shape0.C + shape1.C > 13
        ) {
          continue;
        }
        const result = [null, null, null, null];
        result[constrainedIndices[0]] = shape0;
        result[constrainedIndices[1]] = shape1;
        validDistributions.push(result);
      }
    }
  } else if (constrainedPlayers === 1) {
    const constrainedIdx = hasConstraints.indexOf(true);
    for (const shape of allPlayerShapes[constrainedIdx]) {
      const result = [null, null, null, null];
      result[constrainedIdx] = shape;
      validDistributions.push(result);
    }
  }

  return validDistributions;
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function buildDeck() {
  const allCards = [];
  for (const suit of SUITS) {
    for (const rank of Object.keys(RANK)) {
      allCards.push(makeCard(suit, rank));
    }
  }
  return allCards;
}

function removeFixedFromDeck(deck, fixed_cards) {
  if (!fixed_cards) return;
  for (const player of Object.keys(fixed_cards)) {
    for (const knownCard of fixed_cards[player]) {
      const idx = deck.findIndex((c) => c.suit === knownCard.suit && c.rank === knownCard.rank);
      if (idx !== -1) deck.splice(idx, 1);
    }
  }
}

function constrainedDeal(hands, fixed_cards, targetShapes) {
  const allCards = buildDeck();
  removeFixedFromDeck(allCards, fixed_cards);
  shuffleArray(allCards);

  const cardsBySuit = { S: [], H: [], D: [], C: [] };
  for (const card of allCards) {
    cardsBySuit[card.suit].push(card);
  }

  const dealt = [false, false, false, false];

  if (targetShapes) {
    for (let playerIdx = 0; playerIdx < 4; playerIdx++) {
      const shape = targetShapes[playerIdx];
      if (!shape) continue;

      const hand = hands[playerIdx];
      const playerName = PLAYERS[playerIdx];
      if (fixed_cards && fixed_cards[playerName]) {
        addCardsToHand(hand, fixed_cards[playerName]);
      }

      const currentShape = { S: hand.shape.S, H: hand.shape.H, D: hand.shape.D, C: hand.shape.C };

      for (const suit of SUITS) {
        const needed = shape[suit] - currentShape[suit];
        const suitCards = cardsBySuit[suit];
        if (suitCards.length < needed) return false;
        for (let i = 0; i < needed; i++) {
          addToHand(hand, suitCards.pop());
        }
      }

      dealt[playerIdx] = true;
    }
  }

  const remainingCards = [];
  for (const suit of SUITS) {
    remainingCards.push(...cardsBySuit[suit]);
  }
  shuffleArray(remainingCards);

  for (let playerIdx = 0; playerIdx < 4; playerIdx++) {
    if (dealt[playerIdx]) continue;

    const hand = hands[playerIdx];
    const playerName = PLAYERS[playerIdx];
    if (fixed_cards && fixed_cards[playerName]) {
      addCardsToHand(hand, fixed_cards[playerName]);
    }

    const cardsNeeded = 13 - hand.cards.length;
    if (remainingCards.length < cardsNeeded) return false;
    for (let i = 0; i < cardsNeeded; i++) {
      addToHand(hand, remainingCards.pop());
    }

    dealt[playerIdx] = true;
  }

  return true;
}

function hasShapeConstraints(filters) {
  return Object.values(filters).some((f) => f && (f.ambiguousShape || f.shapes));
}

// Plain random deal (Board.deal without the class), honoring fixed cards.
function randomDeal(hands, fixed_cards) {
  const allCards = buildDeck();
  removeFixedFromDeck(allCards, fixed_cards);
  shuffleArray(allCards);

  const alreadyHave = [0, 0, 0, 0];
  for (const player of Object.keys(fixed_cards || {})) {
    addCardsToHand(hands[PLAYERS.indexOf(player)], fixed_cards[player]);
    alreadyHave[PLAYERS.indexOf(player)] = fixed_cards[player].length;
  }

  for (let i = 0; i < 4; i++) {
    for (let j = alreadyHave[i]; j < 13; j++) {
      addToHand(hands[i], allCards.pop());
    }
  }
}

function serializeHand(hand) {
  return {
    cards: hand.cards.map((c) => ({ suit: c.suit, rank: c.rank })),
    hand: hand.hand,
    points: hand.points,
    shape: hand.shape,
  };
}

function parseHand2(hand, suit) {
  let ret = "";
  for (const card of hand.cards) {
    if (card.suit === suit) {
      ret += card.rank === "10" ? "T" : card.rank;
    }
  }
  return ret;
}

function convertAllHandsToPBN(hands) {
  let str = "N:";
  str += SUITS.map((s) => parseHand2(hands[0], s)).join(".") + " ";
  str += SUITS.map((s) => parseHand2(hands[1], s)).join(".") + " ";
  str += SUITS.map((s) => parseHand2(hands[2], s)).join(".") + " ";
  str += SUITS.map((s) => parseHand2(hands[3], s)).join(".");
  return str;
}

/**
 * Convert a filter's card strings (e.g. "AS", "KD", "TS", "10C") into Card objects.
 * @param {string[]} entries rank-then-suit, "T" = 10.
 * @returns {object[]}
 */
function parseKnownCards(entries) {
  const out = [];
  for (const entry of entries) {
    const m = /^([2-9AKQJ]|10|T)([SHDC])$/.exec(entry.trim());
    if (!m) {
      throw new Error(`Invalid card code "${entry}" (expected rank-then-suit like "AS", "KD", "TS")`);
    }
    const rank = m[1] === "T" ? "10" : m[1];
    out.push(makeCard(m[2], rank));
  }
  return out;
}

function buildFixedCards(filters) {
  let known = undefined;
  for (const player of PLAYERS) {
    const cards = filters[player] && filters[player].cards;
    if (cards && cards.length) {
      if (!known) known = {};
      known[player] = parseKnownCards(cards);
    }
  }
  return known;
}

/**
 * Deal `boardSize` boards satisfying `filters`.
 *
 * @param {number} boardSize how many boards to produce
 * @param {object} filters { N?, S?, E?, W? } each with OneFilterProps:
 *   points[low,high], shapes[4], ambiguousShape[4][2], maxsuit, minsuit,
 *   havesuit[], solid, maxace, minace, cards[]
 * @returns {object[]} serialized boards with PBN + per-hand data
 */
export function dealHands(boardSize, filters) {
  const MAX_ATTEMPTS = 100000;
  const boards = [];

  const useConstrainedDealing = hasShapeConstraints(filters);
  let validShapeDistributions = [];
  const known_cards = buildFixedCards(filters);

  if (useConstrainedDealing) {
    validShapeDistributions = generateGlobalShapeDistribution(filters, known_cards);
    if (validShapeDistributions.length === 0) {
      throw new Error("没有找到符合模糊牌型约束的有效牌型分布，请检查约束条件是否合理");
    }
  }

  const distributionWeights = useConstrainedDealing
    ? validShapeDistributions.map((d) => computeDistributionWeight(d))
    : [];
  let normalizedWeights = [];
  let totalNormalizedWeight = 0;
  if (distributionWeights.length > 0) {
    const maxW = Math.max(...distributionWeights);
    normalizedWeights = distributionWeights.map((w) => w / maxW);
    totalNormalizedWeight = normalizedWeights.reduce((a, b) => a + b, 0);
  }

  for (let boardNum = 1; boardNum <= boardSize; ++boardNum) {
    let attempts = 0;
    let success = false;

    while (attempts < MAX_ATTEMPTS && !success) {
      attempts++;

      const hands = [newHand(), newHand(), newHand(), newHand()];

      if (useConstrainedDealing) {
        let r = Math.random() * totalNormalizedWeight;
        let targetShapes = null;
        for (let i = 0; i < normalizedWeights.length; i++) {
          r -= normalizedWeights[i];
          if (r <= 0) {
            targetShapes = validShapeDistributions[i];
            break;
          }
        }
        if (!targetShapes) {
          targetShapes = validShapeDistributions[validShapeDistributions.length - 1];
        }

        if (!constrainedDeal(hands, known_cards, targetShapes)) {
          continue;
        }
      } else {
        randomDeal(hands, known_cards);
      }

      const filterProps = {};
      for (const player of PLAYERS) {
        if (filters[player]) {
          filterProps[player] = { hand: hands[PLAYERS.indexOf(player)], ...filters[player] };
        }
      }

      if (handFilter(filterProps)) {
        hands.forEach(sortHand);

        const board = {
          boardnum: boardNum,
          vul: vulOfBoard(boardNum),
          dealer: dealerOfBoard(boardNum),
          pbn: convertAllHandsToPBN(hands),
          N: serializeHand(hands[0]),
          S: serializeHand(hands[1]),
          E: serializeHand(hands[2]),
          W: serializeHand(hands[3]),
        };
        boards.push(board);
        success = true;
      }
    }

    if (!success) {
      throw new Error(`无法在 ${MAX_ATTEMPTS} 次尝试内找到符合条件的第 ${boardNum} 副牌`);
    }
  }

  return boards;
}