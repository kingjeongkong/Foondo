/**
 * 성능 추적 유틸리티
 * 각 작업 단계의 실행 시간을 측정하고 추적합니다.
 */

interface PerformanceStep {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export class PerformanceTracker {
  private steps: PerformanceStep[] = [];
  private startTime: number;
  private context: string;

  constructor(context: string = 'Operation') {
    this.context = context;
    this.startTime = performance.now();
  }

  /**
   * 단계 시작
   * @param name 단계 이름
   * @param metadata 추가 메타데이터
   */
  startStep(name: string, metadata?: Record<string, unknown>): void {
    this.steps.push({
      name,
      startTime: performance.now(),
      metadata,
    });
  }

  /**
   * 단계 종료
   * @param name 단계 이름
   * @param metadata 추가 메타데이터
   */
  endStep(name: string, metadata?: Record<string, unknown>): void {
    const step = this.steps.find((s) => s.name === name && !s.endTime);
    if (step) {
      step.endTime = performance.now();
      step.duration = Math.round(step.endTime - step.startTime);
      if (metadata) {
        step.metadata = { ...step.metadata, ...metadata };
      }
    }
  }

  /**
   * 성능 요약 정보 반환
   */
  getSummary(): {
    context: string;
    totalTime: number;
    steps: PerformanceStep[];
  } {
    const totalTime = Math.round(performance.now() - this.startTime);
    return {
      context: this.context,
      totalTime,
      steps: this.steps,
    };
  }

  /**
   * 성능 요약을 콘솔에 출력
   */
  logSummary(): void {
    const summary = this.getSummary();
    console.log(`\n📊 [${summary.context}] 성능 요약:`);
    console.log(`총 소요 시간: ${summary.totalTime}ms\n`);

    if (summary.steps.length === 0) {
      console.log('  측정된 단계가 없습니다.\n');
      return;
    }

    summary.steps.forEach((step, index) => {
      const duration = step.duration ?? '진행 중';
      const meta = step.metadata
        ? ` | ${Object.entries(step.metadata)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ')}`
        : '';
      const status = step.duration ? '✅' : '⏳';
      console.log(
        `  ${status} ${index + 1}. ${step.name}: ${duration}ms${meta}`
      );
    });

    // 단계별 시간 비율 계산
    const completedSteps = summary.steps.filter((s) => s.duration);
    if (completedSteps.length > 0) {
      console.log('\n  시간 비율:');
      completedSteps.forEach((step) => {
        const percentage = Math.round(
          ((step.duration! / summary.totalTime) * 100) / completedSteps.length
        );
        console.log(`    ${step.name}: ${percentage}%`);
      });
    }

    console.log('');
  }

  /**
   * 특정 단계의 실행 시간 반환
   */
  getStepDuration(name: string): number | null {
    const step = this.steps.find((s) => s.name === name);
    return step?.duration ?? null;
  }
}

