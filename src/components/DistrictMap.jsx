import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
  BarElement,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function DistrictMap({ rows }) {
  const sorted = [...rows]
    .sort((a, b) => b.growth - a.growth)
    .filter((item) => Number.isFinite(item.growth))
    .slice(0, 12);

  const data = {
    labels: sorted.map((item) => item.district),
    datasets: [
      {
        label: 'Absolute Growth',
        data: sorted.map((item) => item.growth),
        backgroundColor: sorted.map((item) => (item.growth >= 0 ? '#10b981' : '#ef4444')),
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Top District Growth (Current vs FY 2024-25)',
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `Growth: ${Number(ctx.raw).toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          callback: (value) => Number(value).toLocaleString(),
        },
      },
    },
  };

  return (
    <section className="rounded-2xl bg-white p-6 shadow-panel">
      <div className="h-[360px]">
        <Bar data={data} options={options} />
      </div>
    </section>
  );
}

export default DistrictMap;
