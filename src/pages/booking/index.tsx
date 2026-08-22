import { useState } from "react";
import Step1 from "./step1";
import Step2 from "./step2";
import Step3 from "./step3";

export default function BookingPage() {
  const [buoc, setBuoc] = useState(1);

  if (buoc === 1) {
    return <Step1 onNext={() => setBuoc(2)} />;
  }
  if (buoc === 2) {
    return <Step2 onNext={() => setBuoc(3)} />;
  }
  return <Step3 />;
}
