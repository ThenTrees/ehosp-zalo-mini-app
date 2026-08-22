import { useParams } from 'react-router-dom';
import Step1 from './step1';
import Step2 from './step2';
import Step3 from './step3';

function BookingPage() {
  const { step } = useParams();
  const currentStep = Number(step ?? '1') - 1;
  const CurrentStep = [Step1, Step2, Step3][currentStep];

  return <CurrentStep />;
}

export default BookingPage;
