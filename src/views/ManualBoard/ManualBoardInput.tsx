import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../models/Card";
import { ColorsShort, DEALER, Position, RANK2CARD, VUL } from "../../Utils/maps";
import { saveManualBoard, ManualBoardData, RanksBySuit } from "../../Utils/manualBoard";
import "./ManualBoardInput.css";

const POSITIONS: Position[] = ["N", "S", "E", "W"];
const SUITS: ColorsShort[] = ["S", "H", "D", "C"];
const SUIT_ICONS: Record<string, string> = { S: "♠", H: "♥", D: "♦", C: "♣" };
const RED_SUITS = new Set<string>(["H", "D"]);
const BOARD_NUMBERS = Array.from({ length: 16 }, (_, i) => i);

const ALL_CARDS: string[] = [];
for (const suit of SUITS) for (const rank of RANK2CARD) ALL_CARDS.push(suit + rank);

export default function ManualBoardInput() {
  const navigate = useNavigate();
  const [boardnum, setBoardnum] = useState<number>(Math.floor(Math.random() * 16));
  const [owners, setOwners] = useState<Record<string, Position | null>>(() => {
    const init: Record<string, Position | null> = {};
    for (const key of ALL_CARDS) init[key] = null;
    return init;
  });

  const parsed = useMemo(() => {
    const byPos: Record<Position, RanksBySuit> = { N: { S: [], H: [], D: [], C: [] }, S: { S: [], H: [], D: [], C: [] }, E: { S: [], H: [], D: [], C: [] }, W: { S: [], H: [], D: [], C: [] } };
    const counts: Record<Position, number> = { N: 0, S: 0, E: 0, W: 0 };
    const hcp: Record<Position, number> = { N: 0, S: 0, E: 0, W: 0 };
    const errors: string[] = [];

    for (const [key, pos] of Object.entries(owners)) {
      if (!pos) continue;
      const suit = key[0] as ColorsShort;
      const rank = key.slice(1);
      byPos[pos][suit].push(rank);
      counts[pos] += 1;
      hcp[pos] += Card.POINT[rank];
    }

    for (const pos of POSITIONS) {
      if (counts[pos] < 13) errors.push(`${pos}家还差 ${13 - counts[pos]} 张`);
      else if (counts[pos] > 13) errors.push(`${pos}家多出 ${counts[pos] - 13} 张`);
    }

    const total = counts.N + counts.S + counts.E + counts.W;
    return { byPos, counts, hcp, errors, total, valid: errors.length === 0 && total === 52 };
  }, [owners]);

  const handleCard = (pos: Position, key: string) => {
    setOwners((prev) => {
      const next = { ...prev };
      if (next[key] === null) next[key] = pos;
      else if (next[key] === pos) next[key] = null;
      return next;
    });
  };

  const handleClear = () => {
    setOwners(() => {
      const init: Record<string, Position | null> = {};
      for (const key of ALL_CARDS) init[key] = null;
      return init;
    });
  };

  const renderSeat = (pos: Position) => (
    <div className="manual-seat">
      <div className="manual-seat-title">{pos}</div>
      {SUITS.map((suit) => (
        <div className="manual-suit-row" key={suit}>
          <span className={`manual-suit-icon${RED_SUITS.has(suit) ? " manual-suit-red" : ""}`}>{SUIT_ICONS[suit]}</span>
          <div className="manual-card-row">
            {RANK2CARD.map((rank) => {
              const key = suit + rank;
              const owner = owners[key];
              const isMine = owner === pos;
              const taken = owner !== null && owner !== pos;
              return (
                <button
                  key={key}
                  className={
                    "manual-card-btn" +
                    (RED_SUITS.has(suit) ? " manual-card-red" : "") +
                    (isMine ? " manual-card-selected" : "") +
                    (taken ? " manual-card-taken" : "")
                  }
                  disabled={taken}
                  onClick={() => handleCard(pos, key)}
                  title={taken ? `属于 ${owner} 家` : `${SUIT_ICONS[suit]}${rank}`}
                >
                  {taken ? owner : rank}
                </button>
              );
            })}
          </div>
          <span className="manual-suit-count">{parsed.byPos[pos][suit].length}张</span>
        </div>
      ))}
      <div className="manual-seat-meta">
        {parsed.counts[pos]}张 {parsed.byPos[pos].S.length}{parsed.byPos[pos].H.length}{parsed.byPos[pos].D.length}{parsed.byPos[pos].C.length}牌型 · {parsed.hcp[pos]}点
      </div>
    </div>
  );

  const handleStart = () => {
    if (!parsed.valid) return;
    const data: ManualBoardData = { boardnum, hands: parsed.byPos };
    saveManualBoard(data);
    navigate("/play-board");
  };

  return (
    <div className="manual-board">
      <h2 className="manual-board-title">手动摆牌</h2>
      <p className="manual-board-hint">
        点击各家座位中的牌张按钮即可为该国分配/取消该牌，被其他家占用的牌会显示归属字母。每家选满 13 张后即可开始打牌。
      </p>

      <div className="manual-layout">
        <div className="manual-north">{renderSeat("N")}</div>
        <div className="manual-west">{renderSeat("W")}</div>
        <div className="manual-east">{renderSeat("E")}</div>
        <div className="manual-south">{renderSeat("S")}</div>
      </div>

      <div className="manual-footer">
        <div className="manual-boardnum-box">
          <label>副号</label>
          <select className="manual-boardnum-select" value={boardnum} onChange={(e) => setBoardnum(Number(e.target.value))}>
            {BOARD_NUMBERS.map((n) => (
              <option key={n} value={n}>{n + 1}</option>
            ))}
          </select>
          <span className="manual-boardnum-info">
            有局:{VUL[boardnum % 16]} · 首叫:{DEALER[boardnum % 4]}
          </span>
        </div>

        <div className="manual-error-list">
          {parsed.errors.length === 0
            ? <div className="manual-ok">已输入 {parsed.total} 张，可以开始打牌</div>
            : parsed.errors.map((err, i) => <div key={i} className="manual-error-item">{err}</div>)}
        </div>

        <div className="manual-actions">
          <button className="manual-clear-btn" onClick={handleClear}>清空</button>
          <button className="manual-start-btn" disabled={!parsed.valid} onClick={handleStart}>开始打牌</button>
        </div>
      </div>
    </div>
  );
}