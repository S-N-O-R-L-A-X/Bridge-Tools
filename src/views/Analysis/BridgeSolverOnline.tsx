/**
 * https://dds.bridgewebs.com/cgi-bin/bsol2/ddummy
 * example url: https://dds.bridgewebs.com/cgi-bin/bsol2/ddummy?trumps=c&leader=e&dealstr=752.42.842.A9842xAKQ.AKJ9.AQT.KT7xJT98.QT76.J976.Jx643.853.K53.Q653&requesttoken=1685252040620&request=g&uniqueTID=1685252040620&_=1685251967516
 * example url: https://dds.bridgewebs.com/cgi-bin/bsol2/ddummy?request=m&dealstr=W:Q2.52.AJ63.A8532xJT98.JT98.KQT8.TxK53.KQ74.75.KQJ7xA764.A63.942.964&vul=None&sockref=1685264885620&uniqueTID=1685264885622&_=1685263070398
*/
import { useEffect, useState } from "react";
import ShowTricks from "../../Components/PlayBoard/ShowTricks";
import ShowCards from "../../Components/ShowCards/ShowCards";
import { callDDSOL } from "../../Utils/callInterface";
import Hand from "../Deal/Hand";

interface RequestSpecificTrump {
  trumps: "s" | "h" | "d" | "c" | "n";
  leader: "n" | "s" | "e" | "w";
  request: "g";
  requesttoken?: number;
  uniqueTID: number; // get by new Date().getTime()
  dealstr: string; // W N E S
}



interface BridgeSolverProps {
  allHands?: Hand[];
  boardNumber?: number;
}

export default function BridgeSolver(props: BridgeSolverProps) {
  const { allHands = [], boardNumber = 1 } = props;
  const [predictedContract, setPredictedContract] = useState<string>();
  const [predictedScore, setPredictedScore] = useState<string>();
  const [ddtricks, setDDtricks] = useState<string>();

  async function analyzeOL() {
    const res = await callDDSOL(allHands);
    setDDtricks(res.sess.ddtricks);
    setPredictedContract(res.contractsNS.substring(3));
    setPredictedScore(res.scoreNS)
  }

  useEffect(() => {
    analyzeOL();
  }, [allHands]);

  const ShowTricksInstance = <ShowTricks ddtricks={ddtricks} />;

  return (
    <>
      {/* <ShowCards all_hands={allHands} board_number={boardNumber} doubleDummy={ShowTricksInstance} >
        <p>{predictedContract}</p>
        <p>{predictedScore}</p>
      </ShowCards> */}
    </>
  )

}