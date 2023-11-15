import Card from "../views/Deal/Card";
import Hand from "../views/Deal/Hand";
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
