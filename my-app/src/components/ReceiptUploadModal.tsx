import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileImage,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles,
  Info,
} from 'lucide-react';
import { ReceiptExtraction, NewTransactionPayload } from '../types/finance';
import { uploadReceiptImage } from '../services/api';

interface ReceiptUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransactionSaved: (tx: NewTransactionPayload) => void;
}

export const ReceiptUploadModal: React.FC<ReceiptUploadModalProps> = ({
  isOpen,
  onClose,
  onTransactionSaved,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [extraction, setExtraction] = useState<ReceiptExtraction | null>(null);

  // Form review fields
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState('Food');
  const [amount, setAmount] = useState<number | string>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const categories = ['Food', 'Groceries', 'Transport', 'Utilities', 'Entertainment', 'Shopping', 'Others'];

  const resetState = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsUploading(false);
    setErrorMsg(null);
    setExtraction(null);
    setMerchant('');
    setCategory('Food');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileChange = (file: File) => {
    setErrorMsg(null);
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select an image file (JPEG, PNG, or WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('File size exceeds the 5MB limit.');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleProcessReceipt = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setErrorMsg(null);

    try {
      const result = await uploadReceiptImage(selectedFile);
      setExtraction(result);
      setMerchant(result.merchant);
      setCategory(result.category);
      setAmount(result.amount);
      setDate(result.date);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to scan receipt with AI.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmSave = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(String(amount));
    if (!merchant.trim()) {
      setErrorMsg('Please enter a merchant name.');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Please enter a valid positive amount.');
      return;
    }

    onTransactionSaved({
      merchant: merchant.trim(),
      category: category.trim(),
      amount: numAmount,
      date: date,
      receipt_url: previewUrl,
    });

    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 relative my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Scan & Upload Receipt</h3>
              <p className="text-xs text-slate-500">Gemini Vision OCR extraction</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Step 1: Upload & Scan */}
        {!extraction ? (
          <div className="mt-5 space-y-4">
            {!previewUrl ? (
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-8 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-indigo-50/20"
              >
                <div className="mx-auto w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mb-3">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-slate-700">
                  Click to select or drag receipt image here
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports JPEG, PNG, WebP (Max 5MB)
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden border border-slate-200 max-h-56 bg-slate-100 flex items-center justify-center">
                  <img
                    src={previewUrl}
                    alt="Receipt preview"
                    className="object-contain max-h-56 w-full"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/70 text-white hover:bg-slate-900 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                  <span className="flex items-center gap-1.5 truncate">
                    <FileImage className="h-4 w-4 text-indigo-600" />
                    {selectedFile?.name}
                  </span>
                  <span>{((selectedFile?.size || 0) / 1024).toFixed(1)} KB</span>
                </div>

                <button
                  type="button"
                  disabled={isUploading}
                  onClick={handleProcessReceipt}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold shadow-xs transition-colors"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Analyzing receipt with Gemini AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Extract Details with AI</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Step 2: Verification and Editing Form */
          <form onSubmit={handleConfirmSave} className="mt-5 space-y-4">
            {/* Status note if fallback */}
            {extraction.is_fallback ? (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2 text-xs text-amber-800">
                <Info className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                <div>
                  <strong className="font-semibold">Review Required (Fallback Mode):</strong>
                  <p className="mt-0.5">{extraction.notes || 'Gemini API key is not configured. Please confirm details below.'}</p>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-800">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  Successfully extracted with Gemini Vision!
                </span>
                {extraction.confidence && (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {Math.round(extraction.confidence * 100)}% Confidence
                  </span>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Merchant / Business</label>
                <input
                  type="text"
                  required
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Amount (BDT)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={resetState}
                className="px-4 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Scan Another
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#E5484D] hover:bg-[#D63A3F] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Confirm & Add Transaction
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
