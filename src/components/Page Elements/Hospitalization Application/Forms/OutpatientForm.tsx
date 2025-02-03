import FormHeader from "./FormHeader";
import FormBody from "./FormBody";

const OutpatientForm = () => {
  return (
    <div className="form-body">
      <FormHeader formType="Outpatient Form" />
      <FormBody />
    </div>
  );
};

export default OutpatientForm;
