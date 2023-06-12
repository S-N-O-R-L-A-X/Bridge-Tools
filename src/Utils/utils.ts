import Card from "../views/Deal/Card";
import { COLORS, NUMBER2COLORSHORT, RANK2CARD } from "./maps";

export function idx2card(idx: number): Card {
  const color = Math.floor(idx / 13), rank = idx % 13;
  return new Card(COLORS[color], RANK2CARD[rank]);
}

export function card2idx(card: Card): number {
  return Card.RANK[card.rank] + 13 * (NUMBER2COLORSHORT[card.suit]);
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