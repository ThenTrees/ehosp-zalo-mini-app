import { useState } from "react";
import Stepper from "./stepper";
import Step1 from "./step1";
import Step2 from "./step2";
import Step3 from "./step3";

export default function BookingPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  return (
    <div className="flex flex-1 flex-col">
      <Stepper current={step} />
      {step === 1 && <Step1 onNext={() => setStep(2)} />}
      {step === 2 && (
        <Step2 onBack={() => setStep(1)} onNext={() => setStep(3)} />
      )}
      {step === 3 && <Step3 onBack={() => setStep(2)} />}
    </div>
  );
}
