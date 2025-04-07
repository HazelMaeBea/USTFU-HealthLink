import React from "react";
import { useRevisionStore } from "../../../Page Elements/RevisionFuncs/revisionStore";

const FormUploadDisclaimer: React.FC = () => {
  const { isRevisionMode } = useRevisionStore();

  return (
    <>
      <hr className="section-separator" />
      <div className="file-types-info">
        <div className="upload-section-title">
          Kindly upload the necessary documents needed.
        </div>

        <div className="file-types-label">Accepted File Types:</div>
        <div className="file-types-list">PDF, PNG, JPG, and JPEG</div>
        {isRevisionMode && (
          <div
            className="revision-warning"
            style={{ color: "red", marginTop: "10px" }}
          >
            <em>
              <strong>Warning:</strong> You need to re-upload your files when
              revising.{" "}
            </em>
          </div>
        )}
      </div>
    </>
  );
};

export default FormUploadDisclaimer;
