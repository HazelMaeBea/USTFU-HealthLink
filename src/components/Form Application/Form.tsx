import { FieldValues, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters" }),
  age: z
    .number({ invalid_type_error: "Age field is required" })
    .min(18, { message: "Age must be at least 18" }),
  denzel: z.any().refine((files) => files && files.length > 0, {
    message: "File is required",
  }),
  jared: z.any().refine((files) => files && files.length > 0, {
    message: "File is required",
  }),
});

type FormData = z.infer<typeof schema>;

const Form = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormData>({ resolver: zodResolver(schema), mode: "onChange" });

  const onSubmit = (data: FieldValues) => {
    console.log(data);
    // Handle file data
    if (data.file && data.file.length > 0) {
      const file = data.file[0];
      console.log("File name:", file.name);
      console.log("File size:", file.size);
      console.log("File type:", file.type);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="mb-3">
        <label htmlFor="name" className="form-label">
          Name
        </label>
        <input
          id="name"
          type="text"
          className={`form-control ${errors.name ? "is-invalid" : ""}`}
          {...register("name")}
        />
        {errors.name && (
          <p className="invalid-feedback">{errors.name.message}</p>
        )}
      </div>
      <div className="mb-3">
        <label htmlFor="age" className="form-label">
          Age
        </label>
        <input
          id="age"
          type="number"
          className={`form-control ${errors.age ? "is-invalid" : ""}`}
          {...register("age", { valueAsNumber: true })}
        />
        {errors.age && <p className="invalid-feedback">{errors.age.message}</p>}
      </div>

      <div className="mb-3">
        <label htmlFor="denzel" className="form-label">
          File
        </label>
        <input
          id="denzel"
          type="file"
          className={`form-control ${errors.denzel ? "is-invalid" : ""}`}
          {...register("denzel")}
        />
        {errors.denzel && (
          <p className="invalid-feedback">{errors.denzel?.message as string}</p>
        )}
      </div>
      <div className="mb-3">
        <label htmlFor="jared" className="form-label">
          File
        </label>
        <input
          id="jared"
          type="file"
          className={`form-control ${errors.denzel ? "is-invalid" : ""}`}
          {...register("jared")}
        />
        {errors.jared && (
          <p className="invalid-feedback">{errors.jared?.message as string}</p>
        )}
      </div>
      <button disabled={!isValid} className="btn btn-primary" type="submit">
        Submit
      </button>
    </form>
  );
};

export default Form;
