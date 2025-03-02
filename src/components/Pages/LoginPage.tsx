import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";
import USTFULogo from "../../assets/2.png";
import GoogleLogo from "../../assets/signin.png";
import { useFirebase } from "../../contexts/firebaseContext";
import { callFunction } from "../../config/firebase";

const LoginPage: React.FC = () => {
  const { login } = useFirebase();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // TEMPORARY: Add keyboard shortcut to sync claims (Alt+Shift+S)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Alt+Shift+S to sync claims
      if (event.altKey && event.shiftKey && event.key === 'S') {
        console.log('TEMPORARY: Triggering syncUserClaims cloud function...');
        
        callFunction('syncAllUserClaimsTrigger')
          .then(() => {
            console.log('✅ Claims sync complete');
          })
          .catch((error) => {
            console.error('❌ Claims sync error:', error);
          });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogin = async () => {
    try {
      setIsLoggingIn(true);
      setError(null);
      const user = await login();
      if (user) {
        // Navigate to the protected route after successful login.
        navigate("/home");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      setError(error.message || "Failed to sign in. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="login-container">
      <div className="background-overlay"></div>
      <div className="content">
        <img src={USTFULogo} alt="Logo" className="page-logo" />
        <div className="white-box">
          <h1 className="sign-in-title">Sign in</h1>
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          <p className="sign-in-description">
            To access MyUSTFU HealthLink, please make sure you meet the following requirement:
          </p>
          <p className="requirement">
            UST Google Workspace Personal Account
          </p>
          <button 
            className="google-signin" 
            onClick={handleLogin}
            disabled={isLoggingIn}
          >
            <img
              src={GoogleLogo}
              alt="Google Logo"
              className="google-logo"
            />
            {isLoggingIn ? "Signing in..." : "Sign in with Google"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;