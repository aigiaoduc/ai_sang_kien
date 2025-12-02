export enum SectionId {
  GENERAL_INFO = 'general_info',
  // Phần I: Đặt vấn đề
  REASON = 'reason', // Lý do chọn đề tài
  OBJECTIVE_METHOD = 'objective_method', // Mục đích & Phương pháp nghiên cứu
  
  // Phần II: Giải quyết vấn đề
  THEORY = 'theory', // Cơ sở lý luận
  REALITY = 'reality', // Thực trạng
  MEASURES = 'measures', // Các biện pháp (Trọng tâm)
  NEW_POINTS = 'new_points', // Điểm mới của sáng kiến
  EFFECTIVENESS = 'effectiveness', // Hiệu quả áp dụng

  // Phần III: Kết luận
  CONCLUSION = 'conclusion', // Kết luận chung
  RECOMMENDATION = 'recommendation', // Kiến nghị
  
  // Phụ lục
  REFERENCES = 'references'
}

export interface SectionDef {
  id: SectionId;
  title: string;
  description: string;
  promptLabel: string; // What to ask the user for input
  placeholder: string;
  guideContent?: string; // Expert static advice for this section
  isGenerated?: boolean;
}

export interface DocumentState {
  topic: string;
  subject: string;
  grade: string;
  [SectionId.REASON]: string;
  [SectionId.OBJECTIVE_METHOD]: string;
  [SectionId.THEORY]: string;
  [SectionId.REALITY]: string;
  [SectionId.MEASURES]: string;
  [SectionId.NEW_POINTS]: string;
  [SectionId.EFFECTIVENESS]: string;
  [SectionId.CONCLUSION]: string;
  [SectionId.RECOMMENDATION]: string;
  [SectionId.REFERENCES]: string;
}

export interface GenerationRequest {
  sectionId: SectionId;
  userContext: string;
  documentState: DocumentState;
}