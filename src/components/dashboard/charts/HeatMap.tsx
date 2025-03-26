'use client';

import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

// Define types for Chart.js
type ChartType = any;

interface HeatMapProps {
  data: { x: string; y: string; value: number }[];
}

export default function HeatMap({ data }: HeatMapProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<ChartType | null>(null);

  useEffect(() => {
    const initChart = () => {
      if (!chartRef.current) return;

      // Destroy existing chart
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext('2d');
      if (!ctx) return;

      // Optimized data processing
      const xValues = Array.from(new Set(data.slice(0, 100).map(item => item.x)));
      const yValues = Array.from(new Set(data.slice(0, 100).map(item => item.y)));
      
      // Create a pre-initialized matrix
      const heatmapData = Array(yValues.length).fill(null).map(() => 
        new Array(xValues.length).fill(0)
      );

      // Create a lookup map for faster access
      const coordMap = new Map();
      data.slice(0, 1000).forEach(item => {
        coordMap.set(`${item.x}|${item.y}`, item.value);
      });

      // Fill matrix using map lookups
      yValues.forEach((y, yIndex) => {
        xValues.forEach((x, xIndex) => {
          heatmapData[yIndex][xIndex] = coordMap.get(`${x}|${y}`) || 0;
        });
      });

      // Create datasets for the heatmap
      const datasets = yValues.map((y, yIndex) => ({
        label: y,
        data: heatmapData[yIndex],
        backgroundColor: getColorScale(heatmapData[yIndex]),
        borderColor: 'rgba(255, 255, 255, 0.5)',
        borderWidth: 1,
        barPercentage: 1,
        categoryPercentage: 1,
      }));

      chartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: xValues,
          datasets,
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          scales: {
            x: {
              stacked: true,
              grid: {
                display: false,
              },
            },
            y: {
              stacked: true,
              grid: {
                display: false,
              },
            },
          },
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              callbacks: {
                title: function(tooltipItems) {
                  const item = tooltipItems[0];
                  return `${yValues[item.datasetIndex]} - ${xValues[item.dataIndex]}`;
                },
                label: function(context) {
                  return `Value: ${context.raw}`;
                }
              }
            }
          },
        },
      });
    };

    initChart();

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data]);

  // Function to generate color scale based on values
  const getColorScale = (values: number[]) => {
    const max = Math.max(...values, 1);
    return values.map(value => {
      const intensity = value / max;
      return `rgba(99, 102, 241, ${intensity})`;
    });
  };

  return <canvas ref={chartRef} />;
} 