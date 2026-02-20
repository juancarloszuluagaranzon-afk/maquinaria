import React from 'react';

interface ReceiptProps {
    data: {
        empresa: string;
        fecha: string;
        maquina: string;
        operador: string;
        inicio: string;
        fin: string;
        totalHoras: string;
        costoTotal: string;
        costoPorHa?: string;
        tarifaHora?: string;
        tipo: string;
        horometroInicio: number;
        horometroFin: number;
        aprobadoPor?: string;
    };
}

export const Receipt = React.forwardRef<HTMLDivElement, ReceiptProps>(({ data }, ref) => {
    return (
        <div
            ref={ref}
            className="w-[400px] bg-white p-6 text-black font-sans relative"
            style={{ position: 'absolute', top: '-9999px', left: '-9999px' }} // Hidden but renderable
        >
            <div className="border-b-2 border-green-600 pb-4 mb-4">
                <h1 className="text-2xl font-bold text-center text-green-700">REPORTE DE LABOR</h1>
                <p className="text-center text-sm text-gray-500 mt-1">Riopaila Castilla - Maquinaria</p>
            </div>

            <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-gray-100 py-1">
                    <span className="font-semibold text-gray-600">Empresa:</span>
                    <span className="text-right font-medium">{data.empresa}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 py-1">
                    <span className="font-semibold text-gray-600">Fecha:</span>
                    <span className="text-right font-medium">{data.fecha}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 py-1">
                    <span className="font-semibold text-gray-600">Máquina:</span>
                    <span className="text-right font-medium">{data.maquina}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 py-1">
                    <span className="font-semibold text-gray-600">Operador:</span>
                    <span className="text-right font-medium">{data.operador}</span>
                </div>

                <div className="py-2"></div>

                <div className="flex justify-between border-b border-gray-100 py-1">
                    <span className="font-semibold text-gray-600">Inicio:</span>
                    <span className="text-right font-mono">{data.inicio}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 py-1">
                    <span className="font-semibold text-gray-600">Fin:</span>
                    <span className="text-right font-mono">{data.fin}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 py-1 bg-green-50 px-2 rounded">
                    <span className="font-bold text-green-800">Total Horas:</span>
                    <span className="text-right font-bold text-green-800">{data.totalHoras}</span>
                </div>

                <div className="py-2"></div>

                <div className="flex justify-between py-1">
                    <span className="font-semibold text-gray-600">Horómetro Inicio:</span>
                    <span className="text-right font-medium">{data.horometroInicio}</span>
                </div>
                <div className="flex justify-between py-1">
                    <span className="font-semibold text-gray-600">Horómetro Fin:</span>
                    <span className="text-right font-medium">{data.horometroFin}</span>
                </div>

                {data.tipo === 'LABOR' && (
                    <div className="mt-4 pt-4 border-t-2 border-gray-200">
                        {data.tarifaHora && (
                            <div className="flex justify-between py-1">
                                <span className="font-semibold text-gray-600">Tarifa / Hora:</span>
                                <span className="text-right font-medium text-gray-800">{data.tarifaHora}</span>
                            </div>
                        )}
                        <div className="flex justify-between py-1 bg-gray-50 px-2 rounded mt-1">
                            <span className="font-bold text-gray-700">Costo Total:</span>
                            <span className="text-right font-bold text-gray-800">{data.costoTotal}</span>
                        </div>
                        {data.costoPorHa && (
                            <div className="flex justify-between py-1">
                                <span className="font-semibold text-gray-600">Costo / Ha:</span>
                                <span className="text-right font-bold text-blue-600">{data.costoPorHa}</span>
                            </div>
                        )}

                        <div className="mt-6 border-t border-gray-300 pt-2">
                            <p className="text-xs text-gray-500 mb-1">Aprobado por:</p>
                            <p className="font-medium text-lg text-gray-800 border-b border-gray-300 pb-1">
                                {data.aprobadoPor || '_______________________'}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-8 text-center text-xs text-gray-400">
                <p>Generado automáticamente por Antigravity</p>
                <p>{new Date().toLocaleString()}</p>
            </div>
        </div>
    );
});
