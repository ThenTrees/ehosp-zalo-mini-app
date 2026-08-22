import { createElement, FunctionComponent, Suspense } from "react";

interface Tab {
  name: string;
  content: FunctionComponent;
}

interface TabsProps {
  activeTab: number;
  onTabChange: (index: number) => void;
  tabs: Tab[];
}

function Tabs({ activeTab, onTabChange, tabs }: TabsProps) {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-none flex items-start justify-center px-4 gap-6 bg-white">
        {tabs.map(({ name }, index) => (
          <div
            key={index}
            className="flex-1 flex flex-col items-center cursor-pointer py-4 relative"
            onClick={() => onTabChange(index)}
          >
            <div
              className={`truncate ${activeTab === index ? "text-primary font-medium" : "text-disabled"}`}
            >
              {name}
            </div>
            {activeTab === index && (
              <div className="absolute bottom-[5.5px]">
                <div className="h-[3px] w-8 bg-primary rounded-full" />
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
        <Suspense>{createElement(tabs[activeTab].content)}</Suspense>
      </div>
    </div>
  );
}

export default Tabs;
