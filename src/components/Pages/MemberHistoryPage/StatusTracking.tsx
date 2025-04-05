import React, { useState } from "react";
import styles from "./TrackingPage.module.css";
import useTrackingRecords from "./useTrackingRecord";
import ViewFiles from "../../Page Elements/ViewFiles/ViewFiles";
import { IoIosArrowBack } from "react-icons/io";

interface StatusTrackingProps {
  onBack: () => void;
  transactionID: string;
  status: string;
  dateTime: Date; // dateTime is now a Date object
}

interface RecordType {
  transactionID: string;
  status: string;
  dateSubmitted?: string;
  DateDecided?: { toDate: () => Date };
  formData: any;
}

// Add the helper function to format document types (from PendingRequestList)
const formatDocumentType = (camelCaseKey: string): string => {
  if (camelCaseKey === "employeeID") return "Employee ID";
  if (camelCaseKey === "applicantSignature") return "Applicant Signature";
  if (camelCaseKey === "docRequest") return "Document Request";
  if (camelCaseKey === "hospitalInvoice") return "Hospital Invoice";
  if (camelCaseKey === "labInvoice") return "Lab Invoice";

  return (
    camelCaseKey
      // Insert a space before all capital letters
      .replace(/([A-Z])/g, " $1")
      // Capitalize first letter
      .replace(/^./, (str) => str.toUpperCase())
  );
};

const StatusTracking: React.FC<StatusTrackingProps> = ({
  onBack,
  transactionID,
  status,
  dateTime,
}) => {
  const { pendingRecords, accomplishedRecords, revisionRecords } =
    useTrackingRecords();

  const typedPendingRecords: RecordType[] = pendingRecords.map((record) => ({
    transactionID: record.transactionID,
    status: record.status,
    dateSubmitted: record.dateSubmitted,
    DateDecided: record.DateDecided,
    formData: record.formData,
  }));

  const typedAccomplishedRecords: RecordType[] = accomplishedRecords.map(
    (record) => ({
      transactionID: record.transactionID,
      status: record.status,
      dateSubmitted: record.dateSubmitted,
      DateDecided: record.DateDecided,
      formData: record.formData,
    })
  );

  const typedRevisionRecords: RecordType[] = revisionRecords.map((record) => ({
    transactionID: record.transactionID,
    status: record.status,
    dateSubmitted: record.dateSubmitted,
    DateDecided: record.DateDecided,
    formData: record.formData,
  }));

  const allRecords: RecordType[] = [
    ...typedPendingRecords,
    ...typedAccomplishedRecords,
    ...typedRevisionRecords,
  ];

  const [previewFile, setPreviewFile] = useState<any>(null);
  const handleClosePreview = () => {
    setPreviewFile(null);
  };

  const request = allRecords.find((req) => req.transactionID === transactionID);
  console.log("Found Request:", request);
  if (!request) {
    return (
      <div className={styles.statusTrackingContainer}>
        <h3>Request Not Found</h3>
        <p>No request found with Transaction ID: {transactionID}</p>
        <button onClick={onBack} className="back-button">
          <IoIosArrowBack size={20} style={{ marginRight: "0.5rem" }} />
          <span>BACK</span>
        </button>
      </div>
    );
  }

  const getStatusUpdates = (req: RecordType, stat: string, time: Date) => {
    const timestamps: Record<
      | "submitted"
      | "reviewed"
      | "processing"
      | "approved"
      | "rejected"
      | "for revision",
      string
    > = {
      submitted: req.dateSubmitted || time.toLocaleString(),
      reviewed:
        stat !== "Pending"
          ? req.DateDecided?.toDate().toLocaleString() || "✔"
          : "...",
      processing:
        stat !== "Pending"
          ? req.DateDecided?.toDate().toLocaleString() || "✔"
          : "...",
      approved:
        stat === "Approved"
          ? req.DateDecided?.toDate().toLocaleString() || "✔"
          : "...",
      rejected:
        stat === "Rejected"
          ? req.DateDecided?.toDate().toLocaleString() || "✔"
          : "...",
      "for revision":
        stat === "For Revision"
          ? req.DateDecided?.toDate().toLocaleString() || "✔"
          : "...",
    };

    const baseUpdates: {
      label: string;
      key:
        | "submitted"
        | "reviewed"
        | "processing"
        | "approved"
        | "rejected"
        | "for revision";
    }[] = [
      { label: "FORM REQUEST SUBMITTED", key: "submitted" },
      { label: "REQUEST REVIEWED", key: "reviewed" },
      { label: "REQUEST PROCESSING", key: "processing" },
    ];

    if (stat === "Approved") {
      baseUpdates.push({ label: "REQUEST APPROVED", key: "approved" });
    }

    if (stat === "Rejected") {
      baseUpdates.push({ label: "REQUEST REJECTED", key: "rejected" });
    }

    if (stat === "For Revision") {
      baseUpdates.push({ label: "MARKED FOR REVISION", key: "for revision" });
    }

    return baseUpdates.map((update, index) => {
      let bgClass = "pending";
      let textColor = "pending";
      let icon = "";
      const timestamp = timestamps[update.key];

      if (stat === "Approved") {
        bgClass = "approved";
        textColor = "approved";
        icon = "✔";
      } else if (stat === "Rejected") {
        bgClass = "rejected";
        textColor = "rejected";
        icon = "✘";
      } else if (stat === "For Revision") {
        bgClass = "revision";
        textColor = "revision";
        icon = "✔";
      } else if (stat === "Pending") {
        if (index === 0) {
          icon = "✔";
          bgClass = "approved";
          textColor = "approved";
        }
      }

      return {
        ...update,
        bgClass,
        textColor,
        icon,
        time: timestamp,
      };
    });
  };

  const fields = (request: RecordType) => {
    console.log("Request FormData:", request.formData);
    if (!request.formData) {
      console.error("formData is undefined!");
      return null; // Or handle the absence of formData appropriately
    }
    const { formData } = request;

    const defaultData = (
      <>
        <div className={styles.formContainer}>
          <div className={styles.formContents}>
            <label>Last Name</label>
            <p className={styles.fieldContent}>{formData.lastname}</p>
          </div>
          <div className={styles.formContents}>
            <label>First Name</label>
            <p className={styles.fieldContent}>{formData.firstname}</p>
          </div>
          <div className={styles.formContents}>
            <label>Middle Name</label>
            <p className={styles.fieldContent}>{formData.middlename}</p>
          </div>
          <div className={styles.formContents}>
            <label>Suffix</label>
            <p className={styles.fieldContent}>
              {formData.suffix ? formData.suffix : "-"}
            </p>
          </div>
        </div>
        <div className={styles.formContainer2}>
          <div className={styles.formContents}>
            <label>Age</label>
            <p className={`${styles.fieldContent} ${styles.age}`}>
              {formData.age}
            </p>
          </div>
          <div className={`${styles.formContents} ${styles.gender}`}>
            <label>Gender</label>
            <p className={styles.fieldContent}>{formData.gender}</p>
          </div>
          <div className={`${styles.formContents} ${styles.college}`}>
            <label>College Affiliation</label>
            <p className={styles.fieldContent}>{formData.college}</p>
          </div>
          <div className={`${styles.formContents} ${styles.contact}`}>
            <label>Contact No.</label>
            <p className={styles.fieldContent}>{formData.contact}</p>
          </div>
        </div>
      </>
    );

    switch (formData.formType) {
      case "hospital":
        return (
          <>
            {defaultData}
            <hr></hr>
            <div className={styles.formContainer}>
              <div className={styles.formContents}>
                <label>Hospital</label>
                <p className={styles.fieldContent}>{formData.hospital}</p>
              </div>
              <div className={styles.formContents}>
                <label>Nature of Illness</label>
                <p className={styles.fieldContent}>{formData.illness}</p>
              </div>
              <div className={styles.formContents}>
                <label>Physician</label>
                <p className={styles.fieldContent}>{formData.physician}</p>
              </div>
              <div className={styles.formContents}>
                <label>Procedure</label>
                <p className={styles.fieldContent}>{formData.procedures}</p>
              </div>
            </div>
            <hr></hr>
            <div className={styles.formContainer}>
              <div className={styles.formContents}>
                <label>Academic Term</label>
                <p className={styles.fieldContent}>{formData.term}</p>
              </div>
              <div className={styles.formContents}>
                <label>Academic Year</label>
                <p className={styles.fieldContent}>{formData.year}</p>
              </div>
              <div className={styles.formContents}>
                <label>Teaching Load</label>
                <p className={styles.fieldContent}>{formData.load}</p>
              </div>
              <div className={styles.formContents}>
                <label>Status</label>
                <p className={styles.fieldContent}>{formData.status || "-"}</p>
              </div>
              <div className={styles.formContents}>
                <label>Date Hired:</label>
                <p className={styles.fieldContent}>
                  {formData.dateHired
                    ? new Date(formData.dateHired).toLocaleDateString()
                    : "-"}
                </p>
              </div>
              <div className={styles.formContents}>
                <label>Date Retired:</label>
                <p className={styles.fieldContent}>
                  {formData.dateRetired
                    ? new Date(formData.dateRetired).toLocaleDateString()
                    : "-"}
                </p>
              </div>
              <div className={styles.formContents}>
                <label>Health Benefits</label>
                <p className={styles.fieldContent}>{formData.benefits}</p>
              </div>
              <div className={styles.formContents}>
                <label>If HMO, please specify:</label>
                <p className={styles.fieldContent}>
                  {formData.hmo ? formData.hmo : "-"}
                </p>
              </div>
            </div>
          </>
        );
      case "admission":
        return (
          <>
            {defaultData}
            <hr></hr>
            <div className={styles.formContainer}>
              <div className={styles.formContents}>
                <label>Load</label>
                <p className={styles.fieldContent}>
                  {formData.load ? formData.load : "-"}
                </p>
              </div>
              <div className={styles.formContents}>
                <label>Status</label>
                <p className={styles.fieldContent}>
                  {formData.status ? formData.status : "-"}
                </p>
              </div>
            </div>
          </>
        );
      case "eyeglasses":
        return (
          <>
            {defaultData}
            <hr></hr>
            <div className={styles.formContainer}>
              <div className={styles.formContents}>
                <label>OR Number</label>
                <p className={styles.fieldContent}>
                  {formData.ORNumber ? formData.ORNumber : "-"}
                </p>
              </div>
              <div className={styles.formContents}>
                <label>Issued By</label>
                <p className={styles.fieldContent}>
                  {formData.issuedBy ? formData.issuedBy : "-"}
                </p>
              </div>
              <div className={styles.formContents}>
                <label>Amount Paid</label>
                <p className={styles.fieldContent}>
                  {formData.amountPaid ? formData.amountPaid : "-"}
                </p>
              </div>
            </div>
          </>
        );
    }
  };

  const renderAttachmentPreview = (file: any, documentType: string) => {
    if (!file) {
      return (
        <>
          <div className={styles.thumbnailContainer}>
            <div className={styles.defaultThumbnail} data-label="Error">
              !
            </div>
          </div>
          <div className={styles.fileInfo}>
            <p className={styles.documentType} title={documentType}>
              {documentType}
            </p>
            <p className={styles.fileName} title="File Error">
              File Error
            </p>
          </div>
        </>
      );
    }

    // Get filename from either name or filename property
    const filename = file.filename || file.name || "Unknown file";

    // Check file extension from filename to determine file type
    const fileExt = filename.split(".").pop()?.toLowerCase();
    const isPdf = fileExt === "pdf" || file.type === "application/pdf";
    const isImage =
      ["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(fileExt) ||
      (file.type && file.type.startsWith("image/"));

    if (isPdf) {
      return (
        <>
          <div className={styles.thumbnailContainer}>
            <div className={styles.defaultThumbnail} data-label="PDF">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z" />
                <path d="M4.603 14.087a.81.81 0 0 1-.438-.42c-.195-.388-.13-.776.08-1.102.198-.307.526-.568.897-.787a7.68 7.68 0 0 1 1.482-.645a19.697 19.697 0 0 0 1.062-2.227a7.269 7.269 0 0 1-.43-1.295c-.086-.4-.119-.796-.046-1.136.075-.354.274-.672.65-.823.192-.077.4-.12.602-.077a.7.7 0 0 1 .477.365c.088.164.12.356.127.538.007.188-.012.396-.047.614-.084.51-.27 1.134-.52 1.794a10.954 10.954 0 0 0 .98 1.686a5.753 5.753 0 0 1 1.334.05c.364.066.734.195.96.465.12.144.193.32.2.518.007.192-.047.382-.138.563a1.04 1.04 0 0 1-.354.416a.856.856 0 0 1-.51.138c-.331-.014-.654-.196-.933-.417a5.712 5.712 0 0 1-.911-.95a11.651 11.651 0 0 0-1.997.406a11.307 11.307 0 0 1-1.02 1.51c-.292.35-.609.656-.927.787a.793.793 0 0 1-.58.029zm1.379-1.901c-.166.076-.32.156-.459.238-.328.194-.541.383-.647.547-.094.145-.096.25-.04.361.01.022.02.036.026.044a.266.266 0 0 0 .035-.012c.137-.056.355-.235.635-.572a8.18 8.18 0 0 0 .45-.606zm1.64-1.33a12.71 12.71 0 0 1 1.01-.193a11.744 11.744 0 0 1-.51-.858a20.801 20.801 0 0 1-.5 1.05zm2.446.45c.15.163.296.3.435.41.24.19.407.253.498.256a.107.107 0 0 0 .07-.015a.307.307 0 0 0 .094-.125a.436.436 0 0 0 .059-.2a.095.095 0 0 0-.026-.063c-.052-.062-.2-.152-.518-.209a3.876 3.876 0 0 0-.612-.053zM8.078 7.8a6.7 6.7 0 0 0 .2-.828c.031-.188.043-.343.038-.465a.613.613 0 0 0-.032-.198a.517.517 0 0 0-.145.04c-.087.035-.158.106-.196.283-.04.192-.03.469.046.822.024.111.054.227.09.346z" />
              </svg>
            </div>
          </div>
          <div className={styles.fileInfo}>
            <p className={styles.documentType} title={documentType}>
              {documentType}
            </p>
            <p className={styles.fileName} title={filename}>
              {filename}
            </p>
          </div>
        </>
      );
    } else if (isImage) {
      return (
        <>
          <div className={styles.thumbnailContainer}>
            {file.url ? (
              <img
                src={file.url}
                alt={filename}
                className={styles.fileThumbnail}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = "/images/image-error.png";
                }}
              />
            ) : (
              <div className={styles.defaultThumbnail} data-label="IMG">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" />
                  <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z" />
                </svg>
              </div>
            )}
          </div>
          <div className={styles.fileInfo}>
            <p className={styles.documentType} title={documentType}>
              {documentType}
            </p>
            <p className={styles.fileName} title={filename}>
              {filename}
            </p>
          </div>
        </>
      );
    }

    // Default file display for other types
    return (
      <>
        <div className={styles.thumbnailContainer}>
          <div className={styles.defaultThumbnail} data-label="File">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z" />
            </svg>
          </div>
        </div>
        <div className={styles.fileInfo}>
          <p className={styles.documentType} title={documentType}>
            {documentType}
          </p>
          <p className={styles.fileName} title={filename}>
            {filename}
          </p>
        </div>
      </>
    );
  };

  const getAttachments = (request: RecordType) => {
    const { formData } = request;

    if (!formData) return null;

    // Define a type for normalized attachments
    type NormalizedAttachment = {
      type: string;
      data: {
        filename: string;
        name: string;
        [key: string]: any;
      };
    };

    // Normalize attachment data to ensure consistent structure
    const normalizeAttachment = (
      attachment: any,
      type: string
    ): NormalizedAttachment | null => {
      if (!attachment) return null;

      return {
        type,
        data: {
          ...attachment,
          // Ensure filename is available
          filename: attachment.filename || attachment.name || `${type}.file`,
          // Ensure we have a name for compatibility
          name: attachment.name || attachment.filename || `${type}.file`,
        },
      };
    };

    // Create an array of objects with type, data following PendingRequestList format
    const attachmentsWithLabels = [
      // Common attachments for all form types
      normalizeAttachment(formData.employeeID, "employeeID"),
      normalizeAttachment(formData.applicantSignature, "applicantSignature"),

      // Form-specific attachments
      normalizeAttachment(formData.docRequest, "docRequest"),
      normalizeAttachment(formData.hospitalInvoice, "hospitalInvoice"),
      normalizeAttachment(formData.labInvoice, "labInvoice"),
    ].filter((item): item is NormalizedAttachment => item !== null); // Remove null entries with type assertion

    if (attachmentsWithLabels.length === 0) {
      return (
        <>
          <hr></hr>
          <div className={styles.attachmentsSection}>
            <h4>UPLOADED ATTACHMENTS</h4>
            <p>No attachments found for this request.</p>
          </div>
        </>
      );
    }

    return (
      <>
        <hr></hr>
        <div className={styles.attachmentsSection}>
          <h4>UPLOADED ATTACHMENTS</h4>
          <div className={styles.attachmentPreviewContainer}>
            {attachmentsWithLabels.map((item, index) => (
              <div
                key={index}
                className={styles.attachmentPreview}
                onClick={() => setPreviewFile(item.data)}
                title={item.data.filename}
              >
                {renderAttachmentPreview(
                  item.data,
                  formatDocumentType(item.type)
                )}
              </div>
            ))}
          </div>
        </div>
      </>
    );
  };

  return (
    <>
      <div
        key={request.transactionID}
        className={styles.statusTrackingContainer}
      >
        <div className={styles.transactionHeader}>
          <div className={styles.transactionId}>
            TRANSACTION ID: <strong>{transactionID}</strong>
          </div>
          <div className="back-button" onClick={onBack}>
            <IoIosArrowBack size={20} style={{ marginRight: "0.5rem" }} />
            <span>BACK</span>
          </div>
        </div>
        <div className={styles.statusUpdates}>
          <h3 className={styles.statusTitle}>STATUS UPDATES</h3>
          {getStatusUpdates(request, status, dateTime).map((update, index) => {
            return (
              <div
                key={index}
                className={`${styles.statusItem} ${styles[update.bgClass]}`}
              >
                {update.icon && (
                  <span className={styles.checkmark}>{update.icon}</span>
                )}
                <div className={styles.statusText}>
                  <span>{update.label}</span>
                  <span id="dash">-</span>
                  <span className={styles.timestamp}>
                    {status === "Pending" &&
                    (update.key === "reviewed" || update.key === "processing")
                      ? "..."
                      : update.time}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <div className={styles.actionButtons}>
          <button
            className={styles.printButton}
            onClick={() => window.print()}
            disabled={
              status === "Pending" ||
              status === "Rejected" ||
              status === "For Revision"
            }
          >
            PRINT
          </button>
        </div>
        <div className={styles.submissionInfoContainer}>
          <div className={styles.submissionHeader}>
            <div className={styles.submissionTitle}>SUBMITTED INFORMATION</div>
          </div>
          <div className={styles.submissionContents}>
            {fields(request)}
            {getAttachments(request)}
          </div>
        </div>
      </div>
      {previewFile && (
        <ViewFiles file={previewFile} onClose={handleClosePreview} />
      )}
    </>
  );
};

export default StatusTracking;
