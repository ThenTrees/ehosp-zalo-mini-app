import { useEffect, useState } from "react";
import Tabs from "@/components/tabs";
import Tab1 from "./tab1";
import Tab2 from "./tab2";
import Tab3 from "./tab3";
import { useSearchParams } from "react-router-dom";
import { DetailPageContext, DetailPageTemplateProps } from "./context";
import { useAtom } from "jotai";
import { customTitleState } from "@/state";

function DetailPageTemplate(props: DetailPageTemplateProps) {
  const [query] = useSearchParams();
  const tab = query.get("tab");
  const [activeTab, setActiveTab] = useState(Number(tab) || 0);
  const [customTitle, setCustomTitle] = useAtom(customTitleState);

  useEffect(() => {
    const oldTitle = customTitle;
    setCustomTitle(props.title);
    return () => {
      setCustomTitle(oldTitle);
    };
  }, []);

  return (
    <DetailPageContext.Provider value={props}>
      <Tabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={[
          {
            name: "Giới thiệu",
            content: Tab1,
          },
          {
            name: "Bác sĩ",
            content: Tab2,
          },
          {
            name: "Tư vấn",
            content: Tab3,
          },
        ]}
      />
    </DetailPageContext.Provider>
  );
}

export default DetailPageTemplate;
