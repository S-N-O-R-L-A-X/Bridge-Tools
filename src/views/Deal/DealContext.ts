import { createContext } from "react";

export interface DealContextProps {
  contextType: string;
  known_cards: number[];
  changeKnown_cards: Function;
}

export const DealContext = createContext<DealContextProps>({ contextType: "analysis", known_cards: new Array(52).fill(-1), changeKnown_cards: () => {} });
