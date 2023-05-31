/**
 * https://dds.bridgewebs.com/cgi-bin/bsol2/ddummy
 * example url: https://dds.bridgewebs.com/cgi-bin/bsol2/ddummy?trumps=c&leader=e&dealstr=752.42.842.A9842xAKQ.AKJ9.AQT.KT7xJT98.QT76.J976.Jx643.853.K53.Q653&requesttoken=1685252040620&request=g&uniqueTID=1685252040620&_=1685251967516
 * example url: https://dds.bridgewebs.com/cgi-bin/bsol2/ddummy?request=m&dealstr=W:Q2.52.AJ63.A8532xJT98.JT98.KQT8.TxK53.KQ74.75.KQJ7xA764.A63.942.964&vul=None&sockref=1685264885620&uniqueTID=1685264885622&_=1685263070398
*/
import { useState } from "react";
import PlayBoard from "../../Components/PlayBoard/PlayBoard";

interface RequestSpecificTrump {
  trumps: "s" | "h" | "d" | "c" | "n";
  leader: "n" | "s" | "e" | "w";
  request: "g";
  requesttoken?: number;
  uniqueTID: number; // get by new Date().getTime()
  dealstr: string; // W N E S
}

interface RequestBoard {
  dealstr: string;
  sockref?: number;
  request: "m"; // g means steps in analysis, m means get straight
  uniqueTID: number; // get by new Date().getTime()
  vul?: "None"
}

export default function BridgeSovler() {
  const [predictedContract, setPredictedContract] = useState<string>();
  const [predictedScore, setPredictedScore] = useState<string>();
  const [ddtricks, setDDtricks] = useState<string>();
  function handleClick() {
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
    fetch(url).then((res) => {
      return res.json()
    }).then((x: any) => {
      console.log(x);
      setDDtricks(x.sess.ddtricks);
      setPredictedContract(x.contractsNS.substring(3));
      setPredictedScore(x.scoreNS)
    })
  }
  return (
    <>
      <button onClick={handleClick}>analyse</button>
      <PlayBoard predictedContract={predictedContract} predictedScore={predictedScore} ddtricks={ddtricks} />
    </>
  )

}