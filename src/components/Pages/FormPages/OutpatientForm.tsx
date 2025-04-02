import FormHeader from "./FormComponents/FormHeader";
import FormBody from "./FormComponents/FormBody";
import BackButton from "../../Page Elements/BackButton/BackButton";
import RemainingBenefit from "./RemainingBenefitPopout/RemainingBenefit";
import "./FormComponents/FormBody.css";
import "../../Page Elements/BackButton/BackButton.css";
const OutpatientForm = () => {
	return (
		<div className="form-body">
			<div className="button-container">
				<BackButton />
				<RemainingBenefit />
			</div>
			<FormHeader formType="Outpatient Form" />
			<FormBody origFormType="outpatient" />
		</div>
	);
};

export default OutpatientForm;
