import React, { useRef, useState, useEffect } from "react";
import { eyeglassesSampleData } from "../../pdf-generation/data-types-pdfGen/sampleData";
import { useUser } from "../../contexts/userContext";
import "./FormGenerator.css";

const FormGenerator: React.FC = () => {
  const { selectedRole } = useUser();
  const eyeglassesFormRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [htmlTemplate, setHtmlTemplate] = useState<string | null>(null);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);

  // Load HTML template
  useEffect(() => {
    // Changed path to use the HTML template file
    fetch('/src/pdf-generation/eyeglass-html-css.html')
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load template: ${response.status} ${response.statusText}`);
        }
        return response.text();
      })
      .then(html => {
        console.log('HTML template loaded successfully');
        setHtmlTemplate(html);
      })
      .catch(error => console.error('Error loading HTML template:', error));
    
    // Load logo image
    fetch('/src/pdf-generation/images-pdfGen/USTFULogo.png')
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load logo: ${response.status} ${response.statusText}`);
        }
        return response.blob();
      })
      .then(blob => {
        const reader = new FileReader();
        reader.onload = () => setLogoDataUrl(reader.result as string);
        reader.readAsDataURL(blob);
      })
      .catch(error => console.error('Error loading logo:', error));
  }, []);

  // Function to generate and download eyeglasses PDF
  const generateEyeglassesPDF = async () => {
    try {
      setIsGenerating(true);
    
      if (!htmlTemplate) {
        throw new Error("HTML template is not loaded");
      }
    
      // Add logo to HTML if available
      let processedHtml = htmlTemplate;
      if (logoDataUrl) {
        processedHtml = processedHtml.replace(
          '<!-- Logo will be added dynamically through CSS -->', 
          `<img class="eyeglasses-logo-left" src="${logoDataUrl}" alt="USTFU Logo" />`
        );
      }
    
      // Format current date for signature
    const today = new Date();
    const formattedDate = `${today.getMonth()+1}/${today.getDate()}/${today.getFullYear()}`;

    // Populate the HTML template with sample data
    const populatedHtml = processedHtml
      .replace('{{term}}', eyeglassesSampleData.term)
      .replace('{{academicYearFrom}}', eyeglassesSampleData.academicYear.from)
      .replace('{{academicYearTo}}', eyeglassesSampleData.academicYear.to)
      .replace('{{name}}', eyeglassesSampleData.personalInfo.name)
      .replace('{{age}}', eyeglassesSampleData.personalInfo.age)
      .replace('{{sex}}', eyeglassesSampleData.personalInfo.sex)
      .replace('{{affiliation}}', eyeglassesSampleData.personalInfo.affiliation)
      .replace('{{initialEmployment}}', eyeglassesSampleData.personalInfo.initialEmployment)
      .replace('{{currentTeachingLoad}}', eyeglassesSampleData.personalInfo.currentTeachingLoad)
      .replace('{{contactNo}}', eyeglassesSampleData.personalInfo.contactNo)
      .replace('{{issuedBy}}', eyeglassesSampleData.officialReceipt.issuedBy)
      .replace('{{number}}', eyeglassesSampleData.officialReceipt.number)
      .replace('{{amountPaid}}', eyeglassesSampleData.officialReceipt.amountPaid)
      .replace('{{reimbursementAmount}}', eyeglassesSampleData.reimbursementAmount)
      .replace('{{applicantSignature}}', eyeglassesSampleData.applicantSignature.url)
      .replace('{{signatureDate}}', formattedDate)
      .replace('{{oicHospitalApproval}}', eyeglassesSampleData.oicHospitalApproval);
    
      console.log('Sending HTML to server for PDF generation...');
    
      // Use fetch with URL approach instead of binary data
      const response = await fetch('http://localhost:3001/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ htmlContent: populatedHtml }),
      });
    
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} ${errorText}`);
      }
    
      // Parse the JSON response which contains the download URL
      const result = await response.json();
      console.log('Response received:', result);
      
      if (!result.success || !result.downloadUrl) {
        throw new Error("Invalid response from server");
      }
      
      // Create full URL for download
      const downloadUrl = `http://localhost:3001${result.downloadUrl}`;
      console.log('PDF download URL:', downloadUrl);
      
      // Open PDF in new tab
      window.open(downloadUrl, '_blank');
      
      // Also trigger download
      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = 'Eyeglasses_Benefit_Form.pdf';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(downloadLink);
      }, 100);
    
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      alert(`Failed to generate PDF: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="form-generator-page">
      <div className="form-generator-container">
        <div className="form-generator-header">
          <h1>USTFU-HealthLink Form Generator</h1>
          <p>Generate eyeglasses benefit application forms</p>
          
          <div className="disclaimer">
            <p>
              This form is pre-filled with sample data. When downloaded as PDF, it will
              be properly formatted for printing on letter-sized paper.
            </p>
          </div>
        </div>

        <div className="active-form-type">
          <span className="highlight">Eyeglasses Benefit Form</span>
        </div>

        <div className="form-wrapper">
          <div ref={eyeglassesFormRef} className="eyeglasses-preview">
            <h2>Eyeglasses Benefit Form Preview</h2>
            <div className="eyeglasses-data-preview">
              <h3>Form Data Preview:</h3>
              <div className="preview-row">
                <strong>Name:</strong> {eyeglassesSampleData.personalInfo.name}
              </div>
              <div className="preview-row">
                <strong>Age/Sex:</strong> {eyeglassesSampleData.personalInfo.age} / {eyeglassesSampleData.personalInfo.sex}
              </div>
              <div className="preview-row">
                <strong>Affiliation:</strong> {eyeglassesSampleData.personalInfo.affiliation}
              </div>
              <div className="preview-row">
                <strong>Term/AY:</strong> {eyeglassesSampleData.term} Term, AY {eyeglassesSampleData.academicYear.from}-{eyeglassesSampleData.academicYear.to}
              </div>
              <div className="preview-row">
                <strong>Official Receipt Amount:</strong> ₱{eyeglassesSampleData.officialReceipt.amountPaid}
              </div>
              <div className="preview-row">
                <strong>Reimbursement Amount:</strong> ₱{eyeglassesSampleData.reimbursementAmount}
              </div>
            </div>
            <button 
              className="download-pdf-button" 
              onClick={generateEyeglassesPDF}
              disabled={isGenerating || !htmlTemplate}
            >
              {isGenerating ? 'Generating PDF...' : 'Download Eyeglasses Form PDF'}
            </button>
          </div>
        </div>

        <div className="form-instructions">
          <h3>How to use this form:</h3>
          <ol>
            <li>Review the pre-filled sample data above</li>
            <li>Click the "Download PDF" button to generate a properly formatted PDF</li>
            <li>The PDF will be formatted for letter-sized paper (8.5" × 11")</li>
            <li>Print the PDF or submit it electronically as required</li>
          </ol>
        </div>

        {selectedRole === 'operations handler' && (
          <div className="admin-note">
            <div className="admin-note-header">
              <span className="admin-icon">⚙️</span>
              <h3>Operations Handler Note</h3>
            </div>
            <p>
              As an Operations Handler, you can verify and process these forms in the 
              Pending Requests section. Ensure that all submitted forms comply with 
              USTFU-HealthLink guidelines.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormGenerator;