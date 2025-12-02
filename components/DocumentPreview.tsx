import React, { useState } from 'react';
import { DocumentState } from '../types';
import { FileDown, X, Loader2, FileText } from 'lucide-react';
import { exportToWord } from '../services/exportService';
import { ToastType } from './Toast';

interface DocumentPreviewProps {
  documentState: DocumentState;
  onClose: () => void;
  notify: (msg: string, type: ToastType) => void;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({ documentState, onClose, notify }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleExportWord = async () => {
    setIsExporting(true);
    try {
      await exportToWord(documentState);
      notify("Tải file Word thành công!", "success");
    } catch (error) {
      console.error(error);
      notify("Có lỗi khi tạo file Word. Vui lòng thử lại.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800">Xem trước Sáng Kiến Kinh Nghiệm</h2>
          <div className="flex gap-3">
             <button 
              onClick={handleExportWord}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 font-medium shadow-sm"
            >
              {isExporting ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
              Tải file Word (.docx)
            </button>
             <button 
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors font-medium shadow-sm"
            >
              <FileDown size={16} />
              In / Lưu PDF
            </button>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content - Print Layout */}
        <div className="flex-1 overflow-y-auto bg-gray-100 p-8">
          <div className="max-w-[210mm] mx-auto bg-white min-h-[297mm] shadow-lg p-[25mm] text-justify leading-relaxed text-gray-900" id="print-area">
            
            {/* Title Page Simulation */}
            <div className="text-center mb-12 border-b-2 border-gray-300 pb-8">
              <p className="uppercase font-bold text-lg mb-2">PHÒNG GIÁO DỤC VÀ ĐÀO TẠO ...</p>
              <p className="uppercase font-bold text-lg mb-16">TRƯỜNG ...</p>
              
              <h1 className="text-3xl font-bold uppercase text-blue-900 mb-8 px-10 leading-snug">
                SÁNG KIẾN KINH NGHIỆM: <br/>
                {documentState.topic || "..."}
              </h1>

              <div className="text-left inline-block mt-12 text-lg">
                <p className="mb-2"><span className="font-bold">Lĩnh vực/Môn học:</span> {documentState.subject || "..."}</p>
                <p className="mb-2"><span className="font-bold">Khối lớp:</span> {documentState.grade || "..."}</p>
                <p><span className="font-bold">Người thực hiện:</span> ...........................</p>
              </div>
            </div>

            {/* Sections */}
            <div className="space-y-10">
              
              {/* PHẦN I: ĐẶT VẤN ĐỀ */}
              <div className="section-group">
                <h2 className="text-2xl font-bold mb-6 text-center text-red-700 uppercase">PHẦN I: ĐẶT VẤN ĐỀ</h2>
                
                <section className="mb-6">
                  <h3 className="text-xl font-bold mb-3 uppercase text-indigo-900">1. Lý do chọn đề tài</h3>
                  <div className="whitespace-pre-wrap">{documentState.reason || <span className="text-gray-400 italic">[Chưa có nội dung]</span>}</div>
                </section>

                <section className="mb-6">
                  <h3 className="text-xl font-bold mb-3 uppercase text-indigo-900">2. Mục đích & Phương pháp nghiên cứu</h3>
                  <div className="whitespace-pre-wrap">{documentState.objective_method || <span className="text-gray-400 italic">[Chưa có nội dung]</span>}</div>
                </section>
              </div>

              {/* PHẦN II: GIẢI QUYẾT VẤN ĐỀ */}
              <div className="section-group">
                <h2 className="text-2xl font-bold mb-6 text-center text-red-700 uppercase">PHẦN II: GIẢI QUYẾT VẤN ĐỀ</h2>
                
                <section className="mb-6">
                  <h3 className="text-xl font-bold mb-3 uppercase text-indigo-900">1. Cơ sở lý luận</h3>
                  <div className="whitespace-pre-wrap">{documentState.theory || <span className="text-gray-400 italic">[Chưa có nội dung]</span>}</div>
                </section>

                <section className="mb-6">
                  <h3 className="text-xl font-bold mb-3 uppercase text-indigo-900">2. Thực trạng vấn đề</h3>
                  <div className="whitespace-pre-wrap">{documentState.reality || <span className="text-gray-400 italic">[Chưa có nội dung]</span>}</div>
                </section>

                <section className="mb-6">
                  <h3 className="text-xl font-bold mb-3 uppercase text-indigo-900">3. Các biện pháp thực hiện</h3>
                  <div className="whitespace-pre-wrap">{documentState.measures || <span className="text-gray-400 italic">[Chưa có nội dung]</span>}</div>
                </section>

                <section className="mb-6">
                  <h3 className="text-xl font-bold mb-3 uppercase text-indigo-900">4. Điểm mới của sáng kiến</h3>
                  <div className="whitespace-pre-wrap">{documentState.new_points || <span className="text-gray-400 italic">[Chưa có nội dung]</span>}</div>
                </section>

                <section className="mb-6">
                  <h3 className="text-xl font-bold mb-3 uppercase text-indigo-900">5. Hiệu quả sáng kiến</h3>
                  <div className="whitespace-pre-wrap">{documentState.effectiveness || <span className="text-gray-400 italic">[Chưa có nội dung]</span>}</div>
                </section>
              </div>

              {/* PHẦN III: KẾT LUẬN & KIẾN NGHỊ */}
              <div className="section-group">
                <h2 className="text-2xl font-bold mb-6 text-center text-red-700 uppercase">PHẦN III: KẾT LUẬN & KIẾN NGHỊ</h2>
                
                <section className="mb-6">
                  <h3 className="text-xl font-bold mb-3 uppercase text-indigo-900">1. Kết luận</h3>
                  <div className="whitespace-pre-wrap">{documentState.conclusion || <span className="text-gray-400 italic">[Chưa có nội dung]</span>}</div>
                </section>

                <section className="mb-6">
                  <h3 className="text-xl font-bold mb-3 uppercase text-indigo-900">2. Kiến nghị</h3>
                  <div className="whitespace-pre-wrap">{documentState.recommendation || <span className="text-gray-400 italic">[Chưa có nội dung]</span>}</div>
                </section>
              </div>

              <section className="pt-8 border-t">
                <h3 className="text-xl font-bold mb-3 uppercase text-indigo-900">Tài liệu tham khảo</h3>
                <div className="whitespace-pre-wrap">{documentState.references || <span className="text-gray-400 italic">[Chưa có nội dung]</span>}</div>
              </section>
            </div>
            
            <div className="mt-16 text-right">
              <p className="italic mb-20">......., ngày ... tháng ... năm 20...</p>
              <p className="font-bold uppercase">Người viết sáng kiến</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentPreview;