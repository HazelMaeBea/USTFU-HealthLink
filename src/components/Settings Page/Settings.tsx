import "./Settings.css";
import FormPersonalInfo from "../Form Application/FormPersonalInfo";

const Settings = () => {
  return (
    <div className="settings-container">
      <div className="row">
        <div className="col-md-12">
          <h1>NOTIFICATION SETTINGS</h1>
          <hr />
        </div>
      </div>

      <div className="notifications-container">
        <div className="row">
          <div className="col-md-11">
            <p>
              Receive <strong>form status</strong> notifications via associated
              UST email account
            </p>
          </div>
          <div className="col-md-1">
            <div className="form-check">
              <label className="form-check-label form-check-toggle">
                <input className="form-check-input" type="checkbox" />
                <span></span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
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
                <input className="form-check-input" type="checkbox" />
                <span></span>
              </label>
            </div>
          </div>
        </div>
        {/* 
        <form onSubmit={handleSubmit(onSubmit)}>
        <FormPersonalInfo register={register} errors={errors} />
        </form> */}
      </div>
    </div>
  );
};

export default Settings;
