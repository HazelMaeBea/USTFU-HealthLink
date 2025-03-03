import FormHeader from "./FormHeader";
import FormBody from "./FormBody";
import "./BackButton.css";
import BackButton from "./BackButton"; // Import BackButton

const OutpatientForm = () => {
	return (
		<div className="form-body">
			<BackButton /> {/* Use BackButton component */}
			<FormHeader formType="Outpatient Form" />
			<FormBody origFormType="outpatient" />
		</div>
	);
};

export default OutpatientForm;
