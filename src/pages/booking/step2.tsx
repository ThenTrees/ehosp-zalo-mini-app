import FabForm from "@/components/form/fab-form";
import SymptomInquiry from "@/components/form/symptom-inquiry";
import { bookingFormState } from "@/state";
import { promptJSON, wait } from "@/utils/miscellaneous";
import { useAtom } from "jotai";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function Step2() {
  const [formData, setFormData] = useAtom(bookingFormState);
  const navigate = useNavigate();

  return (
    <FabForm
      fab={{
        children: "Đặt lịch khám",
        disabled:
          !formData.symptoms.length || !formData.description.trim().length,
        onDisabledClick() {
          toast.error("Vui lòng điền đầy đủ thông tin!");
        },
      }}
      onSubmit={async () => {
        await wait(1500);
        promptJSON(formData);
        navigate("/booking/3", {
          viewTransition: true,
        });
      }}
    >
      <SymptomInquiry value={formData} onChange={setFormData} />
    </FabForm>
  );
}
