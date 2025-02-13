import React from "react";

const FormUploadDisclaimer: React.FC = () => {
  return (
    <fieldset className="uploadDisclaimer">
      <span className="upload-note">Kindly upload the necessary documents needed.</span>
      <br />{" "}
      <span className="file-types">File Types: PDF, PNG, JPG, and JPEG</span>
    </fieldset>
  );
};

export default FormUploadDisclaimer;
