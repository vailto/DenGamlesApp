'use client';

import { SystemRow } from '@/lib/types';

interface SystemPreviewProps {
  allRows: SystemRow[];
  keptRows: SystemRow[];
}

export default function SystemPreview({ allRows, keptRows }: SystemPreviewProps) {
  // Sort kept rows by evIndex descending and take top 20
  const top20 = [...keptRows]
    .sort((a, b) => b.evIndex - a.evIndex)
    .slice(0, 20);

  const matchIds = top20.length > 0 ? Object.keys(top20[0].picks).sort() : [];

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded p-4">
        <h3 className="font-bold text-lg mb-2">Analysis Summary</h3>
        <div className="space-y-1 text-sm">
          <p>
            <span className="font-medium">Total rows generated:</span>{' '}
            <span className="font-bold">{allRows.length.toLocaleString()}</span>
          </p>
          <p>
            <span className="font-medium">Rows passing filter:</span>{' '}
            <span className="font-bold text-green-600">{keptRows.length.toLocaleString()}</span>
          </p>
          <p>
            <span className="font-medium">Filter rate:</span>{' '}
            <span className="font-bold">
              {allRows.length > 0
                ? ((keptRows.length / allRows.length) * 100).toFixed(2)
                : 0}
              %
            </span>
          </p>
        </div>
      </div>

      {top20.length > 0 && (
        <div>
          <h3 className="font-bold text-lg mb-2">Top 20 Rows</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border-collapse border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-2 py-1">#</th>
                  {matchIds.map(id => (
                    <th key={id} className="border border-gray-300 px-2 py-1">
                      {id}
                    </th>
                  ))}
                  <th className="border border-gray-300 px-2 py-1">Row IP</th>
                  <th className="border border-gray-300 px-2 py-1">Row Streck</th>
                  <th className="border border-gray-300 px-2 py-1">EV Index</th>
                </tr>
              </thead>
              <tbody>
                {top20.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-2 py-1 text-center">
                      {index + 1}
                    </td>
                    {matchIds.map(id => (
                      <td
                        key={id}
                        className="border border-gray-300 px-2 py-1 text-center font-medium"
                      >
                        {row.picks[id]}
                      </td>
                    ))}
                    <td className="border border-gray-300 px-2 py-1 text-right">
                      {(row.rowIp * 100).toFixed(4)}%
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-right">
                      {(row.rowStreck * 100).toFixed(4)}%
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-right font-bold text-green-600">
                      {row.evIndex.toFixed(3)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
