import FormHeader from "./FormHeader";
import FormBody from "./FormBody";
import BackButton from "./BackButton";
import RemainingBenefit from "./RemainingBenefit";
import "./FormBody.css";

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
