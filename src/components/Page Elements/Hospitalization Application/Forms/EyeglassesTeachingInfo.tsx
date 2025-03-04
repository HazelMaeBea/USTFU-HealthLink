import React, { useState } from "react";
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { FormData } from "./FormBody";

interface FormTeachingInfoProps {
    register: UseFormRegister<FormData>;
    errors: FieldErrors<FormData>;

}

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

const FormTeachingInfo: React.FC<FormTeachingInfoProps> = ({
    register,
    errors
}) => {
    const [status, setStatus] = useState("");
    const [benefit, setBenefit] = useState("");

    const handleStatusChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setStatus(event.target.value);
    };

    const handleBenefitChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        setBenefit(event.target.value);
    };

    return (
        <>
            <fieldset className="TeachingInfo">
                <div className="row">
                        <div className="row">
                            <div className="mb-1 col-md-3">
                                <label htmlFor="term" className="form-label">
                                    Academic Term
                                </label>
                                <select
                                    {...register("term")}
                                    id="term"
                                    className="form-select"
                                >
                                    <option value="" disabled selected hidden>
                                        Select term
                                    </option>
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
                            <div className="mb-1 col-md-3">
                                <label htmlFor="year" className="form-label">
                                    Academic Year
                                </label>
                                <select
                                    {...register("year")}
                                    id="year"
                                    className="form-select"
                                >
                                    <option value="" disabled selected hidden>
                                        Select year
                                    </option>
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
                    
   
                </div>
            </fieldset>
            <hr className="section-separator" />
        </>
    );
};

export default FormTeachingInfo;
