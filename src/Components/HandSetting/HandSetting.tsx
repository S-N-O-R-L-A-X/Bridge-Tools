import { useState, ChangeEvent, HTMLAttributes, forwardRef, Ref, createContext } from "react";
import { Position } from "../../Utils/maps";
import { OneFilterProps, OneHandFilterProps } from "../../views/Deal/HandFilter";
import HandShape from "./HandShape";
import HandSolid from "./HandSolid";
import "./index.css";
import KnownCards from "./KnownCards";

export const HandSettingContext = createContext<HandSettingContextProps>({ position: "N", solid: false, setSolid: () => {}, setShapes: () => {} });

interface HandSettingContextProps extends HTMLAttributes<HTMLElement> {
  position?: Position;
  solid: boolean;
  setSolid: Function;
  shapes?: number[];
  setShapes: Function;
}

interface HandSettingProps extends HTMLAttributes<HTMLElement> {
  position?: Position;
  getData: (position: Position, data: OneFilterProps) => void;
}

const HandSetting = forwardRef((props: HandSettingProps, ref: Ref<HTMLDivElement>) => {
  const { position = "N", getData } = props;
  const [lowPoints, setLowPoints] = useState<number>(0);
  const [highPoints, setHighPoints] = useState<number>(37);
  const [show, setShow] = useState<boolean>(false);
  const [shapes, setShapes] = useState<number[]>([4, 3, 3, 3]);
  const [solid, setSolid] = useState<boolean>(false);


  function handleShow() {
    setShow(!show);
  }

  function handleLowPoints(e: ChangeEvent) {
    setLowPoints(Number((e.target as HTMLInputElement).value));
  }

  function handleHighPoints(e: ChangeEvent) {
    setHighPoints(Number((e.target as HTMLInputElement).value));
  }

  function handleSubmit() {
    getData(position, { points: [lowPoints, highPoints], shapes, solid });
  }

  return (
    <HandSettingContext.Provider value={{ position, setShapes, solid, setSolid }}>
      <button onClick={handleShow}>{position}</button>
      {
        show && (
          <div ref={ref}>
            请输入{position}点力的下限<input value={lowPoints} onChange={handleLowPoints} placeholder="请输入点力的下限" className="point"></input>
            请输入{position}点力的上限<input value={highPoints} onChange={handleHighPoints} placeholder="请输入点力的上限" className="point"></input>
            <HandShape />
            <HandSolid />
            <br />
            <KnownCards />
            <button onClick={handleSubmit}>确认</button>
          </div>
        )
      }
    </HandSettingContext.Provider>
  )

});

export default HandSetting;