import FormHeader from "./FormHeader";
import FormBody from "./FormBody";

const InpatientForm = () => {
	return (
		<div className="form-body">
			<FormHeader formType="Inpatient Form" />
			<FormBody />
		</div>
	);
};

export default InpatientForm;
