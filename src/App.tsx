import 'bootstrap/dist/css/bootstrap.min.css';
import { useState } from "react";
import Header from "./components/Landing_Home Page/Header";
import Sidebar from "./components/Landing_Home Page/Sidebar";
import MainContainer from "./components/Landing_Home Page/MainContainer";
import "./App.css";
import { BrowserRouter as Router } from 'react-router-dom';

const App = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
		<div className="App">
			<Header />
			
			<Router>
				<div className="Layout">
					<Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
					<MainContainer isSidebarOpen={isSidebarOpen} />
				</div>
			</Router>
		</div>
	);
};
 
export default App;
