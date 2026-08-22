import { useParams } from "react-router-dom";
import DetailPageTemplate from "./template";
import { useAtomValue } from "jotai";
import { departmentByIdState, symptomFormState } from "@/state";
import NotFound from "../404";

function DepartmentDetailPage() {
  const { id } = useParams();
  const department = useAtomValue(departmentByIdState(Number(id)));

  if (!department) {
    return <NotFound />;
  }

  return (
    <DetailPageTemplate
      title={department.name}
      tab1={{
        htmlContent: department.description,
      }}
      tab2={{
        department,
      }}
      tab3={{
        formData: symptomFormState,
      }}
    />
  );
}

export default DepartmentDetailPage;
