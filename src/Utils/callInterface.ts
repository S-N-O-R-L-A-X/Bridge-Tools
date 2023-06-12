import Hand from "../views/Deal/Hand";
import { retryFetch } from "./utils";

interface RequestBoard {
  dealstr: string;
  sockref?: number;
  request: "m"; // g means steps in analysis, m means get straight
  uniqueTID: number; // get by new Date().getTime()
  vul?: "None"
}

function parseHand(hand: Hand) {
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

export async function callDDSOL(hands: Hand[]) {
  const tid = new Date().getTime();
  const params: RequestBoard = {
    dealstr: "W:",
    sockref: 0,
    request: "m",
    uniqueTID: 0,
  }
  params.sockref = tid;
  params.uniqueTID = tid;
  params.dealstr += parseHand(hands[3]) + "x" + parseHand(hands[0]) + "x" + parseHand(hands[2]) + "x" + parseHand(hands[1]);
  // params.dealstr += "Q2.52.AJ63.A8532xJT98.JT98.KQT8.TxK53.KQ74.75.KQJ7xA764.A63.942.964";

  let url = "https://dds.bridgewebs.com/cgi-bin/bsol2/ddummy?";
  for (const [key, value] of Object.entries(params)) {
    url += key + "=" + value + "&";
  }
  url = url.substring(0, url.length - 1); // delete last &
  const res = await retryFetch(url) as Response;
  return res.json();
}