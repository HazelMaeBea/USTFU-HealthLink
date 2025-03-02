"use client"

import React from "react"
import { useState } from "react"
import { Button, Input, FormGroup, Label, Row, Col } from "reactstrap"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { differenceInDays, differenceInWeeks } from "date-fns"
import { Timestamp } from "firebase/firestore"
import { HiOutlineDotsVertical } from "react-icons/hi"
import { createPortal } from "react-dom"

interface User {
  id: number
  name: string
  email: string
  college: string
  birthdate: string
  phoneNumber: string
  role: string
  status: string
  retirementDate?: string
  deactivationDate?: string
  leaveReason?: string
  leaveStartDate?: string
  leaveEndDate?: string
  document: string
  createdAt: Timestamp
}

interface UserRowProps {
  user: User
  onSave: (updatedUser: User, option: "college" | "role" | "status") => void
}

const collegeOptions = [
  "College of Accountancy",
  "College of Architecture",
  "Faculty of Arts and Letters",
  "Faculty of Civil Law",
  "College of Commerce and Business Administration",
  "College of Education",
  "Faculty of Engineering",
  "College of Fine Arts and Design",
  "Graduate School",
  "Graduate School of Law",
  "College of Information and Computing Sciences",
  "Faculty of Medicine and Surgery",
  "Conservatory of Music",
  "College of Nursing",
  "Faculty of Pharmacy",
  "Institute of Physical Education and Athletics",
  "College of Rehabilitation Sciences",
  "College of Science",
  "College of Tourism and Hospitality Management",
];

const getStatusBadge = (status: string) => {
  if (status === "ACTIVE") {
    return <span className="badge bg-success">Active</span>;
  } else if (status === "INACTIVE") {
    return <span className="badge bg-danger">Inactive</span>;
  } else if (status === "ON-LEAVE") {
    return <span className="badge bg-secondary">On-Leave</span>;
  }
  return <span className="badge bg-secondary">Inactive</span>;
};

const calculateDuration = (start: string | undefined, end: string | undefined) => {
  if (!start || !end) return ""
  const startDate = new Date(start)
  const endDate = new Date(end)
  const diffDays = differenceInDays(endDate, startDate)
  const diffWeeks = differenceInWeeks(endDate, startDate)
  return `${diffWeeks} week(s) and ${diffDays % 7} day(s)`
}

const UserRow: React.FC<UserRowProps> = ({ user, onSave }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editedUser, setEditedUser] = useState(user)
  const [lastEdited, setLastEdited] = useState<string | null>(null)
  const [editOption, setEditOption] = useState<"college" | "role" | "status" | null>(null)
  const [showOptions, setShowOptions] = useState(false)
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({})
  const containerRef = React.useRef<HTMLDivElement>(null)

  const handleToggleOptions = () => {
    setShowOptions(!showOptions);
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setPopupStyle({
        position: "absolute",
        top: rect.bottom + window.scrollY,
        left: rect.left + rect.width / 2 + window.scrollX - 80,
        transform: "translateX(-50%)",
        zIndex: 1000,
        backgroundColor: "white",
        border: "1px solid #ccc",
        boxShadow: "0 2px 5px rgba(0,0,0,0.15)",
        whiteSpace: "nowrap",
        padding: "10px",
        maxWidth: "180px",
        pointerEvents: "auto",
      });
    }
  };

  const handleEdit = (option: "college" | "role" | "status") => {
    setIsEditing(true);
    setEditOption(option);
    setEditedUser(user); // Reset editedUser to the original user data
  };

  const handleSave = () => {
    // Ensure required dates are provided when role is retiree
    if (editedUser.role === "retiree" && (!editedUser.retirementDate || !editedUser.deactivationDate)) {
      alert("Please provide both retirement date and deactivation date.");
      return;
    }
    // Cannot change status to inactive when role is retiree
    if (editedUser.role === "retiree" && editedUser.status === "INACTIVE") {
      alert("Cannot set status to inactive when role is retiree.");
      return;
    }
    // If status is 'ON-LEAVE', require leave start and end dates
    if (editedUser.status === "ON-LEAVE" && (!editedUser.leaveStartDate || !editedUser.leaveEndDate)) {
      alert("Please provide both leave start date and leave end date.");
      return;
    }
    setIsEditing(false);
    onSave(editedUser, editOption!);
    const changes = []
    if (user.college !== editedUser.college) changes.push(`College from '${user.college}' to '${editedUser.college}'`)
    if (user.role !== editedUser.role) changes.push(`Role from '${user.role}' to '${editedUser.role}'`)
    if (user.status !== editedUser.status) changes.push(`Status from ${user.status} to ${editedUser.status}`)
    if (user.retirementDate !== editedUser.retirementDate) changes.push(`Retirement Date was set from ${user.retirementDate} to ${editedUser.retirementDate}`)
    if (user.deactivationDate !== editedUser.deactivationDate) changes.push(`Deactivation Date was set from ${user.deactivationDate} to ${editedUser.deactivationDate}`)
    if (user.leaveReason !== editedUser.leaveReason) changes.push(`Leave Reason from '${user.leaveReason}' to '${editedUser.leaveReason}'`)
    if (user.leaveStartDate !== editedUser.leaveStartDate) changes.push(`Leave Start Date from '${user.leaveStartDate}' to '${editedUser.leaveStartDate}'`)
    if (user.leaveEndDate !== editedUser.leaveEndDate) changes.push(`Leave End Date from '${user.leaveEndDate}' to '${editedUser.leaveEndDate}'`)
    setLastEdited(`Last edited on ${new Date().toLocaleString()}: ${changes.join(", ")}`)
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedUser(user);
    setEditOption(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditedUser({ ...editedUser, [name]: value });
  }

  const handleDateChange = (date: Date | null, field: string) => {
    if (date) {
      const today = new Date();
      if (field === "leaveStartDate" && editedUser.leaveEndDate && date > new Date(editedUser.leaveEndDate)) {
        alert("Start date cannot be later than end date.")
        return
      }
      if (field === "leaveEndDate" && editedUser.leaveStartDate && date < new Date(editedUser.leaveStartDate)) {
        alert("End date cannot be earlier than start date.")
        return
      }
      if (field === "retirementDate" && editedUser.deactivationDate && date > new Date(editedUser.deactivationDate)) {
        alert("Retirement date cannot be later than deactivation date.")
        return
      }
      if (field === "deactivationDate" && editedUser.retirementDate && date < new Date(editedUser.retirementDate)) {
        alert("Deactivation date cannot be earlier than retirement date.")
        return
      }
      if (field === "deactivationDate" && date < today) {
        alert("Deactivation date cannot be a past date.")
        return
      }
      setEditedUser({ ...editedUser, [field]: date.toISOString().split("T")[0] })
    }
  }

  return (
    <>
      <tr>
        <td>{user.id}</td>
        <td>{user.name}</td>
        <td>
          <a href={`mailto:${user.email}`}>{user.email}</a>
        </td>
        <td>{user.college}</td>
        <td>{user.birthdate}</td>
        <td>{user.phoneNumber}</td>
        <td>{user.role}</td>
        <td>{getStatusBadge(user.status)}</td>
        <td style={{ overflow: "visible" }}>
          <div
            className="edit-button-container"
            ref={containerRef}
            onClick={handleToggleOptions}
            style={{ position: "relative", overflow: "visible" }}
          >
            <HiOutlineDotsVertical className="edit-button" size={24} />
          </div>
          {showOptions &&
            createPortal(
              <div
                className="edit-options-menu"
                style={popupStyle}
              >
                <button onClick={() => handleEdit("college")}>Edit College</button>
                <button onClick={() => handleEdit("role")}>Edit Role</button>
                {editedUser.role !== "retiree" && (
                  <button onClick={() => handleEdit("status")}>Edit Status</button>
                )}
              </div>,
              document.body
            )}
        </td>
      </tr>
      {isEditing && (
        <tr>
          <td colSpan={10}>
            {editOption === "college" && (
              <FormGroup>
                <Label for="college">College</Label>
                <Input
                  type="select"
                  name="college"
                  id="college"
                  className="dropdown-select"
                  value={editedUser.college}
                  onChange={handleChange}
                >
                  {collegeOptions.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </Input>
              </FormGroup>
            )}
            {editOption === "role" && (
              <FormGroup>
                <Label for="role">Role</Label>
                <Input
                  type="select"
                  name="role"
                  id="role"
                  className="dropdown-select"
                  value={editedUser.role}
                  onChange={handleChange}
                >
                  <option value="member">Member</option>
                  <option value="operations handler">Operations Handler</option>
                  <option value="retiree">Retiree</option>
                </Input>
              </FormGroup>
            )}
            {editOption === "status" && (
              <>
                <FormGroup>
                  <Label for="status">Status</Label>
                  <Input
                    type="select"
                    name="status"
                    id="status"
                    className="dropdown-select"
                    value={editedUser.status}
                    onChange={handleChange}
                  >
                    <option>ACTIVE</option>
                    <option>INACTIVE</option>
                    <option>ON-LEAVE</option>
                  </Input>
                </FormGroup>
                {editedUser.status === "ON-LEAVE" && (
                  <>
                    <Row>
                      <Col md={6}>
                        <FormGroup>
                          <Label for="leaveStartDate">Start Date</Label>
                          <br/>
                          <DatePicker
                            selected={editedUser.leaveStartDate ? new Date(editedUser.leaveStartDate) : null}
                            onChange={(date) => handleDateChange(date, "leaveStartDate")}
                            className="form-control"
                            required
                            selectsStart
                            startDate={editedUser.leaveStartDate ? new Date(editedUser.leaveStartDate) : null}
                            endDate={editedUser.leaveEndDate ? new Date(editedUser.leaveEndDate) : null}
                            maxDate={editedUser.leaveEndDate ? new Date(editedUser.leaveEndDate) : undefined}
                          />
                        </FormGroup>
                      </Col>
                      <Col md={6}>
                        <FormGroup>
                          <Label for="leaveEndDate">End Date</Label>
                          <br/>
                          <DatePicker
                            selected={editedUser.leaveEndDate ? new Date(editedUser.leaveEndDate) : null}
                            onChange={(date) => handleDateChange(date, "leaveEndDate")}
                            className="form-control"
                            required
                            selectsEnd
                            startDate={editedUser.leaveStartDate ? new Date(editedUser.leaveStartDate) : null}
                            endDate={editedUser.leaveEndDate ? new Date(editedUser.leaveEndDate) : null}
                            minDate={editedUser.leaveStartDate ? new Date(editedUser.leaveStartDate) : undefined}
                          />
                        </FormGroup>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={8}>
                        <p>Duration: {calculateDuration(editedUser.leaveStartDate, editedUser.leaveEndDate)}</p>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={8}>
                        <FormGroup>
                          <Label for="leaveReason">Reason for Leave</Label>
                          <Input
                            type="textarea"
                            name="leaveReason"
                            id="leaveReason"
                            value={editedUser.leaveReason || ""}
                            onChange={handleChange}
                            required
                          />
                        </FormGroup>
                      </Col>
                    </Row>
                  </>
                )}
              </>
            )}

            {editedUser.role === "retiree" && editOption === "role" && (
              <Row className="mt-3">
                <Col md={6}>
                  <FormGroup>
                    <Label for="retirementDate">Retirement Date</Label>
                    <br/>
                    <DatePicker
                      selected={editedUser.retirementDate ? new Date(editedUser.retirementDate) : null}
                      onChange={(date) => handleDateChange(date, "retirementDate")}
                      className="form-control"
                      required
                      maxDate={editedUser.deactivationDate ? new Date(editedUser.deactivationDate) : undefined}
                    />
                    <p>* The date when the employee officially retires.</p>
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label for="deactivationDate">Deactivation Date</Label>
                    <br/>
                    <DatePicker
                      selected={editedUser.deactivationDate ? new Date(editedUser.deactivationDate) : null}
                      onChange={(date) => handleDateChange(date, "deactivationDate")}
                      className="form-control"
                      required
                      minDate={new Date()}
                      excludeDates={[new Date()]}
                    />
                    <p>* The account remains accessible until this date.  After this, login will be disabled.</p>
                  </FormGroup>
                </Col>
              </Row>
            )}

            {lastEdited && <p className="text-muted">{lastEdited}</p>}
            <Button color="success" onClick={handleSave}>
              Save
            </Button>
            <Button color="secondary" onClick={handleCancel} className="ms-2">
              Cancel
            </Button>
          </td>
        </tr>
      )}
    </>
  )
}

export default UserRow