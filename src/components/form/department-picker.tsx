import { departmentHierarchyState, departmentsState } from "@/state";
import { Department } from "@/types";
import { useAtomValue } from "jotai";
import { Select } from "zmp-ui";
import { SelectProps } from "zmp-ui/select";

const { Option, OtpGroup } = Select;

interface DepartmentPickerProps
  extends Omit<SelectProps, "value" | "onChange"> {
  value?: Department;
  onChange?: (value: Department) => void;
}

function DepartmentPicker({
  value,
  onChange,
  ...props
}: DepartmentPickerProps) {
  const data = useAtomValue(departmentHierarchyState);

  return (
    <Select
      closeOnSelect
      value={value?.id}
      onChange={(value) => {
        const dep = data
          .reduce(
            (acc, group) => [...acc, ...group.subDepartments],
            [] as Department[]
          )
          .find((dep) => dep.id === value);
        if (dep) {
          onChange?.(dep);
        }
      }}
      {...props}
    >
      {data.map((group) => (
        <OtpGroup key={group.name} label={group.name}>
          {group.subDepartments.map((dep) => (
            <Option key={dep.id} value={dep.id} title={dep.name} />
          ))}
        </OtpGroup>
      ))}
    </Select>
  );
}

export default DepartmentPicker;
