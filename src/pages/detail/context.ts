import { createContext } from "react";
import { Department } from "@/types";
import { symptomFormState } from "@/state";

export interface DetailPageTemplateProps {
  title: string;
  tab1: {
    htmlContent: string;
  };
  tab2: {
    department: Department;
  };
  tab3: {
    formData: typeof symptomFormState;
  };
}

export const DetailPageContext = createContext({} as DetailPageTemplateProps);
