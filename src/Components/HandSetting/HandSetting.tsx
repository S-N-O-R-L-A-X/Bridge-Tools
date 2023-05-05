import { useState, ChangeEvent } from "react";

interface HandSettingProps {

}

export default function HandSetting(props: HandSettingProps) {
  const [lowPoints, setLowPoints] = useState<number>(0);
  const [highPoints, setHighPoints] = useState<number>(0);


  function handleLowPoints(e: ChangeEvent) {
    setLowPoints(Number((e.target as HTMLInputElement).value));
  }

  function handleHighPoints(e: ChangeEvent) {
    setHighPoints(Number((e.target as HTMLInputElement).value));
  }

  return (
    <>
      请输入北家点力的下限<input value={lowPoints} onChange={handleLowPoints} placeholder="请输入北家点力的下限"></input>
      请输入北家点力的上限<input value={highPoints} onChange={handleHighPoints} placeholder="请输入北家点力的上限"></input>
    </>
  )

}