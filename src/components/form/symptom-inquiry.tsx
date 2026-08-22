import FormItem from "@/components/form/item";
import TextareaWithImageUpload from "@/components/form/textarea-with-image-upload";
import { symptomsState } from "@/state";
import { useAtomValue } from "jotai";
import { Select } from "zmp-ui";
import { SymptomDescription } from "@/types";
import { ReactNode } from "react";

const { Option } = Select;

export interface SymptomInquiryProps<T> {
  value: SymptomDescription & T;
  onChange: (
    value:
      | (SymptomDescription & T)
      | ((prev: SymptomDescription & T) => SymptomDescription & T)
  ) => void;
  render?: (items: { symptom: ReactNode; description: ReactNode }) => ReactNode;
}

function SymptomInquiry<T>({
  value,
  onChange,
  render,
}: SymptomInquiryProps<T>) {
  const symptoms = useAtomValue(symptomsState);
  const symptom = (
    <FormItem label="Triệu chứng">
      <Select
        placeholder="Chọn triệu chứng"
        multiple
        value={value.symptoms}
        onChange={(symptoms) => onChange((prev) => ({ ...prev, symptoms }))}
      >
        {symptoms.map((symptom, index) => (
          <Option key={index} value={symptom} title={symptom}>
            {symptom}
          </Option>
        ))}
      </Select>
    </FormItem>
  );
  const description = (
    <FormItem label="Mô tả chi tiết">
      <TextareaWithImageUpload
        textarea={{
          value: value.description,
          onChange: (description) =>
            onChange((prev) => ({ ...prev, description })),
          placeholder:
            "Xin vui lòng mô tả chi tiết triệu chứng, bệnh tật và tình trạng cơ thể của bạn từ 10 đến 500 chữ",
        }}
        images={{
          values: value.images,
          onChange: (images) => onChange((prev) => ({ ...prev, images })),
        }}
      />
    </FormItem>
  );

  return (
    <div className="bg-white p-4 space-y-4">
      {render ? (
        render({ symptom, description })
      ) : (
        <>
          {symptom}
          {description}
        </>
      )}
    </div>
  );
}

export default SymptomInquiry;
