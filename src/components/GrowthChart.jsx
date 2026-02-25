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

function GrowthChart({ rows, enabled }) {
  if (!enabled) {
    return (
      <section className="rounded-2xl bg-white p-6 shadow-panel">
        <h3 className="text-lg font-semibold text-slate-900">Growth Chart</h3>
        <p className="mt-3 text-sm text-slate-600">
          Growth chart needs both sales columns: <strong>Sum of 2024-25</strong> and <strong>Sum of 24th feb.26</strong>.
        </p>
      </section>
    );
  }

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
        text: 'Selected Area: Top District Growth',
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

export default GrowthChart;
