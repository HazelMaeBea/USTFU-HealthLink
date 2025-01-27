import React from "react";
import "./FormTextBox.css";
import "./FormBody.css";

interface FormTextBoxProps {
	label: string;
	placeholder: string;
	name: string;
}

const FormTextBox = ({ label, placeholder, name }: FormTextBoxProps) => {
	return (
		<div>
			<label className="form-label">{label}</label>
			<input
				type="text"
				className="form-control"
				placeholder={placeholder}
				name={name}
				id={name}
			/>
		</div>
	);
};

export default FormTextBox;
