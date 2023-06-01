import Hand from "../views/Deal/Hand";

interface RequestBoard {
  dealstr: string;
  sockref?: number;
  request: "m"; // g means steps in analysis, m means get straight
  uniqueTID: number; // get by new Date().getTime()
  vul?: "None"
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
  params.dealstr += "Q2.52.AJ63.A8532xJT98.JT98.KQT8.TxK53.KQ74.75.KQJ7xA764.A63.942.964";

  let url = "https://dds.bridgewebs.com/cgi-bin/bsol2/ddummy?";
  for (const [key, value] of Object.entries(params)) {
    url += key + "=" + value + "&";
  }
  url = url.substring(0, url.length - 1); // delete last &
  let ret;
  const res = await fetch(url);
  return res.json();
}