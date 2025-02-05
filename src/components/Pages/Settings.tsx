import { useState } from "react";
import { useForm } from "react-hook-form";
import { number, z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import "./Settings.css";
import FormPersonalInfo from "../Page Elements/Hospitalization Application/Forms/FormPersonalInfo";
import DatePicker from "react-datepicker";
import Popout from "../Page Elements/Popout/Popout";

const schema = z.object({
	lastname: z.string().nonempty("Last name is required"),
	firstname: z.string().nonempty("First name is required"),
	middlename: z.string().nonempty("Middle name is required"),
	suffix: z.string().optional(),
	age: z.number().min(18, "Age must be at least 18"),
	term: z.string().nonempty("Term is required"),
	year: z.string().nonempty("Year is required"),
	load: z.string().nonempty("Load is required"),
	status: z.string().nonempty("Status is required"),
	numberID: number().min(0, "ID Number is required"),
	address: z.string().nonempty("Address is required"),
	dateHired: z.date().optional(),
	dateRetired: z.date().optional(),
});

type FormData = z.infer<typeof schema>;

const Settings = () => {
	const [dateHired, setDateHired] = useState<Date | null>(null);
	const [dateRetired, setDateRetired] = useState<Date | null>(null);
	const [isPopoutOpen, setIsPopoutOpen] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<FormData>({ resolver: zodResolver(schema) });

	const onSubmit = (data: FormData) => {
		console.log({ data, dateHired, dateRetired });
	};

	const handleUpdateClick = () => {
		setIsPopoutOpen(true);
	};

	const handleConfirmUpdate = () => {
		setIsPopoutOpen(false);
		handleSubmit(onSubmit)();
	};

	const handleCancelUpdate = () => {
		setIsPopoutOpen(false);
	};

	const termOptions = ["1st", "2nd"];
	const yearOptions = ["2021-2022", "2022-2023", "2023-2024"];
	const loadOptions = ["Full", "Part"];
	const statusOptions = [
		"Tenured",
		"Tenured-Track",
		"Lecturer Before 2001",
		"Extendee",
		"Retiree",
	];
	const benefitsOptions = ["HMO", "PCSO", "Senior Citizen"];

	return (
		<div className="settings-container">
			<div className="row">
				<div className="col-md-12">
					<h1>NOTIFICATION SETTINGS</h1>
					<hr />
				</div>
			</div>

			<div className="notifications-container">
				<div className="row notification-form">
					<div className="col-md-11">
						<p>
							Receive <strong>form status</strong> notifications
							via associated UST email account
						</p>
					</div>
					<div className="col-md-1">
						<div className="form-check">
							<label className="form-check-label form-check-toggle">
								<input
									className="form-check-input"
									type="checkbox"
									aria-label="turn on notifications"
								/>
								<span></span>
							</label>
						</div>
					</div>
				</div>
			</div>

			<div className="row settings-form">
				<div className="col-md-12">
					<h1>USER PROFILE SETTINGS</h1>
					<hr />
				</div>
			</div>

			<div className="user-profile-container">
				<div className="row">
					<div className="col-md-11">
						<p>Auto-fill information on application forms</p>
					</div>
					<div className="col-md-1">
						<div className="form-check">
							<label className="form-check-label form-check-toggle">
								<input
									className="form-check-input"
									type="checkbox"
									aria-label="turn on autofill"
								/>
								<span></span>
							</label>
						</div>
					</div>
				</div>
				<FormPersonalInfo register={register} errors={errors} />
				<div className="row">
					<div className="mb-1 col-md-4">
						<label htmlFor="numberID" className="form-label">
							ID Number
						</label>
						<input
							{...register("numberID", {
								valueAsNumber: true,
							})}
							id="numberID"
							type="number"
							className="form-control"
						/>
						{errors.numberID && (
							<p className="text-danger">
								{errors.numberID.message}
							</p>
						)}
					</div>
					<div className="mb-1 col-md-8">
						<label htmlFor="address" className="form-label">
							Address
						</label>
						<input
							{...register("address")}
							id="address"
							type="text"
							className="form-control"
						/>
						{errors.address && (
							<p className="text-danger">
								{errors.address.message}
							</p>
						)}
					</div>
				</div>
				<div className="row">
					<div className="mb-1 col-md-4">
						<div className="row">
							<div className="mb-1 col-md-6">
								<label htmlFor="term" className="form-label">
									Academic Term
								</label>
								<select
									{...register("term")}
									id="term"
									className="form-select"
								>
									<option
										value=""
										disabled
										selected
										hidden
									></option>
									{termOptions.map((option, index) => (
										<option key={index} value={option}>
											{option}
										</option>
									))}
								</select>
								{errors.term && (
									<p className="text-danger">
										{errors.term.message}
									</p>
								)}
							</div>
							<div className="mb-1 col-md-6">
								<label htmlFor="year" className="form-label">
									Academic Year
								</label>
								<select
									{...register("year")}
									id="year"
									className="form-select"
								>
									<option
										value=""
										disabled
										selected
										hidden
									></option>
									{yearOptions.map((option, index) => (
										<option key={index} value={option}>
											{option}
										</option>
									))}
								</select>
								{errors.year && (
									<p className="text-danger">
										{errors.year.message}
									</p>
								)}
							</div>
						</div>
						<div className="mb-1 col-md-5">
							<label htmlFor="load" className="form-label">
								Teaching Load
							</label>
							<select
								{...register("load")}
								id="load"
								className="form-select"
							>
								<option
									value=""
									disabled
									selected
									hidden
								></option>
								{loadOptions.map((option, index) => (
									<option key={index} value={option}>
										{option}
									</option>
								))}
							</select>
							{errors.load && (
								<p className="text-danger">
									{errors.load.message}
								</p>
							)}
						</div>
					</div>
					<div className="mb-1 col-md-3">
						<label className="form-label">Status</label>
						{statusOptions.map((option, index) => (
							<div key={index} className="form-check">
								<input
									{...register("status")}
									id={`status-${index}`}
									type="radio"
									value={option}
									className="form-check-input"
								/>
								<label
									htmlFor={`status-${index}`}
									className="form-check-label"
								>
									{option}
								</label>
							</div>
						))}
						{errors.status && (
							<p className="text-danger">
								{errors.status.message}
							</p>
						)}
					</div>
					<div className="mb-1 col-md-5">
						<div className="row">
							<div className="col-md-6">
								<label
									htmlFor="dateHired"
									className="form-label"
								>
									If Tenure-Track, please input DATE HIRED:
								</label>
								<DatePicker
									selected={dateHired}
									onChange={(date) =>
										setDateHired(date || new Date())
									}
									id="dateHired"
									className="form-control"
								/>
								{errors.dateHired && (
									<p className="text-danger">
										{errors.dateHired.message}
									</p>
								)}
							</div>
							<div className="col-md-6">
								<label
									htmlFor="dateRetired"
									className="form-label"
								>
									If Retiree, please input DATE RETIRED:
								</label>
								<DatePicker
									selected={dateRetired}
									onChange={(date) =>
										setDateRetired(date || new Date())
									}
									id="dateRetired"
									className="form-control"
								/>
								{errors.dateRetired && (
									<p className="text-danger">
										{errors.dateRetired.message}
									</p>
								)}
							</div>
						</div>
					</div>
				</div>

				<div className="buttonDiv">
					<button
						type="button"
						className="btn btn-submit form-submit"
						onClick={handleUpdateClick}
					>
						Update Information
					</button>
				</div>
			</div>
			<Popout
				title="Confirm Update"
				message="Are you sure you want to update the information?"
				onConfirm={handleConfirmUpdate}
				onCancel={handleCancelUpdate}
				isOpen={isPopoutOpen}
			/>
		</div>
	);
};

export default Settings;
