import { useMemo } from 'react';
import type { PricePoint } from '../lib/stockHistory';
import { historyStats } from '../lib/stockHistory';
import { money } from '../lib/format';

type StockChartProps = {
  symbol: string;
  name: string;
  points: PricePoint[];
  livePrice: number;
  booming?: boolean;
};

const W = 640;
const H = 220;
const PAD = { top: 16, right: 12, bottom: 28, left: 52 };

export function StockChart({ symbol, name, points, livePrice, booming }: StockChartProps) {
  const stats = useMemo(() => historyStats(points), [points]);
  const up = stats.change >= 0;

  const geom = useMemo(() => {
    if (points.length < 2) return null;
    const prices = points.map((p) => p.price);
    let min = Math.min(...prices);
    let max = Math.max(...prices);
    if (min === max) {
      min *= 0.98;
      max *= 1.02;
    }
    const pad = (max - min) * 0.08 || 0.01;
    min -= pad;
    max += pad;

    const t0 = points[0].t;
    const t1 = points[points.length - 1].t;
    const tw = Math.max(1, t1 - t0);
    const iw = W - PAD.left - PAD.right;
    const ih = H - PAD.top - PAD.bottom;

    const x = (t: number) => PAD.left + ((t - t0) / tw) * iw;
    const y = (price: number) => PAD.top + ((max - price) / (max - min)) * ih;

    const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.t).toFixed(1)},${y(p.price).toFixed(1)}`).join(' ');
    const area = `${line} L${x(t1).toFixed(1)},${(PAD.top + ih).toFixed(1)} L${x(t0).toFixed(1)},${(PAD.top + ih).toFixed(1)} Z`;

    const gridYs = [0, 0.25, 0.5, 0.75, 1].map((f) => {
      const price = max - (max - min) * f;
      return { y: PAD.top + f * ih, label: price };
    });

    return { line, area, gridYs, x, y, t0, t1 };
  }, [points]);

  return (
    <div className={`stock-chart ${up ? 'up' : 'down'}`}>
      <div className="stock-chart-head">
        <div>
          <strong className="stock-chart-sym">
            {symbol}
            {booming && <span className="badge active">Booming</span>}
          </strong>
          <span className="stock-chart-name">{name}</span>
        </div>
        <div className="stock-chart-price">
          <strong>{money(livePrice)}</strong>
          <span className={up ? 'cash' : 'danger-text'}>
            {up ? '+' : ''}
            {money(stats.change)} ({stats.changePct >= 0 ? '+' : ''}
            {stats.changePct.toFixed(2)}%)
          </span>
        </div>
      </div>

      <div className="stock-chart-meta">
        <span>O {money(stats.open)}</span>
        <span>H {money(stats.high)}</span>
        <span>L {money(stats.low)}</span>
        <span>C {money(stats.close)}</span>
        <span className="muted sm">{points.length} ticks · live</span>
      </div>

      {!geom ? (
        <p className="stock-chart-empty muted">Collecting price ticks… graph builds as the market moves.</p>
      ) : (
        <svg
          className="stock-chart-svg"
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`${symbol} price chart`}
        >
          {geom.gridYs.map((g) => (
            <g key={g.y}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={g.y}
                y2={g.y}
                className="stock-chart-grid"
              />
              <text x={PAD.left - 6} y={g.y + 3} className="stock-chart-axis" textAnchor="end">
                {g.label.toFixed(g.label >= 100 ? 0 : 2)}
              </text>
            </g>
          ))}
          <path d={geom.area} className="stock-chart-area" />
          <path d={geom.line} className="stock-chart-line" fill="none" />
          <circle
            cx={geom.x(points[points.length - 1].t)}
            cy={geom.y(points[points.length - 1].price)}
            r={3.5}
            className="stock-chart-dot"
          />
          <text
            x={PAD.left}
            y={H - 8}
            className="stock-chart-axis"
          >
            {new Date(geom.t0).toLocaleTimeString()}
          </text>
          <text
            x={W - PAD.right}
            y={H - 8}
            className="stock-chart-axis"
            textAnchor="end"
          >
            {new Date(geom.t1).toLocaleTimeString()}
          </text>
        </svg>
      )}
    </div>
  );
}
