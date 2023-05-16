import { ChangeEvent, PropsWithChildren, useContext, useState } from "react";
import { HandSettingContext } from "./HandSetting";

export default function HandSolid(props: PropsWithChildren) {
  const context = useContext(HandSettingContext);
  function handleSolid(e: ChangeEvent) {
    context.setSolid((e.target as HTMLInputElement).checked);
  }

  return (
    <HandSettingContext.Consumer>
      {
        (context) => <> {context.position} 是否有坚固套 <input type="checkbox" id="solid" name="solid" onChange={handleSolid} /></>
      }
    </HandSettingContext.Consumer>
  )
}