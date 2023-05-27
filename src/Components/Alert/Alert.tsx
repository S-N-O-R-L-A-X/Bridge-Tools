import { HTMLAttributes } from "react";
import { AlertType } from ".";
import "./alert.css";

interface AlertProps extends HTMLAttributes<HTMLElement> {
  type: AlertType;
  text: string;
}

export default function Alert(props: AlertProps) {
  return (
    <div className="alert alert-simple alert-success">
      ✅ {props.text}
    </div>
  )
}