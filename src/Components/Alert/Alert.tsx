import { HTMLAttributes } from "react";
import { AlertType } from ".";
import "./alert.css";

interface AlertProps extends HTMLAttributes<HTMLElement> {
  type: AlertType;
  text: string;
}

export default function Alert(props: AlertProps) {
  switch (props.type) {
    case "error": return <div className="alert-simple alert-error">❌ {props.text}</div>;
    case "success": return <div className="alert-simple alert-success">✅ {props.text}</div>;
    default: return <div className="alert-simple">❓ Something goes wrong...</div>;
  }
}