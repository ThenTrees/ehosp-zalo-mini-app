import { useAtomValue } from 'jotai';
import { ScheduleItem } from './schedule-item';
import { schedulesState } from '@/state';

function ScheduleHistoryPage() {
  const schedules = useAtomValue(schedulesState);

  return (
    <div className="px-4 py-3 space-y-3">
      {schedules.map((item, index) => (
        <ScheduleItem key={index} schedule={item} />
      ))}
    </div>
  );
}

export default ScheduleHistoryPage;
