import React from 'react';
import { FieldValues, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import './FormBody.css';

const schema = z.object({
  lastname: z.string({ invalid_type_error: 'Last name is required' }),
  firstname: z.string({ invalid_type_error: 'First name is required' }),
  middlename: z.string({ invalid_type_error: 'Middle name is required' }),
  age: z.number({ invalid_type_error: 'Age is required' }).min(18),
  suffix: z.string().optional(),
  gender: z.enum(['Male', 'Female'], { invalid_type_error: 'Gender is required' }),
  college: z.enum([
    "Faculty of Sacred Theology", 
    "Faculty of Philosophy", 
    "Faculty of Canon Law", 
    "Faculty of Civil Law", 
    "Faculty of Medicine and Surgery", 
    "Faculty of Pharmacy", 
    "Faculty of Engineering", 
    "Faculty of Arts and Letters", 
    "College of Architecture", 
    "College of Commerce and Business Administration",
    "College of Education", 
    "College of Fine Arts and Design", 
    "College of Nursing", 
    "College of Rehabilitation Sciences", 
    "College of Science", 
    "College of Tourism and Hospitality Management", 
    "College of Information and Computing Sciences (CICS)", 
    "Graduate School", 
    "Graduate School of Law", 
    "Conservatory of Music", 
    "Institute of Physical Education and Athletics (IPEA)", 
    "UST Senior High School", 
    "UST Junior High School", 
    "UST Education High School"], { invalid_type_error: 'College Affiliation is required' }),
    contact: z.number({ invalid_type_error: 'Contact number is required' }).min(21),
    hospital: z.string({ invalid_type_error: 'Hospital is required' }),
    illness: z.string({ invalid_type_error: 'Nature of Illness is required' }),
    physician: z.string({ invalid_type_error: 'Physician is required' }),
    procedures: z.string({ invalid_type_error: 'Procedures is required' }),
    status: z.enum(['Tenured', 'Tenured-Track', 'Lecturer Before 2001', 'Extendee', 'Retiree'], { invalid_type_error: 'Status is required' }),
    term: z.enum(["idk", "idk2"], { invalid_type_error: 'Academic Term is required' }),
    year: z.enum(["idk", "idk2"], { invalid_type_error: 'Academic Year is required' }),
    load: z.enum(["idk", "idk2"], { invalid_type_error: 'Teaching Load is required' }),
    dateHired: z.date().optional(),
    dateRetired: z.date().optional(),
    healthBenefits: z.enum(['Tenured', 'Tenured-Track', 'Lecturer Before 2001', 'Extendee', 'Retiree'], { invalid_type_error: 'Health Benefits is required' }),
    benefits: z.enum(['HMO', 'PCSO', 'Senior Citizen'], { invalid_type_error: 'Health Benefits is required' }),
    hmo: z.string().optional(),



});

type FormData = z.infer<typeof schema>;

const FormBody = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = (data: FieldValues) => console.log(data);

  const suffixOptions = ['Sr.', 'Jr.', 'II', 'III', 'IV', 'MD', 'PhD', 'Lord', 'Master', 'Optimus Prime'];
  const genderOptions = ['Male', 'Female']
  const collegeOptions = ["Faculty of Sacred Theology",
		"Faculty of Philosophy",
		"Faculty of Canon Law",
		"Faculty of Civil Law",
		"Faculty of Medicine and Surgery",
		"Faculty of Pharmacy",
		"Faculty of Engineering",
		"Faculty of Arts and Letters",
		"College of Architecture",
		"College of Commerce and Business Administration",
		"College of Education",
		"College of Fine Arts and Design",
		"College of Nursing",
		"College of Rehabilitation Sciences",
		"College of Science",
		"College of Tourism and Hospitality Management",
		"College of Information and Computing Sciences (CICS)",
		"Graduate School",
		"Graduate School of Law",
		"Conservatory of Music",
		"Institute of Physical Education and Athletics (IPEA)",
		"UST Senior High School",
		"UST Junior High School",
		"UST Education High School"]
  const statusOptions = ['Tenured', 'Tenured-Track', 'Lecturer Before 2001', 'Extendee', 'Retiree']
  const termOptions = ["idk", "idk2"]
  const yearOptions = ["idk", "idk2"]
  const loadOptions = ["idk", "idk2"]
  const benefitsOptions = ['HMO', 'PCSO', 'Senior Citizen']



  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <p className="note">Please fill out the following boxes</p>
      <fieldset className="PersonalInfo line">
        <div className="row">
          <div className="mb-1 col-md-3">
            <label htmlFor="lastname" className="form-label">Last Name</label>
            <input
              {...register('lastname')}
              id="lastname"
              type="text"
              className="form-control"
            />
            {errors.lastname && (
              <p className="text-danger">{errors.lastname.message}</p>
            )}
          </div>
          <div className="mb-1 col-md-3">
            <label htmlFor="firstname" className="form-label">First Name</label>
            <input
              {...register('firstname')}
              id="firstname"
              type="text"
              className="form-control"
            />
            {errors.firstname && (
              <p className="text-danger">{errors.firstname.message}</p>
            )}
          </div>
          <div className="mb-1 col-md-3">
            <label htmlFor="middlename" className="form-label">Middle Name</label>
            <input
              {...register('middlename')}
              id="middlename"
              type="text"
              className="form-control"
            />
            {errors.middlename && (
              <p className="text-danger">{errors.middlename.message}</p>
            )}
          </div>
          <div className="mb-1 col-md-3">
              <label htmlFor="suffix" className="form-label">Suffix</label>
              <select
                {...register('suffix')}
                id="suffix"
                className="form-select"
              >
                <option value="" disabled selected hidden></option>
                {suffixOptions.map((option, index) => (
                  <option key={index} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
        </div>
{/* THIS IS THE NEXT ROW, PUTTING THIS SO I CAN SEE PROPERLY */}
        <div className="row">
          <div className="mb-1 col-md-3">
            <label htmlFor="age" className="form-label">Age</label>
            <input
              {...register('age', { valueAsNumber: true })}
              id="age"
              type="number"
              className="form-control"
            />
            {errors.age && (
              <p className="text-danger">{errors.age.message}</p>
            )}
          </div>
          <div className="mb-1 col-md-3">
              <label htmlFor="gender" className="form-label">Gender</label>
              <select
                {...register('gender')}
                id="gender"
                className="form-select"
              >
                <option value="" disabled selected hidden></option>
                {genderOptions.map((option, index) => (
                  <option key={index} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-1 col-md-6">
              <label htmlFor="college" className="form-label">College Affiliation</label>
              <select
                {...register('college')}
                id="college"
                className="form-select"
              >
                <option value="" disabled selected hidden></option>
                {collegeOptions.map((option, index) => (
                  <option key={index} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
        </div>
        <div className="row">
          <div className="mb-1 col-md-3">
            <label htmlFor="contact" className="form-label">Contact Number</label>
            <input
              {...register('contact', { valueAsNumber: true })}
              id="contact"
              type="number"
              className="form-control"
            />
            {errors.contact && (
              <p className="text-danger">{errors.contact.message}</p>
            )}
          </div>
        </div>
      </fieldset>
{/* MEDICAL INFOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO */}

      <fieldset className="MedicalInfo">
        <div className="row">
          <div className="mb-1 col-md-3">
            <label htmlFor="hospital" className="form-label">Hospital Name</label>
            <input
              {...register('hospital')}
              id="hospital"
              type="text"
              className="form-control"
            />
            {errors.hospital && (
              <p className="text-danger">{errors.hospital.message}</p>
            )}
          </div>
          <div className="mb-1 col-md-6">
            <label htmlFor="illness" className="form-label">Nature of Illness</label>
            <input
              {...register('illness')}
              id="illness"
              type="text"
              className="form-control"
            />
            {errors.illness && (
              <p className="text-danger">{errors.illness.message}</p>
            )}
          </div>
          <div className="mb-1 col-md-3">
            <label htmlFor="physician" className="form-label">Physician</label>
            <input
              {...register('physician')}
              id="physician"
              type="text"
              className="form-control"
            />
            {errors.physician && (
              <p className="text-danger">{errors.physician.message}</p>
            )}
          </div>
        </div>
        <div className="row">
        <div className="mb-1 col-md-6">
            <label htmlFor="procedures" className="form-label">Procedures</label>
            <input
              {...register('procedures')}
              id="procedures"
              type="text"
              className="form-control"
            />
            {errors.procedures && (
              <p className="text-danger">{errors.procedures.message}</p>
            )}
          </div>
        </div>
      </fieldset>
{/* TEACHING INFOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO */}
      <fieldset className="TeachingInfo">
        <div className="row">
          <div className="mb-1 col-md-3">
            <div className = "row">
              <div className="mb-1 col-md-6">
                <label htmlFor="term" className="form-label">Academic Term</label>
                <select
                  {...register('term')}
                  id="term"
                  className="form-select"
                >
                  <option value="" disabled selected hidden></option>
                  {termOptions.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            <div className="mb-1 col-md-6">
              <label htmlFor="year" className="form-label">Academic Year</label>
              <select
                {...register('year')}
                id="year"
                className="form-select"
              >
                <option value="" disabled selected hidden></option>
                {yearOptions.map((option, index) => (
                  <option key={index} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            </div>
            
            <div className="mb-1 col-md-12">
              <label htmlFor="load" className="form-label">Teaching Load</label>
              <select
                {...register('load')}
                id="load"
                className="form-select"
              >
                <option value="" disabled selected hidden></option>
                {loadOptions.map((option, index) => (
                  <option key={index} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
          



{/* STATUS INFO*/ }


          <div className="mb-1 col-md-3">
            <label className="form-label">Status</label>
            {statusOptions.map((option, index) => (
              <div key={index} className="form-check">
                <input
                  {...register('status')}
                  id={`status-${index}`}
                  type="radio"
                  value={option}
                  className="form-check-input"
                />
                <label htmlFor={`status-${index}`} className="form-check-label">
                  {option}
                </label>
              </div>
            ))}
            {errors.status && (
              <p className="text-danger">{errors.status.message}</p>
            )}
          </div>
          <div className="mb-1 col-md-3">
            <div className="mb-1 col-md-12">
              <label htmlFor="dateHired" className="form-label">If Tenure-Track, please input DATE HIRED:</label>
                <input
                  {...register('dateHired', { valueAsNumber: true })}
                  id="dateHired"
                  type="date"
                  className="form-control"
                />
            </div>
            <div className="mb-1 col-md-12">
              <label htmlFor="dateRetired" className="form-label">If Retiree, please input DATE RETIRED:</label>
                <input
                  {...register('dateRetired', { valueAsNumber: true })}
                  id="dateRetired"
                  type="date"
                  className="form-control"
                />
            </div>
          </div>
          <div className="mb-1 col-md-3">
            <label className="form-label">Health Benefits</label>
            {benefitsOptions.map((option, index) => (
              <div key={index} className="form-check">
                <input
                  {...register('benefits')}
                  id={`benefits-${index}`}
                  type="radio"
                  value={option}
                  className="form-check-input"
                />
                <label htmlFor={`benefits-${index}`} className="form-check-label">
                  {option}
                </label>
              </div>
            ))}
            {errors.benefits && (
              <p className="text-danger">{errors.benefits.message}</p>
            )}
            <div className="mb-1 col-md-12">
            <label htmlFor="hmo" className="form-label">If HMO, please specify:</label>
            <input
              {...register('hmo')}
              id="hmo"
              type="text"
              className="form-control"
            />
            {errors.hmo && (
              <p className="text-danger">{errors.hmo.message}</p>
            )}
          </div>
          </div>
          
        </div>
      </fieldset>
      <button type="submit" className="btn btn-primary form-submit" disabled={!isValid}>Submit</button>
    </form>
  );
};

export default FormBody;