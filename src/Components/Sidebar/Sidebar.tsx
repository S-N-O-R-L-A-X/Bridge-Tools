import { Link } from "react-router-dom";
import "./index.css";

export default function Sidebar() {
  return (
    <nav className="sidebar">
      <ul className="sidebarMenuInner">
        <li><Link to="/">Home</Link></li>
        <li><Link to="deal">Deal With One Hand Setting</Link></li>
        <li><Link to="deal-multi">Deal With Multi Hands Setting</Link></li>
        <li><Link to="analysis">Analysis</Link></li>

      </ul>
    </nav>

  )
}