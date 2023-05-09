import { ColorsShort } from "../../Utils/maps";
import Card from "./Card";
export default class Hand {
  cards: Card[];
  hand: { [key: string]: string[] };
  points: number;
  shape: { [key: string]: number };

  constructor() {
    this.cards = [];
    this.hand = { S: [], H: [], D: [], C: [] };
    this.points = 0;
    this.shape = { S: 0, H: 0, D: 0, C: 0 };
  }

  getMostCards(): ColorsShort[] {
    const M = Math.max(...Object.values(this.shape));
    const ret: ColorsShort[] = [];
    for (const [key, val] of Object.entries(this.shape)) {
      if (val === M) {
        ret.push(key as ColorsShort);
      }
    }
    return ret;
  }

  getFewestCards(): ColorsShort[] {
    const M = Math.min(...Object.values(this.shape));
    const ret: ColorsShort[] = [];
    for (const [key, val] of Object.entries(this.shape)) {
      if (val === M) {
        ret.push(key as ColorsShort);
      }
    }
    return ret;
  }

  add(card: Card): void {
    this.cards.push(card);
    this.hand[card.suit].push(card.rank);
    this.points += card.points;
    this.shape[card.suit] += 1;
  }

  addCards(cards: Card[]): void {
    cards.forEach((card) => {
      this.cards.push(card);
      this.hand[card.suit].push(card.rank);
      this.points += card.points;
      this.shape[card.suit] += 1;
    })
  }

  // 整理手牌
  sortHand(): void {
    const index = [...Array(13).keys()];
    for (const key in this.hand) {
      this.hand[key].sort((a, b) => index[Card.RANK[a]] - index[Card.RANK[b]]);
    }
  }

  showWithColors(): string[] {
    const show: string[] = [];
    this.sortHand();

    for (const key in this.hand) {
      show.push(key + " " + this.hand[key].join(""));
    }

    return show;
  }

  showWithoutColors(): string[] {
    const show: string[] = [];
    this.sortHand();

    for (const key in this.hand) {
      show.push(this.hand[key].join(""));
    }

    return show;

  }
}