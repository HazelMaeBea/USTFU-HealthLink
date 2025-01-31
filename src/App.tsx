import "bootstrap/dist/css/bootstrap.min.css";
import { useState, useEffect } from "react";
import {
	BrowserRouter as Router,
	Route,
	Routes,
	Navigate,
} from "react-router-dom";
import { Container } from 'react-bootstrap';
import Header from "./components/LandingPage/Header";
import Footer from "./components/LandingPage/Footer";
import Sidebar from "./components/LandingPage/Sidebar";
import ServiceCards from "./components/LandingPage/ServiceCards";
import StickySidebar from "./components/LandingPage/StickySidebar";

import LoginPage from "./components/Login Page/LoginPage";
import "./App.css";

const App: React.FC = () => {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isMobile, setIsMobile] = useState(window.innerWidth <=768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
	
	const handleLogin = () => {
		setIsAuthenticated(true);
	};

	return (
		<body className="App">
			<Router>
					{isAuthenticated ? (
						<>
							<div className="HeaderContainer">
								<Header />
							</div>
							{isMobile ? (
								<StickySidebar />
							) : (
								<Container className="SidebarContainer">
									<Sidebar />
								</Container>
							)}
							<div className="MainContainer">
								<div className="MainContent">
									<Routes>
										<Route path="/hospitalization-application" element={<ServiceCards />} />
										<Route path="/tracking" element={<div>Hospitalization Tracking Content</div>} />
										<Route path="/faq" element={<div>FAQ Content</div>} />
										<Route path="/settings" element={<div>Settings Content</div>} />
										<Route path="/logout" element={<div>Logout Content</div>} />
										<Route path="/" element={<Navigate to="/hospitalization-application" />} />
									</Routes>
								</div>
							</div>
							<div className="FooterContainer">
                    			<Footer />
            				</div>
						</>
					) : (
						<LoginPage onLogin={handleLogin} />
					)}
			</Router>
	
		</body>
	);
};

export default App;
