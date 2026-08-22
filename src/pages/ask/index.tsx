import { askFormState } from "@/state";
import { useAtom } from "jotai";
import FabForm from "@/components/form/fab-form";
import { useResetAtom } from "jotai/utils";
import SymptomInquiry from "@/components/form/symptom-inquiry";
import { useState } from "react";
import { promptJSON, wait } from "@/utils/miscellaneous";
import QuestionSentSuccessfully from "./success";
import DepartmentPicker from "@/components/form/department-picker";
import toast from "react-hot-toast";

export default function AskPage() {
  const [formData, setFormData] = useAtom(askFormState);
  const resetFormData = useResetAtom(askFormState);

  const [isSubmitted, setIsSubmitted] = useState(false);

  if (isSubmitted) {
    return <QuestionSentSuccessfully />;
  }

  return (
    <FabForm
      onSubmit={async () => {
        await wait(1500);
        setIsSubmitted(true);
        promptJSON(formData);
        resetFormData();
      }}
      fab={{
        children: "Gửi câu hỏi",
        disabled:
          !formData.symptoms.length ||
          !formData.description.trim().length ||
          !formData.department,
        onDisabledClick() {
          toast.error("Vui lòng điền đầy đủ thông tin!");
        },
      }}
    >
      <SymptomInquiry
        value={formData}
        onChange={setFormData}
        render={({ symptom, description }) => (
          <>
            <DepartmentPicker
              label="Gửi đến khoa"
              placeholder="Chưa rõ"
              value={formData.department}
              onChange={(department) =>
                setFormData((prev) => ({ ...prev, department }))
              }
            />
            {symptom}
            {description}
          </>
        )}
      />
    </FabForm>
  );
}
