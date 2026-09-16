import Board from "../../models/Board";
import { Contract, calcHCP, getContractTricks, SUIT_NAMES } from "../../Utils/bridgePlay";
import ShowTricks from "./ShowTricks";

interface ResultPanelProps {
  board: Board;
  ddsTable: (string | number)[][] | null;
  trickNumber: number;
  nsTricks: number;
  contract: Contract | null;
}

export default function ResultPanel(props: ResultPanelProps) {
  const { board, ddsTable, trickNumber, nsTricks, contract } = props;

  return (
    <aside className="result-info-panel">
      <div className="info-box">
        <h4 className="info-box-title">四明手分析</h4>
        {ddsTable ? <ShowTricks ddtricks={ddsTable} /> : <span className="dds-hint">计算中...</span>}
        {trickNumber > 0 && <div className="dds-subtitle">还剩 {13 - trickNumber} 墩</div>}
      </div>

      <div className="info-box">
        <h4 className="info-box-title">大牌点</h4>
        <table className="hcp-table">
          <tbody>
            <tr>
              <td></td>
              <td>{calcHCP(board.Nhand)}</td>
              <td></td>
            </tr>
            <tr>
              <td>{calcHCP(board.Whand)}</td>
              <td></td>
              <td>{calcHCP(board.Ehand)}</td>
            </tr>
            <tr>
              <td></td>
              <td>{calcHCP(board.Shand)}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      {contract && (
        <div className="info-box">
          <h4 className="info-box-title">当前定约</h4>
          <div className="contract-display">
            <span className="contract-level">{contract.level}</span>
            <span className={`contract-strain ${contract.strain === "H" || contract.strain === "D" ? "bridge-card-red" : ""}`}>
              {SUIT_NAMES[contract.strain]}
            </span>
            <span className="contract-declarer">{contract.declarer}</span>
          </div>
          <div className="contract-target">
            需要 {getContractTricks(contract.level)} 墩 | 已得 {nsTricks} 墩
          </div>
        </div>
      )}
    </aside>
  );
}