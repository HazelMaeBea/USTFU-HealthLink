import { useNavigate } from "react-router-dom";
import "./BackButton.css";
import { IoIosArrowBack } from "react-icons/io";

const BackButton = () => {
	const navigate = useNavigate();

	return (
		<div className="back-button" onClick={() => navigate("/home")}>
			<IoIosArrowBack size={20} style={{ marginRight: "0.5rem" }} />
			<span>{"BACK"}</span>
		</div>
	);
};

export default BackButton;
