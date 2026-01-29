import React from 'react';

interface Column<T> {
    header: string;
    accessor: (item: T) => React.ReactNode;
    className?: string;
}

interface GlassTableProps<T> {
    data: T[];
    columns: Column<T>[];
    onRowClick?: (item: T) => void;
    isLoading?: boolean;
}

export function GlassTable<T extends { id: string | number }>({
    data,
    columns,
    onRowClick,
    isLoading = false,
}: GlassTableProps<T>) {
    if (isLoading) {
        return (
            <div className="w-full overflow-hidden rounded-xl border border-white/20 bg-black/40 backdrop-blur-xl shadow-glass">
                <div className="p-4 border-b border-white/10 flex justify-between">
                    <div className="h-8 w-1/3 bg-white/5 rounded animate-pulse"></div>
                    <div className="h-8 w-1/4 bg-white/5 rounded animate-pulse"></div>
                </div>
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="p-4 border-b border-white/5 flex gap-4">
                        <div className="h-6 w-full bg-white/5 rounded animate-pulse"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="w-full p-8 text-center rounded-xl border border-white/20 bg-black/40 backdrop-blur-xl shadow-glass">
                <p className="text-white/50">No results found.</p>
            </div>
        )
    }

    return (
        <div className="w-full overflow-x-auto rounded-xl border border-white/20 bg-black/40 backdrop-blur-xl shadow-glass">
            <table className="w-full text-left text-sm text-white/80">
                <thead className="bg-white/5 text-xs uppercase text-white/60">
                    <tr>
                        {columns.map((col, index) => (
                            <th key={index} className={`px-6 py-4 font-medium tracking-wider ${col.className || ''}`}>
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {data.map((item) => (
                        <tr
                            key={item.id}
                            onClick={() => onRowClick && onRowClick(item)}
                            className={`group transition-colors duration-200 hover:bg-white/5 ${onRowClick ? 'cursor-pointer' : ''
                                }`}
                        >
                            {columns.map((col, index) => (
                                <td key={index} className={`px-6 py-4 whitespace-nowrap ${col.className || ''}`}>
                                    {col.accessor(item)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
