import Hand from "./Hand";
import Card from "./Card";
export default class Board extends Hand {
  private static readonly VUL = ["EW", "None", "NS", "EW", "Both", "NS", "EW", "Both", "None",
    "EW", "Both", "None", "NS", "Both", "None", "NS", "EW",];
  private static readonly DEALER = ["W", "N", "E", "S", "W"];

  private boardnum: number;
  private vul: string;
  private dealer: string;
  private Nhand: Hand;
  private Shand: Hand;
  private Ehand: Hand;
  private Whand: Hand;

  constructor(boardnum: number) {
    super();
    this.boardnum = boardnum;

    const vul_key = boardnum % 16;
    this.vul = Board.VUL[vul_key];

    const dealer_key = boardnum % 4;
    this.dealer = Board.DEALER[dealer_key];

    this.Nhand = new Hand();
    this.Shand = new Hand();
    this.Ehand = new Hand();
    this.Whand = new Hand();
  }

  public shuffle(): void {
    // 生成一副新牌
    for (const suit of Card.SUIT) {
      for (const rank of Card.RANK) {
        this.add(new Card(suit, rank));
      }
    }

    // 洗牌
    shuffle(this.cards);
  }

  public deal(hands: Hand[]): void {
    // 发牌
    for (let round = 0; round < 13; round++) {
      for (let player = 0; player < 4; player++) {
        const top = round * 4 + player;
        hands[player].add(this.cards[top]);
      }
    }

    // 保存发牌结果
    this.Nhand = hands[0];
    this.Shand = hands[1];
    this.Ehand = hands[2];
    this.Whand = hands[3];
  }
}