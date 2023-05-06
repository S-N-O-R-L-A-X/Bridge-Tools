import { useState, ChangeEvent, HTMLAttributes, forwardRef, Ref } from "react";
import HandShape from "./HandShape";
import HandSolid from "./HandSolid";
import "./index.css";

interface HandSettingProps extends HTMLAttributes<HTMLElement> {
  position?: "N" | "E" | "S" | "W";
}

const HandSetting = forwardRef((props: HandSettingProps, ref: Ref<HTMLDivElement>) => {
  const { position = "N" } = props;
  const [lowPoints, setLowPoints] = useState<number>(0);
  const [highPoints, setHighPoints] = useState<number>(37);

  function handleLowPoints(e: ChangeEvent) {
    setLowPoints(Number((e.target as HTMLInputElement).value));
  }

  function handleHighPoints(e: ChangeEvent) {
    setHighPoints(Number((e.target as HTMLInputElement).value));
  }

  return (
    <div ref={ref}>
      请输入北家点力的下限<input value={lowPoints} onChange={handleLowPoints} placeholder="请输入北家点力的下限" className="point"></input>
      请输入北家点力的上限<input value={highPoints} onChange={handleHighPoints} placeholder="请输入北家点力的上限" className="point"></input>
      <HandShape />
      <HandSolid position="N" />
    </div>
  )

});

export default HandSetting;