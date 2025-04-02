import { FaHome, FaPhoneAlt, FaEnvelope, FaClock } from "react-icons/fa";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className = "Footer">
      <div className="footer-container">
            {/* Contact Section */}
            <div className="footer-section">
                <p className="footer-title">Contact Us</p>
                <p>
                    <FaHome className="footer-icon" />
                    On-campus Office at the Quadricentennial Pavilion, UST
                </p>
                <p>
                    <FaPhoneAlt className="footer-icon" />
                    02-87861611 extension 8353
                </p>
                <p>
                    <FaEnvelope className="footer-icon" />
                    ustfacultyunion2015@gmail.com
                </p>
                <p>
                    <FaClock className="footer-icon" />
                    Monday - Friday, 9:00AM - 5:00PM
                </p>
            </div>

            {/* Vision Section */}
            <div className="footer-section">
                <p className="footer-title">Vision</p>
                <p>
                    The University of Santo Tomas Faculty Union is a dynamic and 
                    pro-active academic labor union committed to ensuring the welfare 
                    of its members.
                </p>
            </div>

            {/* Mission Section */}
            <div className="footer-section">
                <p className="footer-title">Mission</p>
                <p>
                    The Union is committed to: <br />
                    - Secure optimum economic benefits, job security, and quality work 
                    environment for its members through principled cooperation; <br />
                    - Provide and uphold responsible leadership towards an empowered workforce 
                    and socially responsive academe; and, <br />
                    - Establish partnerships with other labor-related organizations 
                    for mutual support and development.
                </p>
            </div>
      </div>
    </footer>
  );
};

export default Footer;
