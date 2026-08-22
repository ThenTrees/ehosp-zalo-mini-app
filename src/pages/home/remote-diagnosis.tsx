import CallIcon from "@/components/icons/call";
import ShipIcon from "@/components/icons/ship";
import RemoteDiagnosisItem from "@/components/remote-diagnosis-item";
import Section from "@/components/section";

export default function RemoteDiagnosis() {
  return (
    <Section className="pt-3" title="Chẩn đoán từ xa" isCard>
      <div className="grid grid-cols-2 gap-3 self-stretch">
        <RemoteDiagnosisItem
          icon={<CallIcon />}
          title="Cấp cứu"
          subtitle="BS gọi lại"
        />
        <RemoteDiagnosisItem
          icon={<ShipIcon />}
          title="Giao thuốc"
          subtitle="Tận nhà"
        />
      </div>
    </Section>
  );
}
