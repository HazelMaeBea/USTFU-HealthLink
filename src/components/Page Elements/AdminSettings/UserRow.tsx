"use client"

import type React from "react"
import { useState } from "react"
import { Button, Input, FormGroup, Label, Row, Col } from "reactstrap"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { differenceInDays, differenceInWeeks } from "date-fns"

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
  inactiveReason?: "indefinite" | "on-leave"
  leaveReason?: string
  leaveStartDate?: string
  leaveEndDate?: string
  document: string
}

interface UserRowProps {
  user: User
  onSave: (updatedUser: User) => void
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

const getStatusBadge = (status: string, inactiveReason?: string) => {
  if (status === "ACTIVE") {
    return <span className="badge bg-success">Active</span>;
  } else if (status === "INACTIVE" && inactiveReason === "indefinite") {
    return <span className="badge bg-danger">Inactive</span>;
  } else if (status === "INACTIVE" && inactiveReason === "on-leave") {
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

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = () => {
    setIsEditing(false)
    onSave(editedUser)
    const changes = []
    if (user.college !== editedUser.college) changes.push(`College from '${user.college}' to '${editedUser.college}'`)
    if (user.role !== editedUser.role) changes.push(`Role from '${user.role}' to '${editedUser.role}'`)
    if (user.status !== editedUser.status) changes.push(`Status from ${user.status} to ${editedUser.status}`)
    if (user.retirementDate !== editedUser.retirementDate) changes.push(`Retirement Date was set from ${user.retirementDate} to ${editedUser.retirementDate}`)
    if (user.deactivationDate !== editedUser.deactivationDate) changes.push(`Deactivation Date was set from ${user.deactivationDate} to ${editedUser.deactivationDate}`)
    if (user.inactiveReason !== editedUser.inactiveReason) changes.push(`Inactive Reason from '${user.inactiveReason}' to '${editedUser.inactiveReason}'`)
    if (user.leaveReason !== editedUser.leaveReason) changes.push(`Leave Reason from '${user.leaveReason}' to '${editedUser.leaveReason}'`)
    if (user.leaveStartDate !== editedUser.leaveStartDate) changes.push(`Leave Start Date from '${user.leaveStartDate}' to '${editedUser.leaveStartDate}'`)
    if (user.leaveEndDate !== editedUser.leaveEndDate) changes.push(`Leave End Date from '${user.leaveEndDate}' to '${editedUser.leaveEndDate}'`)
    setLastEdited(`Last edited on ${new Date().toLocaleString()}: ${changes.join(", ")}`)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedUser(user)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditedUser({ ...editedUser, [e.target.name]: e.target.value })
  }

  const handleDateChange = (date: Date | null, field: string) => {
    if (date) {
      if (field === "leaveStartDate" && editedUser.leaveEndDate && date > new Date(editedUser.leaveEndDate)) {
        alert("Start date cannot be later than end date.")
        return
      }
      if (field === "leaveEndDate" && editedUser.leaveStartDate && date < new Date(editedUser.leaveStartDate)) {
        alert("End date cannot be earlier than start date.")
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
        <td>{getStatusBadge(user.status, user.inactiveReason)}</td>
        <td>
          <Button color="warning" onClick={handleEdit}>
            Edit
          </Button>
        </td>
      </tr>
      {isEditing && (
        <tr>
          <td colSpan={10}>
            <Row>
              <Col md={4}>
                <FormGroup>
                  <Label for="college">College</Label>
                  <Input type="select" name="college" id="college" value={editedUser.college} onChange={handleChange}>
                    {collegeOptions.map((option, index) => (
                      <option key={index} value={option}>
                        {option}
                      </option>
                    ))}
                  </Input>
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup>
                  <Label for="role">Role</Label>
                  <Input type="select" name="role" id="role" value={editedUser.role} onChange={handleChange}>
                    <option>Member</option>
                    <option>Operations Handler</option>
                    <option>Retiree</option>
                  </Input>
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup>
                  <Label for="status">Status</Label>
                  <Input type="select" name="status" id="status" value={editedUser.status} onChange={handleChange}>
                    <option>ACTIVE</option>
                    <option>INACTIVE</option>
                  </Input>
                </FormGroup>
              </Col>
            </Row>

            {editedUser.role === "Retiree" && (
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
                    />
                    <p>* The account remains accessible until this date.  After this, login will be disabled.</p>
                  </FormGroup>
                </Col>
              </Row>
            )}

            {editedUser.status === "INACTIVE" && (
              <>
                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Inactive Reason</Label>
                      <FormGroup check>
                        <Label check>
                          <Input
                            type="radio"
                            name="inactiveReason"
                            value="indefinite"
                            checked={editedUser.inactiveReason === "indefinite"}
                            onChange={handleChange}
                          />{" "}
                          Inactive Indefinitely
                        </Label>
                      </FormGroup>
                      <FormGroup check>
                        <Label check>
                          <Input
                            type="radio"
                            name="inactiveReason"
                            value="on-leave"
                            checked={editedUser.inactiveReason === "on-leave"}
                            onChange={handleChange}
                          />{" "}
                          On Leave
                        </Label>
                      </FormGroup>
                    </FormGroup>
                  </Col>
                </Row>

                {editedUser.inactiveReason === "on-leave" && (
                  <>
                  <Row>
                    <Col>
                      <Row>
                        <Col md={8} className="d-flex flex-row justify-content-end gap-3">
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
                    </Col>
                    <Col>
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
                    </Col>
                  </Row>
                  </>
                )}
              </>
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

