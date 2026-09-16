import { Position, TRUMP } from "../../Utils/maps";
import { Contract, formatContract } from "../../Utils/bridgePlay";

interface ContractPanelProps {
  selectedLevel: number | null;
  selectedStrain: TRUMP | null;
  selectedDeclarer: Position | null;
  setSelectedLevel: (v: number | null) => void;
  setSelectedStrain: (v: TRUMP | null) => void;
  setSelectedDeclarer: (v: Position | null) => void;
  contract: Contract | null;
  contractReady: boolean;
  showTrickStatus: boolean;
  setShowTrickStatus: (v: boolean) => void;
  undoLength: number;
  handleConfirmContract: () => void;
  undoPlay: () => void;
  resetBoard: () => void;
}

export default function ContractPanel(props: ContractPanelProps) {
  const {
    selectedLevel, selectedStrain, selectedDeclarer,
    setSelectedLevel, setSelectedStrain, setSelectedDeclarer,
    contract, contractReady, showTrickStatus, setShowTrickStatus,
    undoLength, handleConfirmContract, undoPlay, resetBoard,
  } = props;

  return (
    <section className="contract-panel">
      <h4 className="contract-panel-title">定约选择</h4>

      <div className="contract-level-grid">
        {[1, 2, 3, 4, 5, 6, 7].map(level => (
          <button
            key={level}
            className={`analysis-choice ${selectedLevel === level ? "analysis-choice-active" : ""}`}
            onClick={() => setSelectedLevel(level)}
          >
            {level}
          </button>
        ))}
      </div>

      <div className="contract-strain-grid">
        <button
          className={`analysis-choice ${selectedStrain === "C" ? "analysis-choice-active" : ""}`}
          onClick={() => setSelectedStrain("C")}
        >
          ♣
        </button>
        <button
          className={`analysis-choice analysis-choice-red ${selectedStrain === "D" ? "analysis-choice-active" : ""}`}
          onClick={() => setSelectedStrain("D")}
        >
          ♦
        </button>
        <button
          className={`analysis-choice analysis-choice-red ${selectedStrain === "H" ? "analysis-choice-active" : ""}`}
          onClick={() => setSelectedStrain("H")}
        >
          ♥
        </button>
        <button
          className={`analysis-choice ${selectedStrain === "S" ? "analysis-choice-active" : ""}`}
          onClick={() => setSelectedStrain("S")}
        >
          ♠
        </button>
        <button
          className={`analysis-choice ${selectedStrain === "NT" ? "analysis-choice-active" : ""}`}
          onClick={() => setSelectedStrain("NT")}
        >
          NT
        </button>
      </div>

      <div className="contract-declarer-grid">
        {(["N", "E", "S", "W"] as Position[]).map(pos => (
          <button
            key={pos}
            className={`analysis-choice ${selectedDeclarer === pos ? "analysis-choice-active" : ""}`}
            onClick={() => setSelectedDeclarer(pos)}
          >
            {pos}
          </button>
        ))}
      </div>

      <button
        className="confirm-contract-btn"
        onClick={handleConfirmContract}
        disabled={!contractReady || contract !== null}
      >
        {contract ? `已确认: ${formatContract(contract)}` : "确认定约"}
      </button>

      <label className="trick-status-toggle">
        <input
          type="checkbox"
          checked={showTrickStatus}
          onChange={e => setShowTrickStatus(e.target.checked)}
        />
        <span>显示每张牌后的赢墩情况</span>
      </label>

      {contract && (
        <button className="reset-btn" onClick={resetBoard}>
          重新发牌
        </button>
      )}

      {contract && (
        <button
          className="reset-btn undo-btn"
          onClick={undoPlay}
          disabled={undoLength === 0}
        >
          上一步
        </button>
      )}
    </section>
  );
}