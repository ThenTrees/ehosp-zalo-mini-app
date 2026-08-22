import { serviceByIdState, symptomFormState } from "@/state";
import { useAtomValue } from "jotai";
import { useParams } from "react-router-dom";
import NotFound from "../404";
import DetailPageTemplate from "./template";

function ServiceDetailPage() {
  const { id } = useParams();
  const service = useAtomValue(serviceByIdState(Number(id)));

  if (!service) {
    return <NotFound />;
  }

  return (
    <DetailPageTemplate
      title={service.name}
      tab1={{
        htmlContent: service.description,
      }}
      tab2={{
        department: service.department,
      }}
      tab3={{
        formData: symptomFormState,
      }}
    />
  );
}

export default ServiceDetailPage;
