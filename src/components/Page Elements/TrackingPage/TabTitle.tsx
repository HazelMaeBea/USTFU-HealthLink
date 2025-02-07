import React from 'react';

interface TabTitleProps {
    title: string;
    isActive: boolean;
    onClick: () => void;
}

const TabTitle: React.FC<TabTitleProps> = ({ title, isActive, onClick }) => {
    return (
        <div 
            className={`tab-title ${isActive ? 'active' : ''}`} 
            onClick={onClick}
        >
            {title}
        </div>
    );
};

export default TabTitle;