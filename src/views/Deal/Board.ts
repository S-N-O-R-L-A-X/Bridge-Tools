import Hand from "./Hand";
import Card from "./Card";
import { NUMBER2COLORSHORT, POSITION2FULL } from "../../Utils/maps";

function shuffleAlgo(arr: any[]) {
  let n = arr.length, rand;
  while (n !== 0) {
    rand = (Math.random() * n--) >>> 0; // 无符号右移位运算符向下取整 
    //或者改写成 random = Math.floor(Math.random() * n--)
    [arr[n], arr[rand]] = [arr[rand], arr[n]] // ES6的解构赋值实现变量互换
  }
  return arr;
}

export default class Board {
  private static readonly VUL = ["EW", "None", "NS", "EW", "Both", "NS", "EW", "Both", "None",
    "EW", "Both", "None", "NS", "Both", "None", "NS", "EW",];
  private static readonly DEALER = ["W", "N", "E", "S", "W"];

  all_cards: Card[];
  known_cards: Set<number>;
  boardnum: number;
  vul: string;
  dealer: string;
  Nhand: Hand;
  Shand: Hand;
  Ehand: Hand;
  Whand: Hand;

  constructor(boardnum: number) {
    this.boardnum = boardnum;

    const vul_key = boardnum % 16;
    this.vul = Board.VUL[vul_key];
    this.all_cards = [];
    this.known_cards = new Set<number>();

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
      for (const rank in Card.RANK) {
        this.all_cards.push(new Card(suit, rank));
      }
    }

    // 洗牌
    shuffleAlgo(this.all_cards);
  }

  public deal(hands: Hand[], fixed_cards?: { [key: string]: Card[] }): void {
    // deal known cards

    if (fixed_cards) {
      for (const player in fixed_cards) {
        console.log(player);
        const known_cards: Card[] = fixed_cards[player];
        switch (player) {
          case "N": hands[0].addCards(known_cards); break;
          case "S": hands[1].addCards(known_cards); break;
          case "E": hands[2].addCards(known_cards); break;
          case "W": hands[3].addCards(known_cards); break;
        }
        known_cards.forEach((known_card) => {
          this.known_cards.add(Card.RANK[known_card.rank] + (NUMBER2COLORSHORT[known_card.suit]));
        })
      }
    }

    this.shuffle();

    // 发牌
    for (let round = 0; round < 13; round++) {
      for (let player = 0; player < 4; player++) {
        const top = round * 4 + player;
        hands[player].add(this.all_cards[top]);
      }
    }

    // 保存发牌结果
    this.Nhand = hands[0];
    this.Shand = hands[1];
    this.Ehand = hands[2];
    this.Whand = hands[3];
  }
}