export default class Card {
  static SUIT: string[] = ["S", "H", "D", "C"];
  static RANK: string[] = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
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