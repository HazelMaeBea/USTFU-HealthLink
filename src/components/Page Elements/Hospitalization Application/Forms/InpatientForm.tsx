import FormHeader from "./FormHeader";
import FormBody from "./FormBody";
import BackButton from "./BackButton"; // Import BackButton

const InpatientForm = () => {

  return (
    <div className="form-body">
      <BackButton /> {/* Use BackButton component */}
      <FormHeader formType="Inpatient Form" />
      <FormBody />
    </div>
  );
};

export default InpatientForm;
