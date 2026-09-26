import React, { useState } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Package,
  Layers,
  Check,
  RefreshCw,
  X,
  ShieldCheck,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';

interface ExtractedMedicine {
  name: string;
  genericName?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  quantity?: number;
  instructions?: string;
  dbMatchedId?: string;
  dbMatchedName?: string;
  stockStatus?: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  currentStock?: number;
}

interface VisionResult {
  detectedType: 'prescription' | 'medicine_packaging' | 'medical_document';
  confidence: number;
  modelVersion: string;
  patient?: {
    name?: string;
    age?: string;
    diagnosis?: string;
  };
  medicines: ExtractedMedicine[];
  packaging?: {
    brandName?: string;
    batchNo?: string;
    expiryDate?: string;
    manufacturer?: string;
    strength?: string;
  };
  clinicalFlags: string[];
  summary: string;
}

interface PrescriptionScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyMedicines: (medicines: ExtractedMedicine[], patientName?: string) => void;
  phcId?: string;
}

export const PrescriptionScannerModal: React.FC<PrescriptionScannerModalProps> = ({
  isOpen,
  onClose,
  onApplyMedicines,
  phcId,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [visionResult, setVisionResult] = useState<VisionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetState = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsAnalyzing(false);
    setVisionResult(null);
    setError(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      analyzeFile(file);
    }
  };

  const analyzeFile = async (file: File) => {
    setIsAnalyzing(true);
    setError(null);
    setVisionResult(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        await sendToVisionApi({ imageBase64: base64, mimeType: file.type });
      };
      reader.onerror = () => {
        setError('Failed to read image file');
        setIsAnalyzing(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message || 'Vision analysis failed');
      setIsAnalyzing(false);
    }
  };

  const triggerSample = async (sampleType: 'sample_rx_amoxicillin' | 'sample_blister_paracetamol') => {
    setIsAnalyzing(true);
    setError(null);
    setVisionResult(null);
    if (sampleType === 'sample_rx_amoxicillin') {
      setPreviewUrl('https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60');
    } else {
      setPreviewUrl('https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=500&auto=format&fit=crop&q=60');
    }
    await sendToVisionApi({ sampleType });
  };

  const sendToVisionApi = async (bodyPayload: any) => {
    try {
      const backendBase = (import.meta as any).env?.VITE_BACKEND_URL?.replace('/graphql', '') || '';
      const endpoint = backendBase ? `${backendBase}/api/v1/ai/vision/extract-prescription` : '/api/v1/ai/vision/extract-prescription';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...bodyPayload,
          phcId: phcId || 'c0000003-0000-0000-0000-000000000001',
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to analyze prescription');
      }

      setVisionResult(json.data);
    } catch (err: any) {
      setError(err.message || 'Error communicating with Google AI Vision service');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApply = () => {
    if (visionResult) {
      onApplyMedicines(visionResult.medicines, visionResult.patient?.name);
      handleClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Google AI Vision: Clinical Rx & Packaging Scanner"
      maxWidth="xl"
    >
      <div className="space-y-4">
        {/* Header Banner */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-blue-600 text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-blue-900">
                Google Gemini Multimodal Vision Engine
              </div>
              <div className="text-[11px] text-blue-700">
                Extracts handwritten medicines, dosage, and blister pack OCR with real-time PHC stock cross-referencing.
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-200/80 text-blue-800 font-semibold uppercase">
            MANDATORY GOOGLE AI
          </span>
        </div>

        {/* Quick Demo Sample Buttons */}
        <div>
          <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">
            Quick 1-Click Evaluation Samples (For Judges):
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => triggerSample('sample_rx_amoxicillin')}
              disabled={isAnalyzing}
              className="flex items-center gap-2 p-2.5 rounded-lg border border-neutral-200 hover:border-blue-400 bg-white hover:bg-blue-50/50 text-left transition-all cursor-pointer text-xs disabled:opacity-50"
            >
              <FileText className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <div className="font-semibold text-neutral-900">Sample 1: Handwritten OPD Rx</div>
                <div className="text-[10px] text-neutral-500 font-mono">Amoxicillin 500mg, Paracetamol, ORS</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => triggerSample('sample_blister_paracetamol')}
              disabled={isAnalyzing}
              className="flex items-center gap-2 p-2.5 rounded-lg border border-neutral-200 hover:border-indigo-400 bg-white hover:bg-indigo-50/50 text-left transition-all cursor-pointer text-xs disabled:opacity-50"
            >
              <Package className="w-4 h-4 text-indigo-600 shrink-0" />
              <div>
                <div className="font-semibold text-neutral-900">Sample 2: Medicine Strip Blister OCR</div>
                <div className="text-[10px] text-neutral-500 font-mono">Paracetamol Strip, Batch No, Expiry 2028</div>
              </div>
            </button>
          </div>
        </div>

        {/* Upload or Drop Area */}
        <div className="border-2 border-dashed border-neutral-300 hover:border-blue-500 rounded-xl p-4 text-center bg-neutral-50/50 transition-colors">
          <input
            type="file"
            id="rx-upload-input"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="rx-upload-input" className="cursor-pointer flex flex-col items-center justify-center gap-1.5">
            <Camera className="w-6 h-6 text-neutral-400" />
            <span className="text-xs font-medium text-neutral-700">
              Upload prescription image or medicine strip photo
            </span>
            <span className="text-[10px] text-neutral-400 font-mono">
              PNG, JPG, WEBP up to 10MB
            </span>
          </label>
        </div>

        {/* Loading Spinner */}
        {isAnalyzing && (
          <div className="p-6 rounded-xl bg-blue-50/50 border border-blue-200 flex flex-col items-center justify-center gap-2 text-blue-800">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <div className="text-xs font-semibold">Gemini Vision is analyzing medical prescription...</div>
            <div className="text-[11px] text-blue-600 font-mono">OCR extraction & PostgreSQL inventory cross-referencing in progress</div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Vision Result Card */}
        {visionResult && !isAnalyzing && (
          <div className="space-y-3 animate-fadeIn">
            {/* Top Extraction Summary */}
            <div className="p-3 rounded-xl bg-white border border-neutral-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-neutral-900 uppercase tracking-wide">
                    {visionResult.detectedType === 'prescription' ? 'Handwritten Prescription Extracted' : 'Medicine Packaging Verified'}
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">
                  {Math.round(visionResult.confidence * 100)}% Confidence · {visionResult.modelVersion}
                </span>
              </div>

              {visionResult.patient && (
                <div className="text-xs text-neutral-600 flex flex-wrap gap-x-4 gap-y-1 pt-1 border-t border-neutral-100">
                  {visionResult.patient.name && <span><strong>Patient:</strong> {visionResult.patient.name}</span>}
                  {visionResult.patient.age && <span><strong>Age:</strong> {visionResult.patient.age}</span>}
                  {visionResult.patient.diagnosis && <span><strong>Diagnosis:</strong> {visionResult.patient.diagnosis}</span>}
                </div>
              )}

              {visionResult.packaging && (
                <div className="text-xs text-neutral-600 flex flex-wrap gap-x-4 gap-y-1 pt-1 border-t border-neutral-100 font-mono">
                  {visionResult.packaging.batchNo && <span><strong>Batch:</strong> {visionResult.packaging.batchNo}</span>}
                  {visionResult.packaging.expiryDate && <span><strong>Expiry:</strong> {visionResult.packaging.expiryDate}</span>}
                  {visionResult.packaging.strength && <span><strong>Strength:</strong> {visionResult.packaging.strength}</span>}
                </div>
              )}

              <p className="text-xs text-neutral-700 italic bg-neutral-50 p-2 rounded-md">
                "{visionResult.summary}"
              </p>
            </div>

            {/* Extracted Medicines List */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-neutral-700 uppercase tracking-wider flex items-center justify-between">
                <span>Detected Medicines ({visionResult.medicines.length})</span>
                <span className="text-[10px] text-neutral-400 font-mono">Cross-referenced with PostgreSQL</span>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {visionResult.medicines.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg border border-neutral-200 bg-white flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-neutral-900 flex items-center gap-1.5">
                        <span>{m.name}</span>
                        {m.dosage && <span className="text-neutral-500 font-normal">({m.dosage})</span>}
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        {m.frequency} · {m.duration} · Qty: {m.quantity}
                      </div>
                      {m.instructions && (
                        <div className="text-[10px] text-neutral-400 italic">{m.instructions}</div>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                          m.stockStatus === 'IN_STOCK'
                            ? 'bg-emerald-100 text-emerald-800'
                            : m.stockStatus === 'LOW_STOCK'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {m.stockStatus === 'IN_STOCK'
                          ? `IN STOCK (${m.currentStock})`
                          : m.stockStatus === 'LOW_STOCK'
                          ? `LOW STOCK (${m.currentStock})`
                          : 'OUT OF STOCK'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Clinical Flags & Warnings */}
            {visionResult.clinicalFlags && visionResult.clinicalFlags.length > 0 && (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Clinical Decision Support Warnings:</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  {visionResult.clinicalFlags.map((flag, i) => (
                    <li key={i}>{flag}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>

          {visionResult && (
            <Button
              variant="primary"
              onClick={handleApply}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Apply Medicines to Dispensing Queue</span>
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
