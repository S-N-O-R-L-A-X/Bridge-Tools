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

  add(card: Card): void {
    this.cards.push(card);
    this.hand[card.suit].push(card.rank);
    this.points += card.points;
    this.shape[card.suit] += 1;
  }

  // 整理手牌
  sortHand(): void {
    const index = [...Array(13).keys()];
    for (const key in this.hand) {
      this.hand[key].sort((a, b) => index[Card.RANK[a]] - index[Card.RANK[b]]);
    }
  }

  show(): string[] {
    const show: string[] = [];
    this.sortHand();

    for (const key in this.hand) {
      show.push(key + " " + this.hand[key].join(""));
    }

    return show;
  }
}