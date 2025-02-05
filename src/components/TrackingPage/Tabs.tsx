import React, { ReactElement, useState } from 'react';
import TabTitle from './TabTitle';

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
            </div>
            {children[activeTab]}
        </div>
    );
};

export default Tabs;