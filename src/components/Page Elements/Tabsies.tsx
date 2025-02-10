import React, { ReactElement, useState } from 'react';

interface TabTitleProps {
    title: string;
    isActive: boolean;
    onClick: () => void;
}

const TabTitlesies: React.FC<TabTitleProps> = ({ title, isActive, onClick }) => {
    return (
        <div 
            className={`tab-title ${isActive ? 'active' : ''}`} 
            onClick={onClick}
        >
            {title}
        </div>
    );
};

type TabsProps = {
    children: ReactElement[];
};

const Tabsies: React.FC<TabsProps> = ({ children }) => {
    const [activeTab, setActiveTab] = useState(0);

    const handleTabClick = (index: number) => {
        setActiveTab(index);
    };

    return (
        <div className="TrackingTabsies">
            <div className="tab-titlesies">
                {children.map((item, index) => (
                    <TabTitlesies
                        key={index}
                        title={item.props.title}
                        isActive={activeTab === index}
                        onClick={() => handleTabClick(index)}
                    />
                ))}
            </div>
            {children[activeTab]}
        </div>
    );
};

export default Tabsies;
