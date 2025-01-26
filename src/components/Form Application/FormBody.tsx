import FormTextBox from "./FormTextBox";
import FormDropdown from "./FormDropdown";


const FormBody = () => {
  const suffixOptions = ['Male', 'Female'];

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
      <div>
        <h1>Form Body</h1>
        <FormTextBox label="Last Name" placeholder="Type Here" value="" onChange={() => {}} name = "LastNameTextBox"/>
        <FormTextBox label="First Name" placeholder="Type Here" value="" onChange={() => {}} name = "FirstNameTextBox"/>
        <FormTextBox label="Middle Name" placeholder="Type Here" value="" onChange={() => {}} name = "MiddleNameTextBox"/>
        <FormDropdown label="Suffix" value="" onChange={() => {}} name = "SuffixDropdown" options = {suffixOptions} />

        {/* revise to only be able to put numbers */}
        <FormTextBox label="Age" placeholder="Type Here" value="" onChange={() => {}} name = "AgeTextBox"/>

        <FormDropdown label="College" value="" onChange={() => {}} name = "CollegeDropdown" options = {collegeOptions} />
          
        <FormTextBox label="Hospital" placeholder="Type Here" value="" onChange={() => {}} name = "HospitalTextBox"/>
        <FormTextBox label="Nature of Illness" placeholder="Type Here" value="" onChange={() => {}} name = "NatureOfIllnessTextBox"/>
        <FormTextBox label="Physician" placeholder="Type Here" value="" onChange={() => {}} name = "PhysicianTextBox"/>
        <FormTextBox label="Procedures" placeholder="Type Here" value="" onChange={() => {}} name = "ProceduresTextBox"/>

        <FormDropdown label="Academic Term" value="" onChange={() => {}} name = "AcademicTermDropdown" options = {academicTermOptions} />
        <FormDropdown label="Academic Year" value="" onChange={() => {}} name = "AcademicYearDropdown" options = {academicYearOptions} />
        <FormDropdown label="Present Teaching Load (Units)" value="" onChange={() => {}} name = "teachingLoadDropdown" options = {teachingLoadOptions} />


        </div>
    );
};

export default FormBody;