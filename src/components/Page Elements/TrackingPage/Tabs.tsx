import React, { ReactElement, useState } from 'react';
import TabTitle from './TabTitle';
import { TbSearch } from "react-icons/tb";
import { RxHamburgerMenu } from "react-icons/rx";

type Props = {
    children: ReactElement[];
};

const Tabs: React.FC<Props> = ({ children }) => {
    const [activeTab, setActiveTab] = useState(0);

    const handleTabClick = (index: number) => {
        setActiveTab(index);
    };

    return (
        <div className="TrackingTabs">
            
            <div className="tab-titles">
                {children.map((item, index) => (
                    <TabTitle
                        key={index}
                        title={item.props.title}
                        isActive={activeTab === index}
                        onClick={() => handleTabClick(index)}
                    />
                ))}
                
                {/* i put the search container in here instead of the admin page just the display is hidden when reused */}
                <div className="search-container">
                    <RxHamburgerMenu className="burger-icon" />
                    <input
                        type="search"
                        placeholder="Search"
                        className="ustfu-form-control search-input"
                    />
                    <TbSearch className="search-icon" />
                </div>
            </div>
            {children[activeTab]}
        </div>
    );
};

export default Tabs;