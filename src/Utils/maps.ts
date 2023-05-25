/**
 * Positions in program will be N,S,E,W
 */

export enum POSITION2FULL {
  "N" = "North",
  "S" = "South",
  "E" = "East",
  "W" = "West"
}

export enum NUMBER2COLORSHORT {
  "S",
  "H",
  "D",
  "C"
}

export enum NUMBER2COLOR {
  "Spade",
  "Heart",
  "Diamond",
  "Club"
}

export enum NUMBER2COLORICON {
  "♠", "♡", "♢", "♣"
}

export type Position = "N" | "S" | "E" | "W";
export type ColorsShort = "S" | "H" | "D" | "C";

export const DEALER = ["W", "N", "E", "S", "W"];

export const VUL = ["EW", "None", "NS", "EW", "Both", "NS", "EW", "Both", "None",
  "EW", "Both", "None", "NS", "Both", "None", "NS", "EW",];


export const POSITION2NUMBER = { "N": 0, "S": 1, "E": 2, "W": 3 };
export const PROGRAM_POSITIONS: Position[] = ["N", "S", "E", "W"];
export const COLORS: ColorsShort[] = ["S", "H", "D", "C"];
export const RANK: { [key: string]: number } = { "A": 0, "K": 1, "Q": 2, "J": 3, "10": 4, "9": 5, "8": 6, "7": 7, "6": 8, "5": 9, "4": 10, "3": 11, "2": 12 };
export const RANK2CARD = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];