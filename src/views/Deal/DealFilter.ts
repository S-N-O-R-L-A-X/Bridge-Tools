import Card from "./Card";
import Hand from "./Hand";

export default function handFilter(hand: Hand, points: [number, number] = [0, 37], shapes: string[] | null = null, maxsuit: number = 13, minsuit: number = 0, havesuit: number[] | null = null, solid: boolean = false, maxace: number = 4, minace: number = 0, cards: Card[] = []): boolean {
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

  // if (hand.shape[max((hand.shape))] > maxsuit) {
  //   return false;
  // }

  // if (hand.shape[min(hand.shape)] < minsuit) {
  //   return false;
  // }

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
        // if (new Card(max(hand.shape), highcard[i]).suit === card.suit && new Card(max(hand.shape), highcard[i]).rank === card.rank) {
        //   highcardnum++;
        // }
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