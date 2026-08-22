import { departmentGroupsState } from "@/state";
import { useAtomValue } from "jotai";
import { useState } from "react";

export default function Sidebar() {
  const categories = useAtomValue(departmentGroupsState);
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);

  return (
    <div className="basis-28 bg-background rounded-tr-2xl flex flex-col gap-8 py-5 px-3 text-center text-sm text-disabled overflow-y-auto overflow-x-hidden">
      {categories.map((category, index) => (
        <div
          key={category.id}
          className={`flex-none rounded-xl px-2 py-1.5 line-clamp-2 cursor-pointer ${
            selectedCategoryIndex === index
              ? "bg-primary text-white font-medium"
              : ""
          }`}
          onClick={() => {
            setSelectedCategoryIndex(index);
            document
              .getElementById("department-header-" + category.id)
              ?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          {category.name}
        </div>
      ))}
    </div>
  );
}
