import { useState } from "react";
import Stepper from "./stepper";
import Step1 from "./step1";
import Step2 from "./step2";
import Step3 from "./step3";

export default function BookingPage() {
  const [buoc, setBuoc] = useState<1 | 2 | 3>(1);

  return (
    <div className="flex flex-1 flex-col">
      <Stepper current={buoc} />
      {buoc === 1 && <Step1 onNext={() => setBuoc(2)} />}
      {buoc === 2 && (
        <Step2 onBack={() => setBuoc(1)} onNext={() => setBuoc(3)} />
      )}
      {buoc === 3 && <Step3 onBack={() => setBuoc(2)} />}
    </div>
  );
}
