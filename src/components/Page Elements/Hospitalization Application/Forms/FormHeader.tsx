import "./FormHeader.css";
import USTFULogo from "../../../../images/USTFULogo.png";
import USTLogo from "../../../../images/USTLogo.png";

interface FormHeaderProps {
	formType: string;
}

const FormHeader = ({ formType }: FormHeaderProps) => {
	return (
		<div className="form-header">
			<img
				id="UST-logo"
				src={USTLogo}
				alt="USTFU Logo"
				className="logo"
			/>
			<div className="header-text">
				<h1>Hospitalization and Medical Benefits Fund</h1>
				<h1>Application Form</h1>
				<h1>{formType}</h1>
			</div>
			<img
				id="USTFU-logo"
				src={USTFULogo}
				alt="UST Logo"
				className="logo"
			/>
		</div>
	);
};

export default FormHeader;
