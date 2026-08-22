import { feedbackCategoriesState, feedbackFormState } from "@/state";
import { useAtom, useAtomValue } from "jotai";
import FabForm from "@/components/form/fab-form";
import { useResetAtom } from "jotai/utils";
import { useState } from "react";
import { promptJSON, wait } from "@/utils/miscellaneous";
import QuestionSentSuccessfully from "../ask/success";
import FormItem from "@/components/form/item";
import { Input, Radio } from "zmp-ui";
import TextareaWithImageUpload from "@/components/form/textarea-with-image-upload";
import toast from "react-hot-toast";

export default function FeedbackPage() {
  const [formData, setFormData] = useAtom(feedbackFormState);
  const resetFormData = useResetAtom(feedbackFormState);
  const feedbackCategories = useAtomValue(feedbackCategoriesState);
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
        children: "Gửi phản ảnh",
        disabled:
          !formData.title.trim() ||
          !formData.description.trim() ||
          !formData.category,
        onDisabledClick() {
          toast.error("Vui lòng điền đầy đủ thông tin!");
        },
      }}
    >
      <div className="bg-white p-4 space-y-4">
        <FormItem label="Tiêu đề">
          <Input
            placeholder="Nhập nội dung"
            value={formData.title}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, title: e.currentTarget.value }))
            }
          />
        </FormItem>
        <FormItem label="Nội dung phản ảnh">
          <TextareaWithImageUpload
            textarea={{
              value: formData.description,
              onChange: (description) =>
                setFormData((prev) => ({ ...prev, description })),
              placeholder: "Nhập nội dung",
            }}
            images={{
              values: formData.images,
              onChange: (images) =>
                setFormData((prev) => ({ ...prev, images })),
            }}
          />
        </FormItem>
        <FormItem label="Mục phản ảnh">
          <Radio.Group
            className="flex flex-col space-y-3"
            value={formData.category}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, category: value as string }))
            }
            options={feedbackCategories.map((c) => ({
              label: c,
              value: c,
            }))}
          />
        </FormItem>
      </div>
    </FabForm>
  );
}
