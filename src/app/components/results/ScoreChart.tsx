'use client';

import {
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  PointElement,
  RadialLinearScale,
  Tooltip,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

// Radar 차트에 필요한 요소만 등록 (tree-shaking)
ChartJS.register(
  RadialLinearScale,
  LineElement,
  PointElement,
  Filler,
  Tooltip,
  Legend
);

/** 차트에 사용할 6개 항목 레이블 (UI 문구) */
const SCORE_LABELS = [
  'Taste',
  'Price',
  'Atmosphere',
  'Service',
  'Quantity',
  'Accessibility',
] as const;

/** report에서 차트용 데이터로 쓰는 키 순서 */
const SCORE_KEYS = [
  'tasteScore',
  'priceScore',
  'atmosphereScore',
  'serviceScore',
  'quantityScore',
  'accessibilityScore',
] as const;

export interface ScoreChartScores {
  tasteScore: number | null;
  priceScore: number | null;
  atmosphereScore: number | null;
  serviceScore: number | null;
  quantityScore: number | null;
  accessibilityScore: number | null;
}

export interface ScoreChartProps {
  /** 6개 항목 점수 (null이면 0으로 표시) */
  scores: ScoreChartScores;
  /** 차트 컨테이너 클래스명 */
  className?: string;
}

/**
 * 레스토랑 평가 6개 항목을 레이더 차트로 시각화합니다.
 * report 객체를 그대로 넘기면 됩니다.
 */
export function ScoreChart({ scores, className }: ScoreChartProps) {
  const data = SCORE_KEYS.map((key) => {
    const value = scores[key as keyof ScoreChartScores];
    return value != null ? value : 0;
  });

  const hasAnyScore = data.some((v) => v > 0);
  if (!hasAnyScore) {
    return (
      <p className="text-sm text-gray-500 py-4 text-center">
        No score data available
      </p>
    );
  }

  const chartData = {
    labels: [...SCORE_LABELS],
    datasets: [
      {
        label: 'Score',
        data,
        backgroundColor: 'rgba(245, 158, 11, 0.2)', // warm-taste 계열
        borderColor: 'rgb(245, 158, 11)',
        borderWidth: 1.5,
        pointBackgroundColor: 'rgb(245, 158, 11)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(245, 158, 11)',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 1.2,
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: {
          display: false,
        },
        pointLabels: {
          font: {
            size: 11,
          },
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: { raw: unknown }) =>
            ` ${Number(context.raw).toFixed(1)}`,
        },
      },
    },
  };

  return (
    <div className={className}>
      <Radar data={chartData} options={options} />
    </div>
  );
}
