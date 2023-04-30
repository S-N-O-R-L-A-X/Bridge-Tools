export default class Card {
  static SUIT: string[] = ["S", "H", "D", "C"];
  static RANK: { [key: string]: number } = { "A": 0, "K": 1, "Q": 2, "J": 3, "10": 4, "9": 5, "8": 6, "7": 7, "6": 8, "5": 9, "4": 10, "3": 11, "2": 12 };
  static POINT: { [key: string]: number } = { "A": 4, "K": 3, "Q": 2, "J": 1, "10": 0, "9": 0, "8": 0, "7": 0, "6": 0, "5": 0, "4": 0, "3": 0, "2": 0 };

  suit: string;
  rank: string;
  points: number;

  constructor(suit: string, rank: string) {
    this.suit = suit;
    this.rank = rank;
    this.points = Card.POINT[rank];
  }

  public show(): void {
    console.log(this.suit + this.rank);
  }
}