import Card from "./Card";
import Hand from "./Hand";

export interface HandFilterProps {
  hand: Hand;
  points?: [number, number];
  shapes?: string[] | null;
  maxsuit?: number;
  minsuit?: number;
  havesuit?: number[] | null;
  solid?: boolean;
  maxace?: number;
  minace?: number;
  cards?: Card[];
}

export default function handFilter(props: HandFilterProps): boolean {
  const { hand, points = [0, 37], shapes = null, maxsuit = 13, minsuit = 0, havesuit = null, solid = false, maxace = 4, minace = 0, cards = [] } = props;
  if (hand.points < points[0] || hand.points > points[1]) {
    return false;
  }

  if (shapes !== null) {
    for (const shape of shapes) {
      const [s, h, d, c] = shape.split("-").map(Number);
      if (hand.shape.S !== s || hand.shape.H !== h || hand.shape.D !== d || hand.shape.C !== c) {
        return false;
      }
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

  if (cards.length > 0) {
    for (const card of hand.cards) {
      if (!cards.some(c => c.suit === card.suit && c.rank === card.rank)) {
        return false;
      }
    }
  }

  return true;
}