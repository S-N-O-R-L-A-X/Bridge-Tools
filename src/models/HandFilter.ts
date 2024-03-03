import Card from "./Card";
import Hand from "./Hand";

export interface OneHandFilterProps {
  hand: Hand;
  points?: [number, number];
  shapes?: number[] | null;
  maxsuit?: number;
  minsuit?: number;
  havesuit?: number[] | null;
  solid?: boolean;
  maxace?: number;
  minace?: number;
  cards?: Card[];
  ambiguousShape?: number[][];
}

export type OneFilterProps = Omit<OneHandFilterProps, "hand">;

export interface HandFilterProps {
  [key: string]: OneHandFilterProps;
}

function oneHandFilter(props: OneHandFilterProps): boolean {
  const { hand, points = [0, 37], shapes = null, maxsuit = 13, minsuit = 0, havesuit = null, solid = false, maxace = 4, minace = 0, cards = [], ambiguousShape } = props;
  if (hand.points < points[0] || hand.points > points[1]) {
    return false;
  }

  if (shapes !== null) {
    const [s, h, d, c] = shapes;
    if (hand.shape.S !== s || hand.shape.H !== h || hand.shape.D !== d || hand.shape.C !== c) {
      return false;
    }
  }

  if (ambiguousShape) {
    const [[minSpades, maxSpades], [minHearts, maxHearts], [minDiamonds, maxDiamonds], [minClubs, maxClubs]] = ambiguousShape;
    if (hand.shape.S < minSpades || hand.shape.S > maxSpades || hand.shape.H < minHearts || hand.shape.H > maxHearts ||
      hand.shape.D < minDiamonds || hand.shape.D > maxDiamonds || hand.shape.C < minClubs || hand.shape.C > maxClubs) {
      return false;
    }
  }

  if (hand.shape[hand.getMostCards()[0]] > maxsuit) {
    return false;
  }

  if (hand.shape[hand.getFewestCards()[0]] < minsuit) {
    return false;
  }

  if (havesuit !== null) {
    let have = false;
    for (const suitlength of havesuit) {
      if (Object.values(hand.shape).includes(suitlength)) {
        have = true;
        break;
      }
    }
    if (!have) {
      return false;
    }
  }

  if (solid) {
    const highcard = ["A", "K", "Q", "J"];
    let highcardnum = 0;

    for (const card of hand.cards) {
      for (let i = 0; i < 4; i++) {
        if (new Card(hand.getMostCards()[0], highcard[i]).suit === card.suit && new Card(hand.getMostCards()[0], highcard[i]).rank === card.rank) {
          highcardnum++;
        }
      }
    }

    if (highcardnum < 3) {
      return false;
    }
  }

  let aces = 0;
  for (const card of hand.cards) {
    if (card.rank === "A") {
      aces++;
    }
  }
  if (aces > maxace) {
    return false;
  }
  if (aces < minace) {
    return false;
  }

  return true;

}


export default function handFilter(props: HandFilterProps): boolean {
  const { N, S, E, W } = props;
  if (N && !oneHandFilter(N)) {
    return false;
  }
  if (S && !oneHandFilter(S)) {
    return false;
  }
  if (E && !oneHandFilter(E)) {
    return false;
  }
  if (W && !oneHandFilter(W)) {
    return false;
  }
  return true;
}