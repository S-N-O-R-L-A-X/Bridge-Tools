import { Link } from "react-router-dom";
import "./index.css";

export default function Sidebar() {
  return (
    <nav className="sidebar">
      <ul className="sidebarMenuInner">
        <li><Link to="/">Home</Link></li>
        <li><Link to="deal">Deal</Link></li>
      </ul>
    </nav>

  )
}