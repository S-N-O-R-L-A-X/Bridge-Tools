import ReactDOM from 'react-dom/client';
import { useEffect, useState } from "react";
import Alert from "./Alert";

export type AlertType = "success" | "error" | "warning" | "info";
export interface AlertApi {
  info: (text: string) => void;
  success: (text: string) => void;
  warning: (text: string) => void;
  error: (text: string) => void;
}

export interface Notice {
  text: string;
  key: string;
  type: AlertType;
}

let seed = 0;
const now = Date.now();
const getUuid = (): string => {
  const id = seed;
  seed += 1;
  return `MESSAGE_${now}_${id}`;
}

let add: (notice: Notice) => void;

export const AlertContainer = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const timeout = 3 * 1000;
  const maxCount = 10;

  const remove = (notice: Notice) => {
    const { key } = notice

    setNotices((prevNotices) => (
      prevNotices.filter(({ key: itemKey }) => key !== itemKey)
    ))
  }

  add = (notice: Notice) => {
    setNotices((prevNotices) => [...prevNotices, notice])

    setTimeout(() => {
      remove(notice)
    }, timeout)
  }

  useEffect(() => {
    if (notices.length > maxCount) {
      const [firstNotice] = notices
      remove(firstNotice)
    }
  }, [notices])

  return (
    <div className="alert-container">
      {
        notices.map(({ text, key, type }) => (
          <Alert type={type} text={text} />
        ))
      }
    </div>
  )
}

let el = document.querySelector('#alert-wrapper');
if (!el) {
  el = document.createElement('div');
  el.className = 'alert-wrapper';
  el.id = 'alert-wrapper';
  document.body.append(el);
}

ReactDOM.createRoot(el).render(
  <AlertContainer />,
)

const api: AlertApi = {
  info: (text) => {
    add({
      text,
      key: getUuid(),
      type: 'info'
    })
  },
  success: (text) => {
    add({
      text,
      key: getUuid(),
      type: 'success'
    })
  },
  warning: (text) => {
    add({
      text,
      key: getUuid(),
      type: 'warning'
    })
  },
  error: (text) => {
    add({
      text,
      key: getUuid(),
      type: 'error'
    })
  }
}

export default api;