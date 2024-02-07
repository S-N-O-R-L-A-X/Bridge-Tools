import Card from "../models/Card";
import Hand from "../models/Hand";
import { COLORS, NUMBER2COLORSHORT, RANK2CARD } from "./maps";

export function idx2card(idx: number): Card {
  const color = Math.floor(idx / 13), rank = idx % 13;
  return new Card(COLORS[color], RANK2CARD[rank]);
}

export function card2idx(card: Card): number {
  return Card.RANK[card.rank] + 13 * (NUMBER2COLORSHORT[card.suit]);
}

export function parseHand(hand: Hand) {
  let ret = "";
  function replace10(cards: string[]) {
    cards.forEach((card) => {
      if (card === "10") {
        ret += "T";
      }
      else {
        ret += card;
      }
    })
  }
  replace10(hand.hand["S"]);
  ret += ".";
  replace10(hand.hand["H"]);
  ret += ".";
  replace10(hand.hand["D"]);
  ret += ".";
  replace10(hand.hand["C"]);
  return ret;
}

function convertAllHandsToPBN(allHands: Hand[]) {
  let str = "N:";
  str += parseHand(allHands[0]) + " " + parseHand(allHands[2]) + " " + parseHand(allHands[1]) + " " + parseHand(allHands[3]);
  return str;
}

export function analyzeOffline(allHands: Hand[]) {
  // @ts-ignore
  const res = calcDDTable(convertAllHandsToPBN(allHands));
  const table = new Array(4).fill(0).map(() => new Array(5).fill("*"));
  table[0][0] = res["N"]["N"];
  table[0][1] = res["S"]["N"];
  table[0][2] = res["H"]["N"];
  table[0][3] = res["D"]["N"];
  table[0][4] = res["C"]["N"];
  table[1][0] = res["N"]["S"];
  table[1][1] = res["S"]["S"];
  table[1][2] = res["H"]["S"];
  table[1][3] = res["D"]["S"];
  table[1][4] = res["C"]["S"];
  table[2][0] = res["N"]["E"];
  table[2][1] = res["S"]["E"];
  table[2][2] = res["H"]["E"];
  table[2][3] = res["D"]["E"];
  table[2][4] = res["C"]["E"];
  table[3][0] = res["N"]["W"];
  table[3][1] = res["S"]["W"];
  table[3][2] = res["H"]["W"];
  table[3][3] = res["D"]["W"];
  table[3][4] = res["C"]["W"];
  return Promise.resolve(table);
}


export async function sleep(millis: number) {
  await new Promise((resolve, reject) => {
    setTimeout(resolve, millis);
  })
}

export function retryFetch(url: string, times = 1e9 + 7) {
  return new Promise((resolve, reject) => {
    const attempt = () => {
      fetch(url).then((res: any) => {
        console.log(res);
        if (res.ok) {
          resolve(res);
        }
        else {
          throw new Error(res);
        }
      }).catch(async (err: Error) => {
        await sleep(10000);
        times-- > 0 ? attempt() : reject("fail");
      })
    }

    attempt();
  })
}
