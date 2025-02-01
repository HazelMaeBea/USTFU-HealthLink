import React from "react";

const FormUploadDisclaimer: React.FC = () => {
  return (
    <fieldset className="uploadDisclaimer">
      <p>Kindly upload the necessary documents needed. </p>
      <div className="row">
        <div className="mb-1 col-md-4">
          <strong>Required Attachments</strong>
        </div>
        <div className="mb-1 col-md-4">
          <strong>File Type</strong>
        </div>
        <div className="mb-1 col-md-4">
          <strong>Upload here</strong>
        </div>
      </div>
    </fieldset>
  );
};

export default FormUploadDisclaimer;
