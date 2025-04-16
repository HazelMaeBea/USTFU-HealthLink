"use client";

import React, { useRef, useEffect } from "react";
import { useState } from "react";
import { Button, Input, FormGroup, Label, Row, Col } from "reactstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { differenceInDays, differenceInWeeks } from "date-fns";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { HiOutlineDotsVertical } from "react-icons/hi";
import { FiEdit2, FiUsers, FiToggleLeft, FiCreditCard } from "react-icons/fi";
import { createPortal } from "react-dom";
import Popout from "../../Page Elements/Popout/Popout";
import "./UserManagement.css";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../../../contexts/firebase";
import { formatDateToMMDDYYYY, parseToDate } from "../../../utils/dateUtils";

interface User {
	id: string;
	name: string;
	email: string;
	college: string;
	birthdate: string;
	phoneNumber: string;
	role: string;
	status: string;
	retirementDate?: string;
	deactivationDate?: string;
	leaveReason?: string;
	leaveStartDate?: string;
	leaveEndDate?: string;
	document: string;
	createdAt: Timestamp;
	remainingBenefits?: string;
}

interface UserRowProps {
	user: User;
	isMobile?: boolean;
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

const calculateDuration = (
	start: string | undefined,
	end: string | undefined
) => {
	if (!start || !end) return "";
	try {
		const startDate = new Date(start);
		const endDate = new Date(end);
		if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return "";
		const diffDays = differenceInDays(endDate, startDate);
		const diffWeeks = differenceInWeeks(endDate, startDate);
		return `${diffWeeks} week(s) and ${diffDays % 7} day(s)`;
	} catch (error) {
		console.error("Error calculating duration:", error);
		return "";
	}
};

const convertDateForDisplay = (
	dateString: string | null | undefined
): Date | undefined => {
	if (!dateString) return undefined;
	const parsedDate = parseToDate(dateString);
	return parsedDate || undefined;
};

const UserRow: React.FC<UserRowProps> = ({ user, isMobile = false }) => {
	const [isEditing, setIsEditing] = useState(false);
	const [editedUser, setEditedUser] = useState(user);
	const [lastEdited, setLastEdited] = useState<string | null>(null);
	const [editOption, setEditOption] = useState<
		"college" | "role" | "status" | "remainingBenefits" | null
	>(null);
	const [showOptions, setShowOptions] = useState(false);
	const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});
	const [showPopout, setShowPopout] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node) &&
				menuRef.current &&
				!menuRef.current.contains(event.target as Node)
			) {
				setShowOptions(false);
			}
		}

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	const handleToggleOptions = (e: React.MouseEvent) => {
		e.stopPropagation();
		setShowOptions(!showOptions);
		if (containerRef.current) {
			const rect = containerRef.current.getBoundingClientRect();
			setPopupStyle({
				position: "fixed",
				top: rect.bottom + 8,
				left: rect.left - 150,
				zIndex: 1050,
			});
		}
	};

	const handleEditAndExpand = (
		option: "college" | "role" | "status" | "remainingBenefits"
	) => {
		setIsEditing(true);
		setEditOption(option);
		setEditedUser(user);
		setShowOptions(false);
	};

	const handleSave = () => {
		if (
			editedUser.role === "retiree" &&
			(!editedUser.retirementDate || !editedUser.deactivationDate)
		) {
			alert("Please provide both retirement date and deactivation date.");
			return;
		}
		if (editedUser.role === "retiree" && editedUser.status === "INACTIVE") {
			alert("Cannot set status to inactive when role is retiree.");
			return;
		}
		if (
			editedUser.status === "ON-LEAVE" &&
			(!editedUser.leaveStartDate || !editedUser.leaveEndDate)
		) {
			alert("Please provide both leave start date and leave end date.");
			return;
		}

		setShowPopout(true);
	};

	const handleSaveConfirm = async () => {
		try {
			const changes: string[] = [];
			if (user.college !== editedUser.college)
				changes.push(
					`College from '${user.college}' to '${editedUser.college}'`
				);
			if (user.role !== editedUser.role)
				changes.push(
					`Role from '${user.role}' to '${editedUser.role}'`
				);
			if (user.status !== editedUser.status)
				changes.push(
					`Status from '${user.status}' to '${editedUser.status}'`
				);
			if (user.retirementDate !== editedUser.retirementDate)
				changes.push(
					`Retirement Date from '${user.retirementDate}' to '${editedUser.retirementDate}'`
				);
			if (user.deactivationDate !== editedUser.deactivationDate)
				changes.push(
					`Deactivation Date from '${user.deactivationDate}' to '${editedUser.deactivationDate}'`
				);
			if (user.leaveReason !== editedUser.leaveReason)
				changes.push(
					`Leave Reason from '${user.leaveReason}' to '${editedUser.leaveReason}'`
				);
			if (user.leaveStartDate !== editedUser.leaveStartDate)
				changes.push(
					`Leave Start Date from '${user.leaveStartDate}' to '${editedUser.leaveStartDate}'`
				);
			if (user.leaveEndDate !== editedUser.leaveEndDate)
				changes.push(
					`Leave End Date from '${user.leaveEndDate}' to '${editedUser.leaveEndDate}'`
				);
			if (user.remainingBenefits !== editedUser.remainingBenefits)
				changes.push(
					`Remaining Benefits from '${user.remainingBenefits}' to '${editedUser.remainingBenefits}'`
				);
			if (changes.length > 0) {
				setLastEdited(
					`Last edited on ${new Date().toLocaleString()}: ${changes.join(
						", "
					)}`
				);

				await addDoc(collection(db, "auditLogs"), {
					Time: new Date(),
					Name: user.name,
					Changes: changes,
				});
			}

			if (editOption === "college") {
				await setDoc(
					doc(db, "users", editedUser.document),
					{
						personalInfo: { college: editedUser.college },
						createdAt: editedUser.createdAt,
					},
					{ merge: true }
				);
			} else {
				await setDoc(
					doc(db, "users", editedUser.document),
					{
						...editedUser,
						createdAt: editedUser.createdAt,
					},
					{ merge: true }
				);
			}
			setIsEditing(false);
			setEditOption(null);
			setShowPopout(false);
		} catch (error) {
			console.error("Error saving changes:", error);
			alert("Failed to save changes. Please try again.");
		}
	};

	const handleCancel = () => {
		setIsEditing(false);
		setEditedUser(user);
		setEditOption(null);
		setShowPopout(false);
	};

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = e.target;
		setEditedUser({ ...editedUser, [name]: value });
	};

	const handleDateChange = (date: Date | null, field: string) => {
		if (date) {
			const today = new Date();
			if (
				field === "leaveStartDate" &&
				editedUser.leaveEndDate &&
				date > (parseToDate(editedUser.leaveEndDate) || new Date())
			) {
				alert("Start date cannot be later than end date.");
				return;
			}
			if (
				field === "leaveEndDate" &&
				editedUser.leaveStartDate &&
				date < (parseToDate(editedUser.leaveStartDate) || new Date())
			) {
				alert("End date cannot be earlier than start date.");
				return;
			}
			if (
				field === "retirementDate" &&
				editedUser.deactivationDate &&
				date > (parseToDate(editedUser.deactivationDate) || new Date())
			) {
				alert(
					"Retirement date cannot be later than deactivation date."
				);
				return;
			}
			if (
				field === "deactivationDate" &&
				editedUser.retirementDate &&
				date < (parseToDate(editedUser.retirementDate) || new Date())
			) {
				alert(
					"Deactivation date cannot be earlier than retirement date."
				);
				return;
			}
			if (field === "deactivationDate" && date < today) {
				alert("Deactivation date cannot be a past date.");
				return;
			}
			setEditedUser({
				...editedUser,
				[field]: formatDateToMMDDYYYY(date),
			});
		} else {
			setEditedUser({
				...editedUser,
				[field]: null,
			});
		}
	};

	if (isMobile) {
		return (
			<div className="mobile-card">
				<div className="mobile-card-header">
					<div className="mobile-card-header-left">
						<h3 className="mobile-card-title">{user.name}</h3>
						<a
							href={`mailto:${user.email}`}
							className="mobile-card-email"
						>
							{user.email}
						</a>
					</div>
					<div ref={containerRef} style={{ position: "relative" }}>
						<HiOutlineDotsVertical
							className="cursor-pointer"
							size={24}
							onClick={handleToggleOptions}
							style={{ color: "#666" }}
						/>
						{showOptions &&
							createPortal(
								<div
									className="edit-options-menu"
									style={popupStyle}
									ref={menuRef}
									onClick={(e) => e.stopPropagation()}
								>
									<div className="edit-options-menu-inner">
										<button
											onClick={() =>
												handleEditAndExpand("college")
											}
										>
											<FiUsers
												style={{ marginRight: "10px" }}
											/>{" "}
											Edit College
										</button>
										<button
											onClick={() =>
												handleEditAndExpand("role")
											}
										>
											<FiEdit2
												style={{ marginRight: "10px" }}
											/>{" "}
											Edit Role
										</button>
										{editedUser.role !== "retiree" && (
											<button
												onClick={() =>
													handleEditAndExpand(
														"status"
													)
												}
											>
												<FiToggleLeft
													style={{
														marginRight: "10px",
													}}
												/>{" "}
												Edit Status
											</button>
										)}
										<button
											onClick={() =>
												handleEditAndExpand(
													"remainingBenefits"
												)
											}
										>
											<FiCreditCard
												style={{ marginRight: "10px" }}
											/>{" "}
											Edit Remaining Benefits
										</button>
									</div>
								</div>,
								document.body
							)}
					</div>
				</div>
				<div className="mobile-card-body">
					<div className="mobile-card-row">
						<span className="mobile-card-label">ID:</span>
						<span className="mobile-card-value">{user.id}</span>
					</div>
					<div className="mobile-card-row">
						<span className="mobile-card-label">College:</span>
						<span className="mobile-card-value">
							{user.college}
						</span>
					</div>
					<div className="mobile-card-row">
						<span className="mobile-card-label">Birthdate:</span>
						<span className="mobile-card-value">
							{user.birthdate}
						</span>
					</div>
					<div className="mobile-card-row">
						<span className="mobile-card-label">Contact #:</span>
						<span className="mobile-card-value">
							{user.phoneNumber}
						</span>
					</div>
					<div className="mobile-card-row">
						<span className="mobile-card-label">
							Remaining Benefits:
						</span>
						<span className="mobile-card-value">
							{user.remainingBenefits !== undefined &&
							user.remainingBenefits !== null
								? `₱${user.remainingBenefits.toString()}`
								: "N/A"}
						</span>
					</div>
					<div className="mobile-card-row">
						<span className="mobile-card-label">Role:</span>
						<span className="mobile-card-value">{user.role}</span>
					</div>
					<div className="mobile-card-row">
						<span className="mobile-card-label">Status:</span>
						<span className="mobile-card-value">
							{getStatusBadge(user.status)}
						</span>
					</div>
				</div>
				{isEditing && (
					<div className="mobile-card-edit">
						{editOption === "college" && (
							<FormGroup>
								<Label for="college">College</Label>
								<Input
									type="select"
									name="college"
									id="edit_college"
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
									id="edit_role"
									className="dropdown-select"
									value={editedUser.role}
									onChange={handleChange}
								>
									<option value="member">Member</option>
									<option value="operations handler">
										Operations Handler
									</option>
									<option value="retiree">Retiree</option>
								</Input>
								{editedUser.role === "retiree" &&
									editOption === "role" && (
										<Row className="mt-3">
											<Col md={6}>
												<FormGroup>
													<Label for="retirementDate">
														Retirement Date
													</Label>
													<br />
													<DatePicker
														selected={convertDateForDisplay(
															editedUser.retirementDate
														)}
														onChange={(date) =>
															handleDateChange(
																date,
																"retirementDate"
															)
														}
														className="form-control"
														required
														maxDate={
															editedUser.deactivationDate
																? convertDateForDisplay(
																		editedUser.deactivationDate
																  )
																: undefined
														}
													/>
													<p>
														* The date when the
														employee officially
														retires.
													</p>
												</FormGroup>
											</Col>
											<Col md={6}>
												<FormGroup>
													<Label for="deactivationDate">
														Deactivation Date
													</Label>
													<br />
													<DatePicker
														selected={convertDateForDisplay(
															editedUser.deactivationDate
														)}
														onChange={(date) =>
															handleDateChange(
																date,
																"deactivationDate"
															)
														}
														className="form-control"
														required
														minDate={new Date()}
														excludeDates={[
															new Date(),
														]}
													/>
													<p>
														* Account remains
														accessible until this
														date.
													</p>
												</FormGroup>
											</Col>
										</Row>
									)}
							</FormGroup>
						)}
						{editOption === "status" && (
							<FormGroup>
								<Label for="status">Status</Label>
								<Input
									type="select"
									name="status"
									id="edit_status"
									className="dropdown-select"
									value={editedUser.status}
									onChange={handleChange}
								>
									<option>ACTIVE</option>
									<option>INACTIVE</option>
									<option>ON-LEAVE</option>
								</Input>
								{editedUser.status === "ON-LEAVE" && (
									<>
										<Row>
											<Col md={6}>
												<FormGroup>
													<Label for="leaveStartDate">
														Start Date
													</Label>
													<br />
													<DatePicker
														selected={convertDateForDisplay(
															editedUser.leaveStartDate
														)}
														onChange={(date) =>
															handleDateChange(
																date,
																"leaveStartDate"
															)
														}
														className="form-control"
														required
														selectsStart
														startDate={convertDateForDisplay(
															editedUser.leaveStartDate
														)}
														endDate={convertDateForDisplay(
															editedUser.leaveEndDate
														)}
														maxDate={
															editedUser.leaveEndDate
																? convertDateForDisplay(
																		editedUser.leaveEndDate
																  )
																: undefined
														}
													/>
												</FormGroup>
											</Col>
											<Col md={6}>
												<FormGroup>
													<Label for="leaveEndDate">
														End Date
													</Label>
													<br />
													<DatePicker
														selected={convertDateForDisplay(
															editedUser.leaveEndDate
														)}
														onChange={(date) =>
															handleDateChange(
																date,
																"leaveEndDate"
															)
														}
														className="form-control"
														required
														selectsEnd
														startDate={convertDateForDisplay(
															editedUser.leaveStartDate
														)}
														endDate={convertDateForDisplay(
															editedUser.leaveEndDate
														)}
														minDate={
															editedUser.leaveStartDate
																? convertDateForDisplay(
																		editedUser.leaveStartDate
																  )
																: undefined
														}
													/>
												</FormGroup>
											</Col>
										</Row>
										<Row>
											<Col md={8}>
												<p>
													Duration:{" "}
													{calculateDuration(
														editedUser.leaveStartDate,
														editedUser.leaveEndDate
													)}
												</p>
											</Col>
										</Row>
										<Row>
											<Col md={8}>
												<FormGroup>
													<Label for="leaveReason">
														Reason for Leave
													</Label>
													<Input
														type="textarea"
														name="leaveReason"
														id="leaveReason"
														value={
															editedUser.leaveReason ||
															""
														}
														onChange={handleChange}
														required
													/>
												</FormGroup>
											</Col>
										</Row>
									</>
								)}
							</FormGroup>
						)}
						{editOption === "remainingBenefits" && (
							<FormGroup>
								<Label for="remainingBenefits">
									Remaining Benefits
								</Label>
								<Input
									type="number"
									name="remainingBenefits"
									id="edit_remainingBenefits"
									value={editedUser.remainingBenefits ?? ""}
									onChange={handleChange}
								/>
							</FormGroup>
						)}
						{lastEdited && (
							<div style={{ marginTop: "1rem" }}>
								<p className="text-muted">{lastEdited}</p>
							</div>
						)}
						<div className="mobile-card-edit-buttons">
							<Button color="success" onClick={handleSave}>
								Save
							</Button>
							<Button
								color="secondary"
								onClick={handleCancel}
								className="ms-2"
							>
								Cancel
							</Button>
						</div>
						{showPopout && (
							<Popout
								title="Save Changes?"
								message={`Do you want to save changes to the user's ${editOption}?`}
								onConfirm={handleSaveConfirm}
								onCancel={() => setShowPopout(false)}
								isOpen={showPopout}
							/>
						)}
					</div>
				)}
			</div>
		);
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
				<td>
					{user.remainingBenefits !== undefined &&
					user.remainingBenefits !== null
						? `₱${user.remainingBenefits.toString()}`
						: "N/A"}
				</td>
				<td>{user.role}</td>
				<td>{getStatusBadge(user.status)}</td>
				<td style={{ position: "relative" }}>
					<div
						className="edit-button-container"
						ref={containerRef}
						style={{ position: "relative" }}
					>
						<HiOutlineDotsVertical
							className="edit-button"
							size={24}
							onClick={handleToggleOptions}
							style={{ color: "#666" }}
						/>
						{showOptions &&
							createPortal(
								<div
									className="edit-options-menu"
									style={popupStyle}
									ref={menuRef}
									onClick={(e) => e.stopPropagation()}
								>
									<div className="edit-options-menu-inner">
										<button
											onClick={() => {
												handleEditAndExpand("college");
											}}
										>
											<FiUsers
												style={{ marginRight: "10px" }}
											/>{" "}
											Edit College
										</button>
										<button
											onClick={() => {
												handleEditAndExpand("role");
											}}
										>
											<FiEdit2
												style={{ marginRight: "10px" }}
											/>{" "}
											Edit Role
										</button>
										{editedUser.role !== "retiree" && (
											<button
												onClick={() => {
													handleEditAndExpand(
														"status"
													);
												}}
											>
												<FiToggleLeft
													style={{
														marginRight: "10px",
													}}
												/>{" "}
												Edit Status
											</button>
										)}
										<button
											onClick={() => {
												handleEditAndExpand(
													"remainingBenefits"
												);
											}}
										>
											<FiEdit2
												style={{ marginRight: "10px" }}
											/>{" "}
											Edit Remaining Benefits
										</button>
									</div>
								</div>,
								document.body
							)}
					</div>
				</td>
			</tr>
			{isEditing && (
				<tr>
					<td colSpan={11}>
						{editOption === "college" && (
							<FormGroup>
								<Label for="college">College</Label>
								<Input
									type="select"
									name="college"
									id="edit_college"
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
									id="edit_role"
									className="dropdown-select"
									value={editedUser.role}
									onChange={handleChange}
								>
									<option value="member">Member</option>
									<option value="operations handler">
										Operations Handler
									</option>
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
										id="edit_status"
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
													<Label for="leaveStartDate">
														Start Date
													</Label>
													<br />
													<DatePicker
														selected={convertDateForDisplay(
															editedUser.leaveStartDate
														)}
														onChange={(date) =>
															handleDateChange(
																date,
																"leaveStartDate"
															)
														}
														className="form-control"
														required
														selectsStart
														startDate={convertDateForDisplay(
															editedUser.leaveStartDate
														)}
														endDate={convertDateForDisplay(
															editedUser.leaveEndDate
														)}
														maxDate={
															editedUser.leaveEndDate
																? convertDateForDisplay(
																		editedUser.leaveEndDate
																  )
																: undefined
														}
													/>
												</FormGroup>
											</Col>
											<Col md={6}>
												<FormGroup>
													<Label for="leaveEndDate">
														End Date
													</Label>
													<br />
													<DatePicker
														selected={convertDateForDisplay(
															editedUser.leaveEndDate
														)}
														onChange={(date) =>
															handleDateChange(
																date,
																"leaveEndDate"
															)
														}
														className="form-control"
														required
														selectsEnd
														startDate={convertDateForDisplay(
															editedUser.leaveStartDate
														)}
														endDate={convertDateForDisplay(
															editedUser.leaveEndDate
														)}
														minDate={
															editedUser.leaveStartDate
																? convertDateForDisplay(
																		editedUser.leaveStartDate
																  )
																: undefined
														}
													/>
												</FormGroup>
											</Col>
										</Row>
										<Row>
											<Col md={8}>
												<p>
													Duration:{" "}
													{calculateDuration(
														editedUser.leaveStartDate,
														editedUser.leaveEndDate
													)}
												</p>
											</Col>
										</Row>
										<Row>
											<Col md={8}>
												<FormGroup>
													<Label for="leaveReason">
														Reason for Leave
													</Label>
													<Input
														type="textarea"
														name="leaveReason"
														id="leaveReason"
														value={
															editedUser.leaveReason ||
															""
														}
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

						{editedUser.role === "retiree" &&
							editOption === "role" && (
								<Row className="mt-3">
									<Col md={6}>
										<FormGroup>
											<Label for="retirementDate">
												Retirement Date
											</Label>
											<br />
											<DatePicker
												selected={convertDateForDisplay(
													editedUser.retirementDate
												)}
												onChange={(date) =>
													handleDateChange(
														date,
														"retirementDate"
													)
												}
												className="form-control"
												required
												maxDate={
													editedUser.deactivationDate
														? convertDateForDisplay(
																editedUser.deactivationDate
														  )
														: undefined
												}
											/>
											<p>
												* The date when the employee
												officially retires.
											</p>
										</FormGroup>
									</Col>
									<Col md={6}>
										<FormGroup>
											<Label for="deactivationDate">
												Deactivation Date
											</Label>
											<br />
											<DatePicker
												selected={convertDateForDisplay(
													editedUser.deactivationDate
												)}
												onChange={(date) =>
													handleDateChange(
														date,
														"deactivationDate"
													)
												}
												className="form-control"
												required
												minDate={new Date()}
												excludeDates={[new Date()]}
											/>
											<p>
												* Account remains accessible
												until this date.
											</p>
										</FormGroup>
									</Col>
								</Row>
							)}

						{editOption === "remainingBenefits" && (
							<FormGroup>
								<Label for="remainingBenefits">
									Remaining Benefits
								</Label>
								<Input
									type="number"
									name="remainingBenefits"
									id="edit_remainingBenefits"
									value={editedUser.remainingBenefits ?? ""}
									onChange={handleChange}
								/>
							</FormGroup>
						)}

						{lastEdited && (
							<div style={{ marginTop: "1rem" }}>
								<p className="text-muted">{lastEdited}</p>
							</div>
						)}
						<Button color="success" onClick={handleSave}>
							Save
						</Button>
						<Button
							color="secondary"
							onClick={handleCancel}
							className="ms-2"
						>
							Cancel
						</Button>
						{showPopout && (
							<Popout
								title="Save Changes?"
								message={`Do you want to save changes to the user's ${editOption}?`}
								onConfirm={handleSaveConfirm}
								onCancel={() => setShowPopout(false)}
								isOpen={showPopout}
							/>
						)}
					</td>
				</tr>
			)}
		</>
	);
};

export default UserRow;
