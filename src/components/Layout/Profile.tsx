import "./Profile.css";

interface ProfileProps {
    isCollapsed: boolean;
}

const Profile: React.FC<ProfileProps> = ({ isCollapsed }) => {
    return (
        <div className={`profile-section ${isCollapsed ? "collapsed" : ""}`}>
            <div className="profile-image">
                <img src="https://media.gettyimages.com/id/1389408711/photo/64th-annual-grammy-awards-arrivals.jpg?s=1024x1024&w=gi&k=20&c=zDyYSIA635n6gE82xx0eyhJ4BY19lMPU-8m121GVZDo=" alt="Profile" />
            </div>
            {!isCollapsed && (
                <div className="profile-name">
                    <h1>JEON JUNGKOOK</h1>
                    <h1>MEMBER</h1>
                </div>
            )}
        </div>
    );
};

export default Profile;
