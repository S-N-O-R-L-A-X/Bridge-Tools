import { Position, COLORS } from "../../Utils/maps";
import { PlayedCard, Contract, SUIT_ICONS, SUIT_COLORS, getContractTricks, mustFollowSuit } from "../../Utils/bridgePlay";

interface HandSeatProps {
  pos: Position;
  hand: Record<string, string[]>;
  orig: Record<string, string[]>;
  playedMap: Record<string, Set<string>>;
  cardTricks: Record<string, number>;
  isCurrent: boolean;
  contract: Contract | null;
  currentTrick: PlayedCard[];
  showTrickStatus: boolean;
  onCardClick: (position: Position, suit: string, rank: string) => void;
}

const HAND_LABELS: Record<Position, string> = { N: "N", S: "S", E: "E", W: "W" };

export default function HandSeat(props: HandSeatProps) {
  const { pos, hand, orig, playedMap, cardTricks, isCurrent, contract, currentTrick, showTrickStatus, onCardClick } = props;
  if (!hand || !orig) return null;

  return (
    <div className={`bridge-seat ${isCurrent ? "bridge-seat-active" : ""}`}>
      <div className="bridge-seat-name">
        <span className="bridge-seat-direction">{HAND_LABELS[pos]}</span>
      </div>
      <div className="bridge-suit-list">
        {COLORS.map(suit => (
          orig[suit].length > 0 && (
            <div key={suit} className="bridge-suit-line">
              <span className={`bridge-suit-label ${SUIT_COLORS[suit] === "red" ? "bridge-card-red" : ""}`}>{SUIT_ICONS[suit]}</span>
              <div className="bridge-card-row">
                {orig[suit].map((rank) => {
                  const isPlayed = playedMap[pos].has(suit + rank);
                  const tNum = cardTricks[pos + suit + rank];
                  let diffClass = "";
                  let showValue: string | null = null;
                  if (showTrickStatus && tNum !== undefined && contract && isCurrent && !isPlayed) {
                    const thisIsDeclaring = (contract.declarer === "N" || contract.declarer === "S") === (pos === "N" || pos === "S");
                    const declTricks = thisIsDeclaring ? tNum : 13 - tNum;
                    const target = getContractTricks(contract.level);
                    if (declTricks > target) diffClass = "bridge-card-good";
                    else if (declTricks < target) diffClass = "bridge-card-worse";
                    showValue = String(tNum);
                  }
                  const canPlay = isCurrent && contract !== null && !isPlayed;
                  const allowed = canPlay ? mustFollowSuit(hand, currentTrick, contract!.strain) : null;
                  const isAllowed = allowed ? allowed[suit] : false;
                  return (
                    <button
                      key={rank}
                      className={`bridge-card ${SUIT_COLORS[suit] === "red" ? "bridge-card-red" : ""} ${isPlayed ? "bridge-card-played" : ""} ${canPlay && isAllowed ? "bridge-card-clickable" : ""} ${diffClass}`}
                      onClick={() => onCardClick(pos, suit, rank)}
                      disabled={isPlayed || !canPlay || !isAllowed}
                    >
                      <span>{rank}</span>
                      {!isPlayed && showValue !== null && (
                        <em>{showValue}</em>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
}