import Card from "../views/Deal/Card";
import { COLORS, RANK, RANK2CARD } from "./maps";

export function idx2Card(idx: number): Card {
  const color = Math.floor(idx / 13), rank = idx % 13;
  return new Card(COLORS[color], RANK2CARD[rank]);
}