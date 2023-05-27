import { HTMLAttributes } from "react";
import { AlertType } from ".";
import "./alert.css";

interface AlertProps extends HTMLAttributes<HTMLElement> {
  type: AlertType;
  text: string;
}

export default function Alert(props: AlertProps) {
  return (
    <div className="alert fade alert-simple alert-success alert-dismissible text-left font__family-montserrat font__size-16 font__weight-light brk-library-rendered rendered show">
      <button type="button" className="close font__size-18" data-dismiss="alert">
        <span aria-hidden="true"><a>
          <i className="fa fa-times greencross"></i>
        </a></span>
        <span className="sr-only">Close</span>
      </button>
      <i className="start-icon far fa-check-circle faa-tada animated"></i>
      <strong className="font__weight-semibold">Well done!</strong> You successfully read this important.
    </div>
  )
}