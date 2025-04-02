import FormHeader from "./FormComponents/FormHeader";
import FormBody from "./FormComponents/FormBody";
import BackButton from "../../Page Elements/BackButton/BackButton";
import RemainingBenefit from "./RemainingBenefitPopout/RemainingBenefit";
import "./FormComponents/FormBody.css";

const InpatientForm = () => {
	return (
		<div className="form-body">
			<div className="button-container">
				<BackButton />
				<RemainingBenefit />
			</div>
			<FormHeader formType="Inpatient Form" />
			<FormBody origFormType="inpatient" />
		</div>
	);
};

export default InpatientForm;
