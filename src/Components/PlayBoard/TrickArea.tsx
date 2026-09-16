import { Position } from "../../Utils/maps";
import { PlayedCard, Contract, SUIT_ICONS, SUIT_COLORS, getTrickWinner } from "../../Utils/bridgePlay";

interface TrickAreaProps {
  currentTrick: PlayedCard[];
  contract: Contract | null;
  showTrickStatus: boolean;
}

function renderTrickCard(pos: Position, currentTrick: PlayedCard[], showTrickStatus: boolean, contract: Contract | null) {
  const card = currentTrick.find(c => c.position === pos);
  if (!card) return <div className="played-card-placeholder trick-card-slot"></div>;
  const isWinning = showTrickStatus && currentTrick.length >= 1 && contract
    ? getTrickWinner(currentTrick, contract.strain) === pos
    : false;
  return (
    <div className={`trick-card-slot ${isWinning ? "trick-card-winning-slot" : ""}`}>
      <div className={`trick-card-played ${SUIT_COLORS[card.suit] === "red" ? "bridge-card-red" : ""}`}>
        {SUIT_ICONS[card.suit]}{card.rank}
      </div>
      {isWinning && <span className="trick-card-winner-badge">赢</span>}
    </div>
  );
}

export default function TrickArea(props: TrickAreaProps) {
  const { currentTrick, contract, showTrickStatus } = props;
  return (
    <div className="trick-center">
      <div className="trick-grid">
        <div className="trick-card-slot trick-card-north">{renderTrickCard("N", currentTrick, showTrickStatus, contract)}</div>
        <div className="trick-card-slot trick-card-west">{renderTrickCard("W", currentTrick, showTrickStatus, contract)}</div>
        <div className="trick-card-slot trick-card-east">{renderTrickCard("E", currentTrick, showTrickStatus, contract)}</div>
        <div className="trick-card-slot trick-card-south">{renderTrickCard("S", currentTrick, showTrickStatus, contract)}</div>
      </div>
    </div>
  );
}