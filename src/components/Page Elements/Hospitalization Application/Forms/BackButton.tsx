import { useNavigate } from "react-router-dom";
import "./BackButton.css";

const BackButton = () => {
  const navigate = useNavigate();

  return (
    <div className="back-button" onClick={() => navigate("/home")}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="15"
        height="15"
        fill="currentColor"
        className="bi bi-chevron-left"
        viewBox="0 0 2 16"
      >
        <path
          fillRule="evenodd"
          d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0"
        />
      </svg>
      <span>{"BACK"}</span>
    </div>
  );
};

export default BackButton;
