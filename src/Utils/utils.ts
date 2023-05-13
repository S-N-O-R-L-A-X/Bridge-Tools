import Card from "../views/Deal/Card";
import { COLORS, NUMBER2COLORSHORT, RANK, RANK2CARD } from "./maps";

export function idx2card(idx: number): Card {
  const color = Math.floor(idx / 13), rank = idx % 13;
  return new Card(COLORS[color], RANK2CARD[rank]);
}

export function card2idx(card: Card): number {
  return Card.RANK[card.rank] + 13 * (NUMBER2COLORSHORT[card.suit]);
}