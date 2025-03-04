import FormHeader from "./FormHeader";
import FormBody from "./FormBody";
import BackButton from "./BackButton";
import RemainingBenefit from "./RemainingBenefit"; 
import "./FormBody.css"; 
import "./BackButton.css";

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
