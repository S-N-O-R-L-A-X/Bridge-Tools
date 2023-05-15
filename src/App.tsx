import { Link, Outlet } from 'react-router-dom'
import './App.css'
import Sidebar from './Components/Sidebar/Sidebar'

function App() {
  return (
    <div className="App">
      <Sidebar />
      <div className="main">
        These are Bridge Tools written by 小米 and <a href="https://github.com/S-N-O-R-L-A-X">SNORLAX</a><br />
        <Outlet />

      </div>
    </div>
  )
}

export default App
