import { Link, Outlet } from 'react-router-dom'
import './App.css'
import Header from './Components/Header/Header'
import Sidebar from './Components/Sidebar/Sidebar'

function App() {
  return (
    <div className="App">
      <Sidebar />
      <div className="main">
        <Header />
        <Outlet />

      </div>
    </div>
  )
}

export default App
