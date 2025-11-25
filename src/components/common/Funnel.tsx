import { Children, isValidElement, ReactNode } from 'react';

interface FunnelProps<T extends string> {
  step: T;
  children: ReactNode;
}

interface StepProps<T extends string> {
  name: T;
  children: ReactNode;
}

/**
 * Funnel 컴포넌트
 * 현재 step과 일치하는 Step 컴포넌트만 렌더링합니다.
 * 선언적 방식으로 step을 관리할 수 있게 해줍니다.
 */
export function Funnel<T extends string>({ step, children }: FunnelProps<T>) {
  const validChildren = Children.toArray(children).filter(isValidElement);

  // 현재 step과 name이 일치하는 Step 컴포넌트만 찾아서 렌더링
  const targetStep = validChildren.find(
    (child) => (child.props as StepProps<T>).name === step
  );

  return <>{targetStep}</>;
}

/**
 * Step 컴포넌트
 * 각 단계를 감싸는 래퍼 컴포넌트입니다.
 */
export function Step<T extends string>({ children }: StepProps<T>) {
  return <>{children}</>;
}

// 사용 편의를 위해 합쳐서 내보내기
export const FunnelComponent = Object.assign(Funnel, { Step });


