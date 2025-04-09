# Firebase Database Interactions Documentation

## Table of Contents

1. [Authentication System](#authentication-system)
2. [Collections Overview](#collections-overview)
3. [Page-Specific Firebase Interactions](#page-specific-firebase-interactions)
4. [Data Dependencies](#data-dependencies)
5. [Security Rules Recommendations](#security-rules-recommendations)

## Authentication System

### Firebase Auth

-   **Provider**: Google Authentication with UST domain restriction
-   **User Claims**:
    -   `role`: string - "member", "operations handler", "admin"
    -   `verified`: boolean - Account verification status
    -   `status`: string - "active", "inactive", "on_leave"

## Collections Overview

| Collection                     | Purpose                                    |
| ------------------------------ | ------------------------------------------ |
| `users`                        | User profiles and settings                 |
| `FormRequests`                 | Pending form submissions                   |
| `AccomplishedRequests`         | Approved form submissions                  |
| `RevisionRequests`             | Forms that need revision                   |
| `auditLogs`                    | Admin action tracking                      |
| `mail`                         | Email notifications                        |
| `notifyPending`                | Notification system for pending requests   |
| `notifyAccomplished_Revisions` | Notification system for processed requests |
| `globals`                      | System-wide variables like Form IDs        |

## Page-Specific Firebase Interactions

-   [Login Page](#login-page)
-   [Registration Page](#registration-page)
-   [Admission Form](#admission-form)
-   [Eyeglasses Form](#eyeglasses-form)
-   [Inpatient Form](#inpatient-form)
-   [Outpatient Form](#outpatient-form)
-   [PendingRequestPage](#pendingrequestpage)
-   [MemberHistoryPage](#memberhistorypage)
-   [AdminHistoryPage](#adminhistorypage)
-   [AdminSettingsPage](#adminsettingspage)
-   [SettingsPage](#settingspage)
-   [Notification System](#notification-system)

### Login Page

-   **CRUD Operations**: Read
-   **Reads**:
    -   Firebase Authentication: User auth state
    -   `users` collection: Check if user exists
        ```typescript
        isRegistered(uid: string) → boolean
        ```
-   **Dependencies**: Authentication status determines registration flow

### Registration Page

-   **CRUD Operations**: Create
-   **Writes**:
    -   `users` collection: New user document
        ```typescript
        {
          fullName: string,
          email: string,
          phoneNumber: string,  // Format: "+63XXXXXXXXXX" (stored without the "+63" prefix)
          personalInfo: {
            firstName: string,
            lastName: string,
            middleName: string,
            suffix: string | null,
            idNumber: string,  // Format: "YYYY-XXXXXX" (year-sequential number)
            birthdate: string,  // Format: "MM/DD/YYYY"
            gender: string,  // Values: "Male", "Female", "Other"
            college: string,
            address: string,
            status: string,  // Values: "Tenured", "Non-Tenured", "Part-Time", etc.
            dateHired: string | null,  // Format: "MM/DD/YYYY" or null if not applicable
            dateRetired: string | null,  // Format: "MM/DD/YYYY" or null if not applicable
            term: string,  // Values: "1st", "2nd", "Summer"
            year: string,  // Format: "YYYY-YYYY" (academic year)
            remainingBenefits: number,  // Decimal: 0.00 - 100000.00
            ustEmail: string  // Format: "xxx@ust.edu.ph"
          },
          settings: {
            autofill: boolean,
            notification: boolean
          }
        }
        ```
-   **Dependencies**: Requires authenticated user with no existing profile

### Admission Form

-   **Reads**:
    -   `users` collection: For form autofill
        ```typescript
        getDoc(doc(db, "users", uid)) → personalInfo fields
        ```
-   **Writes**:
    -   `FormRequests` collection: New admission request
        ```typescript
        {
          transactionId: string,
          name: string,
          requester: string,
          dateSubmitted: string,
          status: "Pending",
          formData: {
            formType: "admission",
            firstname: string,
            lastname: string,
            middlename: string,
            suffix: string | null,
            age: number,
            gender: string,
            idNumber: string,
            address: string,
            phoneNumber: string,
            college: string,
            load: number,
            status: string,
            dateHired: Date | string | null,
            dateRetired: Date | string | null,
            term: string,
            year: string,
            employeeID: {url: string, filename: string},
            applicantSignature: {url: string, filename: string},
            docRequest: {url: string, filename: string},
            hospitalInvoice: {url: string, filename: string},
            labInvoice: {url: string, filename: string}
          }
        }
        ```
    -   Firebase Storage: File uploads
    -   `notifyPending`: Notification creation
-   **Dependencies**: Form submission requires user profile data

### Eyeglasses Form

-   **Similar to Admission Form but with different fields**:
    -   **Additional formData fields**:
        ```typescript
        {
          ORNumber: string,
          issuedBy: string,
          amountPaid: number,
          eyeglassesReceipt: {url: string, filename: string}
        }
        ```

### Inpatient Form

-   **Reads**:
    -   `users` collection: For form autofill
        ```typescript
        getDoc(doc(db, "users", uid)) → personalInfo fields
        ```
-   **Writes**:
    -   `FormRequests` collection: New inpatient request
        ```typescript
        {
          transactionId: string,
          name: string,
          requester: string,
          dateSubmitted: string,  // Format: "MM/DD/YYYY"
          status: "Pending",
          formData: {
            formType: "inpatient",
            firstname: string,
            lastname: string,
            middlename: string,
            suffix: string | null,
            age: number,
            gender: string,
            idNumber: string,
            address: string,
            phoneNumber: string,
            college: string,
            load: number,
            status: string,
            dateHired: string | null,  // Format: "MM/DD/YYYY"
            dateRetired: string | null,  // Format: "MM/DD/YYYY"
            term: string,
            year: string,
            hospital: string,
            illness: string,
            physician: string,
            hospitalStatus: string,  // Values: "In-Patient", "Out-Patient", "ER Consultation"
            confinementFrom: string,  // Format: "MM/DD/YYYY"
            confinementTo: string,  // Format: "MM/DD/YYYY"
            validUntil: string,  // Format: "MM/DD/YYYY"
            contact: string,
            benefits: string,  // Values: "HMO", "PCSO", "Senior Citizen"
            hmo: string | null,
            employeeID: {url: string, filename: string},
            applicantSignature: {url: string, filename: string},
            docRequest: {url: string, filename: string},
            hospitalInvoice: {url: string, filename: string},
            labInvoice: {url: string, filename: string}
          }
        }
        ```
-   **Dependencies**: Form submission requires user profile data

### Outpatient Form

-   **Reads**:
    -   `users` collection: For form autofill
        ```typescript
        getDoc(doc(db, "users", uid)) → personalInfo fields
        ```
-   **Writes**:
    -   `FormRequests` collection: New outpatient request
        ```typescript
        {
          transactionId: string,
          name: string,
          requester: string,
          dateSubmitted: string,  // Format: "MM/DD/YYYY"
          status: "Pending",
          formData: {
            formType: "outpatient",
            firstname: string,
            lastname: string,
            middlename: string,
            suffix: string | null,
            age: number,
            gender: string,
            idNumber: string,
            address: string,
            phoneNumber: string,
            college: string,
            load: number,
            status: string,
            dateHired: string | null,  // Format: "MM/DD/YYYY"
            dateRetired: string | null,  // Format: "MM/DD/YYYY"
            term: string,
            year: string,
            hospital: string,
            illness: string,
            physician: string,
            procedures: string,  // Specific to outpatient
            procedureSpecify: string,  // Optional details about procedures
            validUntil: string,  // Format: "MM/DD/YYYY"
            contact: string,
            benefits: string,  // Values: "HMO", "PCSO", "Senior Citizen"
            hmo: string | null,
            hospitalStatus: string,  // Indicates status in hospital system
            certify: string,
            employeeID: {url: string, filename: string},
            applicantSignature: {url: string, filename: string},
            docRequest: {url: string, filename: string},
            hospitalInvoice: {url: string, filename: string},
            labInvoice: {url: string, filename: string}
          }
        }
        ```
-   **Dependencies**: Form submission requires user profile data

### PendingRequestPage

-   **CRUD Operations**: Read, Update, Delete
-   **Common Reads**:

    -   `FormRequests` collection: All pending requests
        ```typescript
        query(reqCollection, orderBy("dateSubmitted", "desc"));
        ```
        -   Fields read: `transactionId`, `requester`, `status`, `dateSubmitted`, `formData`
    -   `users` collection: Requester information and benefit status
        ```typescript
        query(usersCollection, where("fullName", "==", userName));
        ```
        -   Fields read: `email`, `personalInfo.remainingBenefits`, `personalInfo.eyeglassesBenefitClaimedDate`

-   **Form-Specific Reads**:

    -   **Admission Form**:
        -   Reads all standard admission form fields
        -   Validates hospital invoice and document request files
    -   **Eyeglasses Form**:
        -   Checks if user has claimed eyeglasses benefit within the current year
        -   Reads receipt information and validates claimed amount
        ```typescript
        query(usersCollection, where("fullName", "==", userName));
        // Check personalInfo.eyeglassesBenefitClaimedDate
        ```
    -   **Inpatient/Outpatient Form**:
        -   Reads hospital status information
        -   Validates confinement dates and physician information

-   **Form-Specific Writes**:

    -   **Admission Form Approval**:

        ```typescript
        // Update user's remaining benefits
        updateDoc(userDocRef, {
        	"personalInfo.remainingBenefits": newRemainingBenefit,
        });

        // Move to AccomplishedRequests
        addDoc(collection(db, "AccomplishedRequests"), {
        	...formData,
        	status: "Approved",
        	statusReason: reasonText,
        	DateDecided: Timestamp.now(),
        });
        ```

    -   **Eyeglasses Form Approval**:

        ```typescript
        // Update user's eyeglasses claim date and remaining benefits
        updateDoc(userDocRef, {
        	"personalInfo.remainingBenefits": newRemainingBenefit,
        	"personalInfo.lastReimbursementAmount": reimbursementAmount,
        	"personalInfo.eyeglassesBenefitClaimedDate": Timestamp.now(),
        });

        // Move to AccomplishedRequests with reimbursement amount
        addDoc(collection(db, "AccomplishedRequests"), {
        	...formData,
        	status: "Approved",
        	statusReason: reasonText,
        	DateDecided: Timestamp.now(),
        	reimbursementAmount: reimbursementAmount, // Specific to eyeglasses
        });
        ```

    -   **Inpatient/Outpatient Form Approval**:

        ```typescript
        // Update user's remaining benefits
        updateDoc(userDocRef, {
        	"personalInfo.remainingBenefits": newRemainingBenefit,
        });

        // Set validUntil date for hospital forms
        addDoc(collection(db, "AccomplishedRequests"), {
        	...formData,
        	status: "Approved",
        	statusReason: reasonText,
        	DateDecided: Timestamp.now(),
        	validUntil: validUntilDate, // Specific to hospital forms
        });
        ```

    -   **Form Revision Request**:

        ```typescript
        // Move to RevisionRequests
        addDoc(collection(db, "RevisionRequests"), {
        	...formData,
        	status: "For Revision",
        	statusReason: reasonText,
        	DateDecided: Timestamp.now(),
        });

        // Create notification for member
        addDoc(collection(db, "notifyAccomplished_Revisions"), {
        	timestamp: serverTimestamp(),
        	transactionId: formData.transactionId,
        	isRead: false,
        	requester: formData.requester,
        	status: "For Revision",
        });
        ```

-   **Email Notifications**:

    -   Sends status update emails to form submitters

    ```typescript
    addDoc(collection(db, "mail"), {
    	to: userEmail,
    	template: {
    		name: "formStatus",
    		data: {
    			userName: userName,
    			formType: formTypeDisplay,
    			status: status,
    			message: textArea,
    		},
    	},
    });
    ```

-   **Dependencies**:
    -   Operation handlers require admin or operations handler role
    -   Form approval impacts user's remaining benefit balance
    -   Special validation for eyeglasses claims (once per year)
    -   Decision tracking for audit purposes

### MemberHistoryPage

-   **CRUD Operations**: Read, Update (notification status)
-   **Reads**:
    -   `FormRequests` collection: User's pending requests
        ```typescript
        query(
        	pendingRef,
        	where("requester", "==", fullName),
        	orderBy("dateSubmitted", "desc")
        );
        ```
        -   Fields read: `transactionId`, `requester`, `status`, `dateSubmitted`, `formData`, `DateDecided`
        -   Displayed in "Pending" tab
    -   `AccomplishedRequests` collection: User's approved requests
        ```typescript
        query(
        	accomplishedRef,
        	where("requester", "==", fullName),
        	orderBy("dateSubmitted", "desc")
        );
        ```
        -   Fields read: `transactionId`, `requester`, `status`, `dateSubmitted`, `formData`, `DateDecided`, `reimbursementAmount`
        -   Displayed in "Accomplished" tab
    -   `RevisionRequests` collection: User's requests needing revision
        ```typescript
        query(
        	revisionRef,
        	where("requester", "==", fullName),
        	orderBy("dateSubmitted", "desc")
        );
        ```
        -   Fields read: `transactionId`, `requester`, `status`, `dateSubmitted`, `formData`, `statusReason`
        -   Displayed in "For Revision" tab
    -   `notifyAccomplished_Revisions` collection: Unread notifications
        ```typescript
        query(
        	collection(db, "notifyAccomplished_Revisions"),
        	where("requester", "==", fullName),
        	where("isRead", "==", false)
        );
        ```
        -   Fields read: `transactionId`, `timestamp`, `isRead`, `status`
        -   Used to highlight newly updated records
-   **Writes**:
    -   `notifyAccomplished_Revisions` collection: Mark notifications as read
        ```typescript
        updateDoc(notificationDoc, { isRead: true });
        ```
-   **Form PDF Generation**:
    -   Retrieves form data to generate PDF downloads for all form types
    -   Maps form fields to corresponding PDF template
-   **Dependencies**:
    -   Filters requests by logged-in user's fullName
    -   Shows different views based on request status
    -   Highlights newly processed forms based on notification status

### AdminHistoryPage

-   **Reads**:
    -   `auditLogs` collection: Admin activity history
        ```typescript
        query(collection(db, "auditLogs"), orderBy("Time", "desc"));
        ```
-   **Dependencies**: Admin role required to access and view audit logs

### AdminSettingsPage

-   **Reads**:
    -   `users` collection: All user data for admin management
        ```typescript
        query(collection(db, "users"));
        ```
    -   `auditLogs` collection: Admin activity history
-   **Writes**:
    -   `users` collection: User role and status updates
        ```typescript
        {
          role: string,
          status: string,
          personalInfo: {college: string}
        }
        ```
    -   `auditLogs` collection: Admin actions
        ```typescript
        {
          Time: Date,
          Name: string,
          Changes: string[]
        }
        ```
-   **Dependencies**: Admin role required to access and modify user data

### SettingsPage

-   **Reads**:
    -   `users` collection: User's personal settings
-   **Writes**:
    -   `users` collection: Updated settings
        ```typescript
        {
          personalInfo: {
            firstName: string,
            lastName: string,
            // ...other personal fields
          },
          settings: {
            notification: boolean,
            autofill: boolean
          }
        }
        ```
-   **Dependencies**: User must be authenticated to access own settings

### Notification System

-   **Reads**:
    -   `notifyPending` collection: Pending notifications for operations handlers
        ```typescript
        query(
        	collection(db, "notifyPending"),
        	where("isReadBy", "array-contains", uid)
        );
        ```
    -   `notifyAccomplished_Revisions` collection: Status update notifications for members
-   **Writes**:
    -   `notifyPending` collection: New pending form notifications
        ```typescript
        {
          timestamp: serverTimestamp(),
          transactionId: string,
          isReadBy: string[],
          name: string
        }
        ```
    -   `notifyAccomplished_Revisions` collection: Status update notifications
        ```typescript
        {
          timestamp: serverTimestamp(),
          transactionId: string,
          isRead: boolean,
          requester: string,
          status: string
        }
        ```

## Data Dependencies

1. **User Authentication → User Profile**

    - User must authenticate before accessing profile
    - UID from authentication links to user document in Firestore

2. **User Profile → Forms**

    - Form autofill uses data from user's profile
    - Form submissions are linked to user's fullName

3. **Forms → Notifications**

    - Form submissions create notifications
    - Form status updates generate new notifications

4. **Role-based Access Control**

    - User role determines accessible pages and collections
    - Admin functions require admin role claim
    - Operations handler functions require operations handler role

5. **Benefit Tracking**
    - Approved forms update remaining benefits
    - Eyeglasses forms have special date tracking for reimbursement eligibility

## Security Rules Recommendations

Based on your application structure:

1. Limit `FormRequests` collection writes to authenticated users
2. Restrict `users` collection document access to the document owner and admins
3. Ensure `auditLogs` can only be written by admin users
4. Implement validation rules for form submissions
5. Set up storage rules to only allow access to files the user has permission to view
