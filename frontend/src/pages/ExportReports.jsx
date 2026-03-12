import React, { useState } from 'react';
import { FileText, FileSpreadsheet, Download, Calendar, Filter, ChevronDown } from 'lucide-react';
import { exportService } from '../services/api';
import { toast } from 'react-toastify';

const ExportReports = () => {
    const [loading, setLoading] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(
        new Date().toISOString().slice(0, 7)
    );
    const [exportType, setExportType] = useState('both');
    const [format, setFormat] = useState('excel');

    const handleExport = async () => {
        setLoading(true);
        try {
            const [year, month] = selectedMonth.split('-');
            
            if (format === 'excel') {
                const response = await exportService.toExcel(year, month, exportType);
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `mess-report-${selectedMonth}.xlsx`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                toast.success('Excel report downloaded successfully');
            } else {
                const response = await exportService.toPDF(year, month);
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `mess-report-${selectedMonth}.pdf`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                toast.success('PDF report downloaded successfully');
            }
        } catch (error) {
            toast.error('Failed to export report');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    Export Reports
                </h1>
                <p className="text-gray-500 mt-1">Download mess reports in various formats</p>
            </div>

            {/* Export Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-xl font-semibold text-gray-800 mb-6">Export Options</h2>
                    
                    <div className="space-y-6">
                        {/* Month Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <div className="flex items-center space-x-2">
                                    <Calendar className="w-4 h-4" />
                                    <span>Select Month</span>
                                </div>
                            </label>
                            <input
                                type="month"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                            />
                        </div>

                        {/* Export Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <div className="flex items-center space-x-2">
                                    <Filter className="w-4 h-4" />
                                    <span>Include</span>
                                </div>
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { value: 'expenses', label: 'Expenses Only' },
                                    { value: 'meals', label: 'Meals Only' },
                                    { value: 'both', label: 'Both' }
                                ].map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => setExportType(option.value)}
                                        className={`
                                            py-2 px-4 rounded-lg border transition-all
                                            ${exportType === option.value
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : 'border-gray-200 text-gray-700 hover:border-blue-300'
                                            }
                                        `}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Format Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <div className="flex items-center space-x-2">
                                    <FileText className="w-4 h-4" />
                                    <span>Format</span>
                                </div>
                            </label>
                            <div className="flex space-x-4">
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        value="excel"
                                        checked={format === 'excel'}
                                        onChange={(e) => setFormat(e.target.value)}
                                        className="w-4 h-4 text-blue-600"
                                    />
                                    <span className="flex items-center space-x-1">
                                        <FileSpreadsheet className="w-4 h-4 text-green-600" />
                                        <span>Excel (.xlsx)</span>
                                    </span>
                                </label>
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        value="pdf"
                                        checked={format === 'pdf'}
                                        onChange={(e) => setFormat(e.target.value)}
                                        className="w-4 h-4 text-blue-600"
                                    />
                                    <span className="flex items-center space-x-1">
                                        <FileText className="w-4 h-4 text-red-600" />
                                        <span>PDF</span>
                                    </span>
                                </label>
                            </div>
                        </div>

                        {/* Export Button */}
                        <button
                            onClick={handleExport}
                            disabled={loading}
                            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transform transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <Download className="w-5 h-5" />
                                    <span>Download Report</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Preview Info */}
                    <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <h3 className="font-medium text-blue-800 mb-2">📋 Report Includes:</h3>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>• Monthly summary (total meals, expenses, meal rate)</li>
                            <li>• Member-wise meal counts</li>
                            <li>• Detailed expense breakdown</li>
                            <li>• Daily meal tracking</li>
                            {format === 'excel' && <li>• Formatted Excel with multiple sheets</li>}
                            {format === 'pdf' && <li>• Professional PDF layout with tables</li>}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Quick Export Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="p-2 bg-green-100 rounded-lg w-fit mb-3">
                                <FileSpreadsheet className="w-5 h-5 text-green-600" />
                            </div>
                            <h3 className="font-semibold text-gray-800">Quick Excel Export</h3>
                            <p className="text-sm text-gray-500 mt-1">Export current month data to Excel</p>
                        </div>
                        <button className="p-2 hover:bg-gray-100 rounded-lg">
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="p-2 bg-red-100 rounded-lg w-fit mb-3">
                                <FileText className="w-5 h-5 text-red-600" />
                            </div>
                            <h3 className="font-semibold text-gray-800">Quick PDF Export</h3>
                            <p className="text-sm text-gray-500 mt-1">Generate professional PDF report</p>
                        </div>
                        <button className="p-2 hover:bg-gray-100 rounded-lg">
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExportReports;