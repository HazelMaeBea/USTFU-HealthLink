import FormTextBox from "./FormTextBox";
import FormDropdown from "./FormDropdown";
import "./FormBody.css";


const FormBody = () => {
  const suffixOptions = ['Mr.', 'Ms.', 'Mrs.'];
  const genderOptions = ['Male', 'Female'];

  {/* Double check later */}
  const collegeOptions = [
    "Faculty of Sacred Theology",
    "Faculty of Philosophy",
    "Faculty of Canon Law",
    "Faculty of Civil Law",
    "Faculty of Medicine and Surgery",
    "Faculty of Pharmacy",
    "Faculty of Engineering",
    "Faculty of Arts and Letters",
    "College of Architecture",
    "College of Commerce and Business Administration",
    "College of Education",
    "College of Fine Arts and Design",
    "College of Nursing",
    "College of Rehabilitation Sciences",
    "College of Science",
    "College of Tourism and Hospitality Management",
    "College of Information and Computing Sciences (CICS)",
    "Graduate School",
    "Graduate School of Law",
    "Conservatory of Music",
    "Institute of Physical Education and Athletics (IPEA)",
    "UST Senior High School",
    "UST Junior High School",
    "UST Education High School"
  ];
  
  const academicTermOptions = ['idk', 'the', 'options'];
  const academicYearOptions = ['idk', 'the', 'options'];
  const teachingLoadOptions = ['idk', 'the', 'options'];

    return (
      <div className = "ApplicationForm">
        <p>Please fill out the following boxes.</p>
          <fieldset className="PersonalInfo">
            <div className="form-row-1">
              <FormTextBox label="Last Name" placeholder="Type Here" value="" onChange={() => {}} name = "LastNameTextBox"/>
              <FormTextBox label="First Name" placeholder="Type Here" value="" onChange={() => {}} name = "FirstNameTextBox"/>
              <FormTextBox label="Middle Name" placeholder="Type Here" value="" onChange={() => {}} name = "MiddleNameTextBox"/>
              <FormDropdown label="Suffix" placeholder="" value="" onChange={() => {}} name = "SuffixDropdown" options = {suffixOptions} />
              
            </div>
            <div className="form-row-2"> 
              <FormTextBox label="Age" placeholder="Type Here" value="" onChange={() => {}} name = "AgeTextBox"/>
              <FormDropdown label="Gender" placeholder="" value="" onChange={() => {}} name = "GenderDropdown" options = {genderOptions} />
              <FormDropdown label="College" placeholder="" value="" onChange={() => {}} name = "CollegeDropdown" options = {collegeOptions} />
              <FormTextBox label="Contact Number" placeholder="Type Here" value="" onChange={() => {}} name = "ContactNumberTextBox"/>
            
            </div>
            </fieldset>        
          <fieldset className="MedicalInfo">
            <div className="form-row-3">
              <FormTextBox label="Hospital" placeholder="Type Here" value="" onChange={() => {}} name = "HospitalTextBox"/>
              <FormTextBox label="Nature of Illness" placeholder="Type Here" value="" onChange={() => {}} name = "NatureOfIllnessTextBox"/>
              <FormTextBox label="Physician" placeholder="Type Here" value="" onChange={() => {}} name = "PhysicianTextBox"/>
              
            </div>
            <div className="form-row-4">
             <FormTextBox label="Procedures" placeholder="Type Here" value="" onChange={() => {}} name = "ProceduresTextBox"/>

            </div>
          </fieldset>

            



            

              <FormDropdown label="Academic Term" placeholder="" value="" onChange={() => {}} name = "AcademicTermDropdown" options = {academicTermOptions} />
              <FormDropdown label="Academic Year" placeholder="" value="" onChange={() => {}} name = "AcademicYearDropdown" options = {academicYearOptions} />
              <FormDropdown label="Present Teaching Load (Units)" placeholder="" value="" onChange={() => {}} name = "teachingLoadDropdown" options = {teachingLoadOptions} />


          </div>
    );
};

export default FormBody;