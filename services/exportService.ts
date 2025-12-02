import * as docx from "docx";
import saveAs from "file-saver";
import { DocumentState, SectionId } from "../types";
import { SKKN_SECTIONS } from "../constants";

const { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, PageOrientation, BorderStyle } = docx;

// Helper to convert Markdown-ish text to Docx Paragraphs
const parseMarkdownToParagraphs = (text: string): docx.Paragraph[] => {
  if (!text) return [new Paragraph({})];

  const lines = text.split('\n');
  const paragraphs: docx.Paragraph[] = [];

  lines.forEach(line => {
    const trimmedLine = line.trim();
    if (!trimmedLine) {
      paragraphs.push(new Paragraph({ text: "" })); // Empty line
      return;
    }

    // Handle Headings (###)
    if (trimmedLine.startsWith('### ')) {
      paragraphs.push(new Paragraph({
        text: trimmedLine.replace('### ', ''),
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 240, after: 120 },
      }));
      return;
    }
    if (trimmedLine.startsWith('## ')) {
      paragraphs.push(new Paragraph({
        text: trimmedLine.replace('## ', ''),
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
      }));
      return;
    }

    // Handle Bullet points (- or + or *)
    let isBullet = false;
    let cleanLine = trimmedLine;
    if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ') || trimmedLine.startsWith('+ ')) {
      isBullet = true;
      cleanLine = trimmedLine.substring(2);
    }

    // Handle Bold (**text**) parsing
    const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
    const children = parts.map(part => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return new TextRun({
          text: part.slice(2, -2),
          bold: true,
          font: "Times New Roman",
          size: 28, // 14pt
        });
      }
      return new TextRun({
        text: part,
        font: "Times New Roman",
        size: 28, // 14pt
      });
    });

    paragraphs.push(new Paragraph({
      children: children,
      bullet: isBullet ? { level: 0 } : undefined,
      spacing: { line: 360, after: 120 }, // 1.5 line spacing
      alignment: AlignmentType.JUSTIFIED,
      indent: isBullet ? undefined : { firstLine: 720 }, // Indent first line ~1.27cm
    }));
  });

  return paragraphs;
};

export const exportToWord = async (documentState: DocumentState) => {
  // 1. Create Sections
  const children: (docx.Paragraph)[] = [];

  // --- TITLE PAGE ---
  children.push(
    new Paragraph({
      text: "PHÒNG GIÁO DỤC VÀ ĐÀO TẠO ...",
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400 },
      children: [new TextRun({ font: "Times New Roman", size: 28, bold: true, text: "PHÒNG GIÁO DỤC VÀ ĐÀO TẠO ..." })]
    }),
    new Paragraph({
      text: "TRƯỜNG ...",
      alignment: AlignmentType.CENTER,
      spacing: { after: 2000 },
      children: [new TextRun({ font: "Times New Roman", size: 28, bold: true, text: "TRƯỜNG ..." })]
    }),
    
    // SKKN Title
    new Paragraph({
      text: "SÁNG KIẾN KINH NGHIỆM",
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [new TextRun({ font: "Times New Roman", size: 40, bold: true, color: "2E74B5", text: "SÁNG KIẾN KINH NGHIỆM" })]
    }),
    new Paragraph({
      text: documentState.topic.toUpperCase(),
      alignment: AlignmentType.CENTER,
      spacing: { after: 2000 },
      children: [new TextRun({ font: "Times New Roman", size: 36, bold: true, text: documentState.topic.toUpperCase() })]
    }),

    // Author Info
    new Paragraph({
      indent: { left: 4000 },
      spacing: { before: 200 },
      children: [
        new TextRun({ font: "Times New Roman", size: 28, bold: true, text: "Lĩnh vực/Môn học: " }),
        new TextRun({ font: "Times New Roman", size: 28, text: documentState.subject })
      ]
    }),
    new Paragraph({
      indent: { left: 4000 },
      spacing: { before: 200 },
      children: [
        new TextRun({ font: "Times New Roman", size: 28, bold: true, text: "Khối lớp: " }),
        new TextRun({ font: "Times New Roman", size: 28, text: documentState.grade })
      ]
    }),
    new Paragraph({
      indent: { left: 4000 },
      spacing: { before: 200 },
      children: [
        new TextRun({ font: "Times New Roman", size: 28, bold: true, text: "Người thực hiện: " }),
        new TextRun({ font: "Times New Roman", size: 28, text: ".................................................." })
      ]
    }),

    // Date
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 3000 },
      children: [new TextRun({ font: "Times New Roman", size: 28, italic: true, text: "..........., năm 20..." })]
    }),
    
    // Page Break after title
    new Paragraph({
      children: [new docx.PageBreak()]
    })
  );

  // --- CONTENT SECTIONS ---
  SKKN_SECTIONS.forEach((section) => {
    if (section.id === SectionId.GENERAL_INFO) return;

    const content = documentState[section.id as keyof DocumentState];
    if (!content) return;

    // Section Title
    children.push(
      new Paragraph({
        text: section.title,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
        children: [
          new TextRun({
             text: section.title,
             font: "Times New Roman",
             bold: true,
             size: 32, // 16pt
             color: "000000"
          })
        ]
      })
    );

    // Section Content parsed from Markdown
    const contentParagraphs = parseMarkdownToParagraphs(content as string);
    children.push(...contentParagraphs);
  });

  // 2. Create Document
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: "Times New Roman",
            size: 28, // 14pt (Half-points)
          },
        },
      },
      paragraphStyles: [
        {
          id: "Normal",
          name: "Normal",
          run: {
            font: "Times New Roman",
            size: 28,
          },
          paragraph: {
            spacing: { line: 360 }, // 1.5 lines
          },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1134, // 2cm (Twips) - 1cm = 567 twips approx
              right: 1134, // 2cm
              bottom: 1134, // 2cm
              left: 1701, // 3cm
            },
          },
        },
        children: children,
      },
    ],
  });

  // 3. Packer and Save
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `SKKN_${documentState.topic.substring(0, 30).replace(/\s+/g, '_')}.docx`);
};