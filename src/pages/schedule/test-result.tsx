interface TestResultProps {
  testType: string;
  testName: string;
  description: string;
}

export function TestResult({
  testType,
  testName,
  description,
}: TestResultProps) {
  return (
    <>
      <div className="flex items-center justify-between text-disabled">
        <div className="w-40 text-xs">{testType}</div>
        <div className="w-40 text-right text-xs">{testName}</div>
      </div>
      <div className="flex items-start">
        <p>{description}</p>
      </div>
    </>
  );
}
