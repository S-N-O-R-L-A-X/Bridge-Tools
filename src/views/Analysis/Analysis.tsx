const cardToSpotMap: { [key: string]: number } = { "A": 14, "K": 13, "Q": 12, "J": 11, "T": 10 };
for (let i = 2; i < 10; i++) {
  cardToSpotMap[i.toString()] = i;
}

class Hand {
  rawCard: { [key: string]: string[] } = {};
  card: { [key: string]: number[] } = {};
  position: string;

  constructor(handStr: string, position: string) {
    const handList = handStr.split(".");
    this.rawCard['S'] = handList[0].split('');
    this.rawCard['H'] = handList[1].split('');
    this.rawCard['D'] = handList[2].split('');
    this.rawCard['C'] = handList[3].split('');

    const SUIT = ['S', 'H', 'D', 'C'];
    for (const suit of SUIT) {
      this.card[suit] = this.rawCard[suit].map((card: string) => cardToSpotMap[card]);
    }

    this.position = position;
  }

  toString() {
    let ret = "==" + this.position + "==\n";
    ret += "S:" + this.rawCard['S'].join('') + "\n";
    ret += "H:" + this.rawCard['H'].join('') + "\n";
    ret += "D:" + this.rawCard['D'].join('') + "\n";
    ret += "C:" + this.rawCard['C'].join('') + "\n";
    return ret;
  }
}

class Board {
  hand: { [key: string]: Hand } = {};

  constructor(boardStr: string) {
    const field: { [key: string]: number } = {};
    if (boardStr[0] === "N") {
      field["N"] = 0;
      field["E"] = 1;
      field["S"] = 2;
      field["W"] = 3;
    }

    const boardList = boardStr.slice(2).split(' ');
    for (const player in field) {
      this.hand[player] = new Hand(boardList[field[player]], player);
    }
  }

  toString() {
    let ret = this.hand['N'].toString() + "\n" + this.hand["E"].toString() + "\n";
    ret += this.hand['S'].toString() + "\n" + this.hand["W"].toString() + "\n";
    return ret;
  }
}

class PlayRecord {
  board: Board;
  trump: string;
  nstrick: number;
  ewtrick: number;

  constructor(board: Board, trump: string) {
    this.board = board;
    this.trump = trump;
    this.nstrick = 0;
    this.ewtrick = 0;
  }

  trick_winner(cards: any, leading_player: string) {
    let ruling_suit = cards[0][0];
    let largest_spot = cards[0][1];
    let largest_player = leading_player;
    for (let i = 1; i < 4; i++) {
      const player = ["N", "E", "S", "W"][(["N", "E", "S", "W"].indexOf(leading_player) + i) % 4];
      const card = cards[i];
      if (card[0] == this.trump && ruling_suit != this.trump) {
        ruling_suit = this.trump;
        largest_spot = card[1];
        largest_player = player;
      } else if (card[0] == ruling_suit && card[1] > largest_spot) {
        largest_spot = card[1];
        largest_player = player;
      }
    }
    return largest_player;
  }

  can_play_list(player: string, leading_card?: any) {
    const ret = [];
    const this_hand = this.board.hand[player];
    const SUIT = ["S", "H", "D", "C"];
    for (const suit of SUIT) {
      for (const card of this_hand.card[suit]) {
        ret.push([suit, card]);
      }
    }
    return ret;
  }

}

export default function Analysis() {
  function handleClick() {

    const board_str = "N:AJT9.732.9764.T5 85.A96.T32.A9874 KQ73.QT8.AJ8.KQ3 642.KJ54.KQ5.J62";
    const board = new Board(board_str);
    const pr = new PlayRecord(board, "NT");

    console.log(board);

    const can_play_list: any = {};
    can_play_list["N"] = pr.can_play_list("N");
    can_play_list["W"] = pr.can_play_list("W");
    can_play_list["E"] = pr.can_play_list("E");
    can_play_list["S"] = pr.can_play_list("S");

    const PLAYER = ["N", "E", "S", "W"];

    for (let i = 0; i < 10; i++) {
      const cards = [];
      for (const player of PLAYER) {
        const j = Math.floor(Math.random() * 13);
        cards.push(can_play_list[player][j]);
      }
      const j = Math.floor(Math.random() * 4);
      console.log(cards, PLAYER[j]);
      console.log(pr.trick_winner(cards, PLAYER[j]));
    }

  }

  return (
    <>This is under constuction...</>
    // <button onClick={handleClick}></button>
  )
}

