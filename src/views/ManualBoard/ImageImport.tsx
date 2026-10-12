import { useEffect, useMemo, useRef, useState } from "react";
import { Position } from "../../Utils/maps";
import { RanksBySuit } from "../../Utils/manualBoard";
import {
  AI_PRESETS,
  AISettings,
  aiRecognizeImage,
  getPreset,
  loadAISettings,
  ocrImage,
  parseHandsFromText,
  ParsedHands,
  saveAISettings,
} from "../../Utils/imageImport";

const SEATS: Position[] = ["N", "E", "S", "W"];
const SUIT_ICONS: Record<string, string> = { S: "♠", H: "♥", D: "♦", C: "♣" };
const RED_SUITS = new Set<string>(["H", "D"]);

type Mode = "ocr" | "ai";
type Status = "idle" | "running" | "done" | "error";

interface ImageImportProps {
  onApply: (hands: Partial<Record<Position, RanksBySuit>>, boardnum: number | null) => void;
  onClose: () => void;
}

function handShape(hand: RanksBySuit | undefined): string {
  if (!hand) return "-";
  return `${hand.S.length}-${hand.H.length}-${hand.D.length}-${hand.C.length}`;
}

function seatText(hand: RanksBySuit | undefined): JSX.Element {
  if (!hand) return <span className="image-import-empty">未识别</span>;
  return (
    <span>
      {(["S", "H", "D", "C"] as const).map((suit) => (
        <span key={suit} className={`image-import-suit${RED_SUITS.has(suit) ? " image-import-red" : ""}`}>
          {SUIT_ICONS[suit]}
          {hand[suit].join("") || "—"}
        </span>
      ))}
    </span>
  );
}

export default function ImageImport({ onApply, onClose }: ImageImportProps) {
  const [mode, setMode] = useState<Mode>("ocr");
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<ParsedHands | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [aiSettings, setAiSettings] = useState<AISettings>(loadAISettings);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    saveAISettings(aiSettings);
  }, [aiSettings]);

  const preview = useMemo(() => {
    if (!result) return null;
    return SEATS.map((pos) => (
      <div className="image-import-seat" key={pos}>
        <div className="image-import-seat-title">{pos} 家</div>
        <div className="image-import-seat-cards">{seatText(result.hands[pos])}</div>
        <div className="image-import-seat-meta">{handShape(result.hands[pos])}</div>
      </div>
    ));
  }, [result]);

  const run = async (file: File) => {
    setStatus("running");
    setProgress(0);
    setProgressText(mode === "ai" ? "请求 AI 接口…" : "准备识别…");
    setError("");
    setResult(null);
    try {
      let raw: string;
      if (mode === "ai") {
        raw = await aiRecognizeImage(file, aiSettings);
      } else {
        raw = await ocrImage(file, (p, s) => {
          setProgress(Math.round(p * 100));
          setProgressText(s || "识别中…");
        });
      }
      const parsed = parseHandsFromText(raw);
      setResult(parsed);
      setStatus("done");
      setProgress(100);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
    }
  };

  const handleFile = (file: File | undefined | null) => {
    if (!file) return;
    void run(file);
  };

  const handleApply = () => {
    if (!result) return;
    onApply(result.hands, result.boardnum);
    onClose();
  };

  return (
    <div className="image-import-overlay" onClick={onClose}>
      <div className="image-import-modal" onClick={(e) => e.stopPropagation()}>
        <div className="image-import-header">
          <h3 className="image-import-title">上传图片识别牌张</h3>
          <button className="image-import-close" onClick={onClose}>关闭</button>
        </div>

        <div className="image-import-mode">
          <label className={`image-import-mode-item${mode === "ocr" ? " image-import-mode-active" : ""}`}>
            <input type="radio" name="image-import-mode" checked={mode === "ocr"} onChange={() => setMode("ocr")} />
            本地 OCR（免费）
          </label>
          <label className={`image-import-mode-item${mode === "ai" ? " image-import-mode-active" : ""}`}>
            <input type="radio" name="image-import-mode" checked={mode === "ai"} onChange={() => setMode("ai")} />
            AI 视觉识别（更准）
          </label>
          {mode === "ai" && (
            <button className="image-import-settings-toggle" onClick={() => setShowSettings((v) => !v)}>
              {showSettings ? "收起设置" : "接口设置"}
            </button>
          )}
        </div>

        {mode === "ai" && showSettings && (
          <div className="image-import-settings">
            <label>
              服务预设
              <select
                value={aiSettings.preset}
                onChange={(e) => {
                  const preset = getPreset(e.target.value);
                  setAiSettings({
                    baseUrl: preset.baseUrl,
                    model: preset.model,
                    apiKey: aiSettings.apiKey,
                    preset: preset.id,
                    disableThinking: preset.disableThinking ?? false,
                  });
                }}
              >
                {AI_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </label>
            {getPreset(aiSettings.preset).note && (
              <div className="image-import-settings-note">{getPreset(aiSettings.preset).note}</div>
            )}
            <label>
              接口地址
              <input
                type="text"
                value={aiSettings.baseUrl}
                placeholder="https://api.openai.com/v1"
                onChange={(e) => setAiSettings({ ...aiSettings, baseUrl: e.target.value, preset: "custom" })}
              />
            </label>
            <label>
              API Key
              <input
                type="password"
                value={aiSettings.apiKey}
                placeholder="自建服务可留空"
                onChange={(e) => setAiSettings({ ...aiSettings, apiKey: e.target.value })}
              />
            </label>
            <label>
              模型
              <input
                type="text"
                value={aiSettings.model}
                placeholder="Qwen/Qwen3.5-4B"
                onChange={(e) => setAiSettings({ ...aiSettings, model: e.target.value, preset: "custom" })}
              />
            </label>
            <label className="image-import-checkbox-row">
              <input
                type="checkbox"
                checked={aiSettings.disableThinking}
                onChange={(e) => setAiSettings({ ...aiSettings, disableThinking: e.target.checked })}
              />
              关闭模型思考（Qwen3/GLM 等推理模型，加速且输出更干净）
            </label>
          </div>
        )}

        <div className="image-import-body">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => {
              handleFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <button className="image-import-pick" onClick={() => fileInputRef.current?.click()} disabled={status === "running"}>
            {status === "running" ? "识别中…" : "选择图片"}
          </button>

          {status === "running" && (
            <div className="image-import-progress">
              <div className="image-import-progress-bar">
                <div className="image-import-progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <span className="image-import-progress-text">{progressText} {progress}%</span>
            </div>
          )}

          {status === "error" && <div className="image-import-error">识别失败：{error}</div>}

          {result && (
            <div className="image-import-result">
              <div className="image-import-seats">{preview}</div>
              {result.warnings.length > 0 ? (
                <div className="image-import-warnings">
                  {result.warnings.map((w, i) => (
                    <div key={i} className="image-import-warning">提示：{w}</div>
                  ))}
                  <div className="image-import-hint">仍可点击「填入牌桌」，再手动修正缺少的牌张。</div>
                </div>
              ) : (
                <div className="image-import-ok">已识别 52 张牌，可确认填入</div>
              )}
              <button className="image-import-raw-toggle" onClick={() => setShowRaw((v) => !v)}>
                {showRaw ? "隐藏识别原文" : "查看识别原文"}
              </button>
              {showRaw && <pre className="image-import-raw">{result.raw || "(空)"}</pre>}
            </div>
          )}
        </div>

        <div className="image-import-footer">
          <button className="image-import-cancel" onClick={onClose}>取消</button>
          <button className="image-import-apply" disabled={!result} onClick={handleApply}>
            填入牌桌
          </button>
        </div>
      </div>
    </div>
  );
}
