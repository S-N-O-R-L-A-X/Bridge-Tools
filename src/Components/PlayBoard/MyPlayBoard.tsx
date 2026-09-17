import { Position } from "../../Utils/maps";
import Board from "../../models/Board";
import usePlayGame from "./usePlayGame";
import HandSeat from "./HandSeat";
import TrickArea from "./TrickArea";
import ContractPanel from "./ContractPanel";
import ResultPanel from "./ResultPanel";
import { formatContract, getContractTricks } from "../../Utils/bridgePlay";
import "./MyPlayBoard.css";

interface MyPlayBoardProps {
  board?: Board;
}

export default function MyPlayBoard({ board: initialBoard }: MyPlayBoardProps = {}) {
  const {
    board, contract, ddsTable,
    currentTrick, trickNumber, currentPlayer, nsTricks, ewTricks,
    cardTricks, playedMap, remainingHands, origHands,
    selectedLevel, selectedStrain, selectedDeclarer, showTrickStatus, contractReady,
    gameOver, undoLength,
    setSelectedLevel, setSelectedStrain, setSelectedDeclarer, setShowTrickStatus,
    handleConfirmContract, handleCardClick, undoPlay, resetBoard,
  } = usePlayGame(initialBoard);

  const seatActive = (pos: Position) => pos === currentPlayer && !gameOver && contract !== null;

  return (
    <div className="my-playboard">
      <div className="result-layout">
        <section className="bridge-table">
          <div className="vul-board">
            <svg className="vul-board-svg" viewBox="0 0 224 132">
              <rect x="2" y="2" width="220" height="128" fill="#fff" stroke="#050505" strokeWidth="4" />
              <polygon fill="#fff" points="4,4 220,4 162,48 62,48" />
              <polygon fill="#fff" points="220,4 220,128 162,84 162,48" />
              <polygon fill="#fff" points="4,128 220,128 162,84 62,84" />
              <polygon fill="#fff" points="4,4 62,48 62,84 4,128" />
              <line x1="4" y1="4" x2="62" y2="48" stroke="#050505" strokeWidth="4" />
              <line x1="220" y1="4" x2="162" y2="48" stroke="#050505" strokeWidth="4" />
              <line x1="4" y1="128" x2="62" y2="84" stroke="#050505" strokeWidth="4" />
              <line x1="220" y1="128" x2="162" y2="84" stroke="#050505" strokeWidth="4" />
              <text x="112" y="26" fill="#111" textAnchor="middle" dominantBaseline="middle" fontSize="22" fontWeight="900">
                {board.vul === "NS" ? "N" : board.vul === "EW" ? "E" : board.vul === "Both" ? "B" : "D"}
              </text>
            </svg>
            <button className="board-number" onClick={resetBoard}>第 {board.boardnum} 副</button>
          </div>

          <div className="seat seat-north">
            <HandSeat pos="N" hand={remainingHands.N} orig={origHands.N} playedMap={playedMap} cardTricks={cardTricks} isCurrent={seatActive("N")} contract={contract} currentTrick={currentTrick} showTrickStatus={showTrickStatus} onCardClick={handleCardClick} />
          </div>
          <div className="seat seat-west">
            <HandSeat pos="W" hand={remainingHands.W} orig={origHands.W} playedMap={playedMap} cardTricks={cardTricks} isCurrent={seatActive("W")} contract={contract} currentTrick={currentTrick} showTrickStatus={showTrickStatus} onCardClick={handleCardClick} />
          </div>

          <TrickArea currentTrick={currentTrick} contract={contract} showTrickStatus={showTrickStatus} />

          <div className="seat seat-east">
            <HandSeat pos="E" hand={remainingHands.E} orig={origHands.E} playedMap={playedMap} cardTricks={cardTricks} isCurrent={seatActive("E")} contract={contract} currentTrick={currentTrick} showTrickStatus={showTrickStatus} onCardClick={handleCardClick} />
          </div>
          <div className="seat seat-south">
            <HandSeat pos="S" hand={remainingHands.S} orig={origHands.S} playedMap={playedMap} cardTricks={cardTricks} isCurrent={seatActive("S")} contract={contract} currentTrick={currentTrick} showTrickStatus={showTrickStatus} onCardClick={handleCardClick} />
          </div>

          {contract && (
            <div className="table-status table-status-bottom">
              <span>{formatContract(contract)} | {getContractTricks(contract.level)} 墩</span>
              <span>NS:{nsTricks} EW:{ewTricks}/{trickNumber}</span>
            </div>
          )}
        </section>

        <ContractPanel
          selectedLevel={selectedLevel}
          selectedStrain={selectedStrain}
          selectedDeclarer={selectedDeclarer}
          setSelectedLevel={setSelectedLevel}
          setSelectedStrain={setSelectedStrain}
          setSelectedDeclarer={setSelectedDeclarer}
          contract={contract}
          contractReady={contractReady}
          showTrickStatus={showTrickStatus}
          setShowTrickStatus={setShowTrickStatus}
          undoLength={undoLength}
          handleConfirmContract={handleConfirmContract}
          undoPlay={undoPlay}
          resetBoard={resetBoard}
        />

        <ResultPanel
          board={board}
          ddsTable={ddsTable}
          trickNumber={trickNumber}
          nsTricks={nsTricks}
          contract={contract}
        />
      </div>
    </div>
  );
}