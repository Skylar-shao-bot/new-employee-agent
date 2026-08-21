import { Steps } from 'antd';
import { stageSteps, type StageTail } from '../mock/plan';
import './FlowSteps.css';

type FlowStepsProps = {
  current: number;
  tail?: StageTail;
  onChange: (current: number) => void;
  disabledAt: (index: number) => boolean;
};

export default function FlowSteps({
  current,
  tail = 'progress',
  onChange,
  disabledAt,
}: FlowStepsProps) {
  return (
    <Steps
      className="ds-flow-steps"
      size="small"
      current={current}
      titlePlacement="horizontal"
      variant="filled"
      responsive={false}
      items={stageSteps(tail).map((step, index) => ({
        title: step.title,
        disabled: disabledAt(index),
      }))}
      onChange={onChange}
    />
  );
}
