import type { DayAverage } from '../lib/stats';

const W = 320;
const H = 140;
const PAD = 24;

/** Line chart of average intensity at start vs. after transforming, per day. */
export function IntensityChart({ data }: { data: DayAverage[] }) {
  if (data.length === 0) return null;
  const x = (i: number) => (data.length === 1 ? W / 2 : PAD + (i * (W - 2 * PAD)) / (data.length - 1));
  const y = (v: number) => H - PAD - (v / 10) * (H - 2 * PAD);

  const beforePath = data.map((d, i) => `${i ? 'L' : 'M'}${x(i)},${y(d.before)}`).join(' ');
  // Break the "after" line where a day has no value instead of plotting 0.
  let afterPath = '';
  let pen = false;
  data.forEach((d, i) => {
    if (d.after === null) {
      pen = false;
      return;
    }
    afterPath += `${pen ? 'L' : 'M'}${x(i)},${y(d.after)} `;
    pen = true;
  });

  return (
    <figure class="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Intensidad promedio por día, al empezar y después de transformar">
        {[0, 5, 10].map((v) => (
          <g key={v}>
            <line x1={PAD} x2={W - PAD} y1={y(v)} y2={y(v)} class="grid" />
            <text x={4} y={y(v) + 4} class="axis">
              {v}
            </text>
          </g>
        ))}
        <path d={beforePath} class="line before" />
        <path d={afterPath} class="line after" />
        {data.map((d, i) => (
          <g key={d.date}>
            <circle cx={x(i)} cy={y(d.before)} r={3} class="dot before">
              <title>{`${d.date}: al empezar ${d.before}`}</title>
            </circle>
            {d.after !== null && (
              <circle cx={x(i)} cy={y(d.after)} r={3} class="dot after">
                <title>{`${d.date}: después ${d.after}`}</title>
              </circle>
            )}
          </g>
        ))}
      </svg>
      <figcaption>
        <span class="key before" /> Al empezar <span class="key after" /> Después de transformar
      </figcaption>
    </figure>
  );
}
