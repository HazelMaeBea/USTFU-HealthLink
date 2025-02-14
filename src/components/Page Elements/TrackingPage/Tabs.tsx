// This component renders tab navigation with a controlled activeTab state and calls onTabChange when a tab title is clicked.
import React, { ReactElement } from "react";
import TabTitle from "./TabTitle";

type Props = {
	activeTab: number;
	onTabChange: (index: number) => void;
	children: ReactElement[];
};

const Tabs: React.FC<Props> = ({ activeTab, onTabChange, children }) => {
	return (
		<div className="TrackingTabs">
			<div className="tab-titles">
				{children.map((item, index) => (
					<TabTitle
						key={index}
						title={item.props.title}
						isActive={activeTab === index}
						onClick={() => onTabChange(index)}
					/>
				))}
			</div>
			{children[activeTab]}
		</div>
	);
};

export default Tabs;
