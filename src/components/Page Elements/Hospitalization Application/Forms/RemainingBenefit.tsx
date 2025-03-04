import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./BackButton.css"; // Reuse the same CSS file
import "./RemainingBenefit.css"; // Import new CSS for popup

const RemainingBenefit = () => {
  const [showPopup, setShowPopup] = useState(false);

  const handlePopup = () => {
    setShowPopup(!showPopup);
  };

  return (
    <>
      <div className="back-button" onClick={handlePopup}>
        <span>{"View Remaining Benefits"}</span>
      </div>
      {showPopup && (
        <div className="popup-overlay" onClick={handlePopup}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={handlePopup}>
              &times;
            </button>
            <div className="amount-container p-3 rounded shadow">
              <div className="amount-input-wrapper d-flex align-items-center">
                <span className="currency"></span>
                <input
                  aria-label="amount left"
                  type="text"
                  value="82000.00"
                  disabled
                  className="amount-input"
                />
              </div>
              <span className="amount-label">(Remaining benefit)</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RemainingBenefit;
