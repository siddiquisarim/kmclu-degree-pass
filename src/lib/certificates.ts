// Auto-generated certificates for the KMCLU portal.
// Each template mirrors a printed university certificate; the COE approves a
// request and the PDF is produced in-browser with the student's data filled in.
// Later, a Laravel backend can render the same fields server-side — the field
// list per service is the contract (see CERT_FIELDS).

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { DegreeRequest, ServiceCode } from "@/lib/store";

export type CertField =
  | "father_name"
  | "semester"
  | "session"
  | "division"
  | "academic_year"
  | "fee_amount"
  | "serial_no"
  | "issue_date";

// Which services have a printable template, and what the COE must fill in.
export const CERT_FIELDS: Partial<Record<ServiceCode, CertField[]>> = {
  character_certificate: ["serial_no", "issue_date", "father_name", "semester", "session"],
  transfer_certificate: ["serial_no", "issue_date", "father_name", "semester", "session"],
  diploma_certificate: ["serial_no", "issue_date", "father_name", "session", "division"],
  provisional_degree: ["serial_no", "issue_date", "father_name", "academic_year", "division"],
  bonafide: ["serial_no", "issue_date", "father_name", "semester", "session", "fee_amount"],
  medium_certificate: ["serial_no", "issue_date", "father_name", "academic_year"],
};

export function hasTemplate(code: string): code is ServiceCode {
  return Boolean(CERT_FIELDS[code as ServiceCode]);
}

export type CertValues = Partial<Record<CertField, string>>;

const NAVY = rgb(0.06, 0.09, 0.18);

type Fonts = { reg: PDFFont; bold: PDFFont; it: PDFFont; boldIt: PDFFont };

const UNI = "Khwaja Moinuddin Chishti Language University, Lucknow";
const SUB = "(Uttar Pradesh State Government University)";
const ADDR1 = "Add.:- Sitapur-Hardoi Bypass Road, Lucknow-226013, U.P. (India)";
const ADDR2 = "website : https://kmclu.ac.in/  e-mail : coe@kmclu.ac.in";

function textWidth(font: PDFFont, text: string, size: number) {
  return font.widthOfTextAtSize(text, size);
}

function drawCentered(page: PDFPage, text: string, y: number, font: PDFFont, size: number) {
  const { width } = page.getSize();
  page.drawText(text, {
    x: (width - textWidth(font, text, size)) / 2,
    y,
    size,
    font,
    color: NAVY,
  });
}

function drawUnderlinedCentered(
  page: PDFPage,
  text: string,
  y: number,
  font: PDFFont,
  size: number,
) {
  const { width } = page.getSize();
  const w = textWidth(font, text, size);
  const x = (width - w) / 2;
  page.drawText(text, { x, y, size, font, color: NAVY });
  page.drawLine({
    start: { x, y: y - 3 },
    end: { x: x + w, y: y - 3 },
    thickness: 1,
    color: NAVY,
  });
}

// Justified-ish paragraph writer that keeps runs bold/underlined where the
// printed certificates emphasise filled-in values.
type Run = { text: string; bold?: boolean; italic?: boolean; underline?: boolean };

function drawRuns(
  page: PDFPage,
  runs: Run[],
  opts: { x: number; y: number; width: number; size: number; leading: number; indent?: number },
  f: Fonts,
) {
  const words: Run[] = [];
  for (const run of runs) {
    for (const w of run.text.split(/\s+/).filter(Boolean)) words.push({ ...run, text: w });
  }
  const pick = (r: Run) =>
    r.bold && r.italic ? f.boldIt : r.bold ? f.bold : r.italic ? f.it : f.reg;

  let y = opts.y;
  let x = opts.x + (opts.indent ?? 0);
  const right = opts.x + opts.width;
  const space = textWidth(f.reg, " ", opts.size);

  for (const w of words) {
    const font = pick(w);
    const ww = textWidth(font, w.text, opts.size);
    if (x + ww > right) {
      y -= opts.leading;
      x = opts.x;
    }
    page.drawText(w.text, { x, y, size: opts.size, font, color: NAVY });
    if (w.underline) {
      page.drawLine({
        start: { x, y: y - 2 },
        end: { x: x + ww, y: y - 2 },
        thickness: 0.7,
        color: NAVY,
      });
    }
    x += ww + space;
  }
  return y - opts.leading;
}

function drawLetterhead(page: PDFPage, f: Fonts, withBorder: boolean) {
  const { width, height } = page.getSize();
  if (withBorder) {
    page.drawRectangle({
      x: 24,
      y: 24,
      width: width - 48,
      height: height - 48,
      borderColor: NAVY,
      borderWidth: 1.5,
      color: undefined,
    });
    page.drawRectangle({
      x: 32,
      y: 32,
      width: width - 64,
      height: height - 64,
      borderColor: NAVY,
      borderWidth: 0.6,
      color: undefined,
    });
  }
  // crest
  const cx = withBorder ? 78 : 62;
  const cy = height - (withBorder ? 78 : 66);
  page.drawCircle({ x: cx, y: cy, size: 22, borderColor: NAVY, borderWidth: 1 });
  page.drawCircle({ x: cx, y: cy, size: 17, borderColor: NAVY, borderWidth: 0.5 });
  drawCentered(page, "", 0, f.reg, 1);
  page.drawText("KMCLU", {
    x: cx - textWidth(f.bold, "KMCLU", 7) / 2,
    y: cy - 3,
    size: 7,
    font: f.bold,
    color: NAVY,
  });

  drawCentered(page, UNI, height - (withBorder ? 80 : 68), f.bold, 15);
  drawCentered(page, SUB, height - (withBorder ? 98 : 86), f.reg, 9);

  const ruleY = height - (withBorder ? 110 : 98);
  page.drawLine({
    start: { x: withBorder ? 42 : 40, y: ruleY },
    end: { x: width - (withBorder ? 42 : 40), y: ruleY },
    thickness: 1,
    color: NAVY,
  });
  return ruleY;
}

function drawFooter(page: PDFPage, f: Fonts) {
  drawCentered(page, ADDR1, 46, f.reg, 8);
  drawCentered(page, ADDR2, 35, f.reg, 8);
}

function fmtDate(d?: string) {
  const date = d ? new Date(d) : new Date();
  if (Number.isNaN(date.getTime())) return d ?? "";
  return date.toLocaleDateString("en-GB").replace(/\//g, "-");
}

function serial(v?: string) {
  const year = new Date().getFullYear();
  return `${v ? `${v}` : ""}/COE/KMCLU/${year}`;
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

async function landscapeBase(r: DegreeRequest, v: CertValues, title: string) {
  const pdf = await PDFDocument.create();
  const f: Fonts = {
    reg: await pdf.embedFont(StandardFonts.TimesRoman),
    bold: await pdf.embedFont(StandardFonts.TimesRomanBold),
    it: await pdf.embedFont(StandardFonts.TimesRomanItalic),
    boldIt: await pdf.embedFont(StandardFonts.TimesRomanBoldItalic),
  };
  const page = pdf.addPage([842, 595]); // A4 landscape
  const ruleY = drawLetterhead(page, f, true);
  drawFooter(page, f);

  const left = 60;
  const right = 842 - 60;
  let y = ruleY - 28;

  page.drawText("SERIAL NO:", { x: left, y, size: 11, font: f.bold, color: NAVY });
  page.drawText(serial(v.serial_no), { x: left + 100, y, size: 11, font: f.reg, color: NAVY });
  page.drawText("DATE:", { x: right - 150, y, size: 11, font: f.bold, color: NAVY });
  page.drawText(fmtDate(v.issue_date), { x: right - 100, y, size: 11, font: f.reg, color: NAVY });
  y -= 20;
  page.drawText("ROLL NO:", { x: left, y, size: 11, font: f.bold, color: NAVY });
  page.drawText(r.roll_no, { x: left + 100, y, size: 11, font: f.reg, color: NAVY });
  y -= 20;
  page.drawText("ENROLLMENT NO:", { x: left, y, size: 11, font: f.bold, color: NAVY });
  page.drawText(r.enrollment_no, { x: left + 130, y, size: 11, font: f.reg, color: NAVY });

  y -= 42;
  drawUnderlinedCentered(page, title, y, f.boldIt, 16);
  y -= 34;
  return { pdf, page, f, left, width: right - left, y };
}

const CERTIFY_RUNS = (r: DegreeRequest, v: CertValues): Run[] => [
  { text: "This is to certify that Mr./Ms." },
  { text: r.full_name.toUpperCase(), bold: true, underline: true },
  { text: "S/D/O Mr." },
  { text: (v.father_name || "—").toUpperCase(), bold: true, underline: true },
  { text: "has" },
  { text: "PASSED", bold: true, underline: true },
  { text: "his/her" },
  { text: (v.semester || "FINAL").toUpperCase(), bold: true, underline: true },
  { text: "Semester of" },
  { text: r.course_name.toUpperCase(), bold: true, underline: true },
  { text: "Course in" },
  { text: v.session || "—", bold: true, underline: true },
  { text: `from ${UNI}.` },
];

async function characterCertificate(r: DegreeRequest, v: CertValues) {
  const { pdf, page, f, left, width, y } = await landscapeBase(r, v, "CHARACTER CERTIFICATE");
  let cursor = drawRuns(
    page,
    CERTIFY_RUNS(r, v),
    { x: left, y, width, size: 12.5, leading: 26, indent: 24 },
    f,
  );
  cursor = drawRuns(
    page,
    [
      {
        text:
          "As far as known to me, he/she bears a good moral character. I wish him/her all the success in his/her life.",
      },
    ],
    { x: left, y: cursor - 8, width, size: 12.5, leading: 26, indent: 24 },
    f,
  );
  page.drawText("PROCTOR", { x: left + 10, y: 96, size: 12, font: f.bold, color: NAVY });
  const sig = "Dy. CONTROLLER OF EXAMINATION";
  page.drawText(sig, {
    x: 842 - 60 - textWidth(f.bold, sig, 12),
    y: 96,
    size: 12,
    font: f.bold,
    color: NAVY,
  });
  return pdf;
}

async function migrationCertificate(r: DegreeRequest, v: CertValues) {
  const { pdf, page, f, left, width, y } = await landscapeBase(r, v, "MIGRATION CERTIFICATE");
  const cursor = drawRuns(
    page,
    CERTIFY_RUNS(r, v),
    { x: left, y, width, size: 12.5, leading: 26, indent: 24 },
    f,
  );
  drawRuns(
    page,
    [
      {
        text: `${UNI} has no objection in his/her taking admission in any other University.`,
      },
    ],
    { x: left, y: cursor - 4, width, size: 12.5, leading: 26, indent: 24 },
    f,
  );
  const sig = "Dy. CONTROLLER OF EXAMINATION";
  page.drawText(sig, {
    x: 842 - 60 - textWidth(f.bold, sig, 12),
    y: 96,
    size: 12,
    font: f.bold,
    color: NAVY,
  });
  return pdf;
}

async function awardCertificate(
  r: DegreeRequest,
  v: CertValues,
  kind: "diploma" | "provisional",
) {
  const pdf = await PDFDocument.create();
  const f: Fonts = {
    reg: await pdf.embedFont(StandardFonts.TimesRoman),
    bold: await pdf.embedFont(StandardFonts.TimesRomanBold),
    it: await pdf.embedFont(StandardFonts.TimesRomanItalic),
    boldIt: await pdf.embedFont(StandardFonts.TimesRomanBoldItalic),
  };
  const page = pdf.addPage([842, 595]);
  const ruleY = drawLetterhead(page, f, true);
  const left = 60;
  const width = 842 - 120;

  let y = ruleY - 40;
  drawUnderlinedCentered(
    page,
    kind === "diploma" ? "CERTIFICATE" : "PROVISIONAL CERTIFICATE",
    y,
    f.boldIt,
    17,
  );

  y -= 46;
  const label = kind === "diploma" ? "Serial No." : "Dispatch No.";
  page.drawText(label, { x: left, y, size: 12, font: f.bold, color: NAVY });
  page.drawText(serial(v.serial_no), { x: left + 120, y, size: 12, font: f.reg, color: NAVY });
  y -= 22;
  page.drawText("Enrollment No.", { x: left, y, size: 12, font: f.bold, color: NAVY });
  page.drawText(r.enrollment_no, { x: left + 120, y, size: 12, font: f.bold, color: NAVY });
  y -= 22;
  page.drawText("Roll No.", { x: left, y, size: 12, font: f.bold, color: NAVY });
  page.drawText(r.roll_no, { x: left + 120, y, size: 12, font: f.bold, color: NAVY });

  y -= 56;
  const runs: Run[] =
    kind === "diploma"
      ? [
          { text: "The Diploma Certificate is awarded to" },
          { text: r.full_name, bold: true, italic: true },
          { text: "S/o" },
          { text: v.father_name || "—", bold: true, italic: true },
          { text: "for having successfully completed" },
          { text: r.course_name, bold: true, italic: true },
          { text: "during session" },
          { text: v.session || "—", bold: true, italic: true },
          { text: "and he/she has secured" },
          { text: `${v.division || "First Division"}.`, bold: true, italic: true },
        ]
      : [
          { text: "This is to certify that" },
          { text: r.full_name, bold: true, italic: true },
          { text: "S/o" },
          { text: v.father_name || "—", bold: true, italic: true },
          { text: "has passed the Final Year Examination for the" },
          { text: "Degree", bold: true, italic: true },
          { text: "of" },
          { text: r.course_name, bold: true, italic: true },
          { text: "in the Examination of" },
          { text: v.academic_year || String(new Date().getFullYear()) },
          { text: ", and that he/she is placed in the" },
          { text: `${v.division || "First Division"}.`, bold: true, italic: true },
        ];
  drawRuns(page, runs, { x: left, y, width, size: 13, leading: 30, indent: 24 }, f);

  page.drawLine({
    start: { x: left, y: 118 },
    end: { x: left + 150, y: 118 },
    thickness: 1,
    color: NAVY,
  });
  page.drawText("Date of issue", { x: left + 6, y: 100, size: 12, font: f.bold, color: NAVY });
  const sig = kind === "diploma" ? "Dy. Controller of Examination" : "Deputy Controller of Examination";
  page.drawText(sig, {
    x: 842 - 60 - textWidth(f.bold, sig, 12),
    y: 100,
    size: 12,
    font: f.bold,
    color: NAVY,
  });
  return pdf;
}

async function letterCertificate(
  r: DegreeRequest,
  v: CertValues,
  kind: "bonafide" | "medium",
) {
  const pdf = await PDFDocument.create();
  const f: Fonts = {
    reg: await pdf.embedFont(StandardFonts.TimesRoman),
    bold: await pdf.embedFont(StandardFonts.TimesRomanBold),
    it: await pdf.embedFont(StandardFonts.TimesRomanItalic),
    boldIt: await pdf.embedFont(StandardFonts.TimesRomanBoldItalic),
  };
  const page = pdf.addPage([595, 842]); // A4 portrait
  const ruleY = drawLetterhead(page, f, false);
  const left = 60;
  const width = 595 - 120;

  let y = ruleY - 30;
  page.drawText(kind === "bonafide" ? "Ref No:" : "Ref. No:", {
    x: left,
    y,
    size: 11,
    font: f.bold,
    color: NAVY,
  });
  page.drawText(serial(v.serial_no), { x: left + 66, y, size: 11, font: f.reg, color: NAVY });
  const dateLabel = `Date: ${fmtDate(v.issue_date)}`;
  page.drawText(dateLabel, {
    x: 595 - 60 - textWidth(f.bold, dateLabel, 11),
    y,
    size: 11,
    font: f.bold,
    color: NAVY,
  });

  y -= 40;
  if (kind === "medium") {
    drawUnderlinedCentered(page, "MEDIUM CERTIFICATE", y, f.bold, 13);
    y -= 34;
  }
  drawUnderlinedCentered(page, "TO WHOM IT MAY CONCERN", y, f.bold, 15);
  y -= 42;

  const runs: Run[] =
    kind === "bonafide"
      ? [
          { text: "This is to certify that" },
          { text: r.full_name, bold: true },
          { text: "S/o" },
          { text: v.father_name || "—", bold: true },
          { text: "is a" },
          { text: "Bonafide", bold: true },
          { text: "student of" },
          { text: r.course_name, bold: true },
          { text: `${v.semester || "1st"} Semester`, bold: true },
          { text: `(Session ${v.session || "—"})` },
          {
            text: `and deposited his/her fee of Rs. ${v.fee_amount || "—"}/- for the ${
              v.semester || "1st"
            } Semester of this University.`,
          },
        ]
      : [
          { text: "This is to certify that" },
          { text: r.full_name, bold: true },
          { text: ", Son/Daughter of" },
          { text: v.father_name || "—", bold: true },
          { text: ", bearing Roll No." },
          { text: `${r.roll_no},` },
          { text: "has completed the" },
          { text: r.course_name, bold: true },
          { text: "program in the academic year" },
          { text: v.academic_year || "—", bold: true },
          { text: "under English Medium with Regular Mode." },
        ];
  const cursor = drawRuns(page, runs, { x: left, y, width, size: 12.5, leading: 28, indent: 24 }, f);

  const nameLine = "(Dr. Ataur Rahman Azami)";
  const roleLine = "Dy. Controller of Examination";
  const blockY = Math.min(cursor - 60, 300);
  page.drawText(nameLine, {
    x: 595 - 60 - textWidth(f.bold, nameLine, 12),
    y: blockY,
    size: 12,
    font: f.bold,
    color: NAVY,
  });
  page.drawText(roleLine, {
    x: 595 - 60 - textWidth(f.reg, roleLine, 12),
    y: blockY - 16,
    size: 12,
    font: f.reg,
    color: NAVY,
  });

  page.drawLine({ start: { x: 50, y: 74 }, end: { x: 545, y: 74 }, thickness: 0.8, color: NAVY });
  page.drawText(
    "Add:- Sitapur-Hardoi Bypass Road, Lucknow-226013 U.P. (India)  Contact:- 0522-2774041",
    { x: 50, y: 60, size: 8, font: f.bold, color: NAVY },
  );
  page.drawText("Website:- www.kmclu.ac.in,  Email:- coe@kmclu.ac.in, reg@kmclu.ac.in", {
    x: 50,
    y: 49,
    size: 8,
    font: f.reg,
    color: NAVY,
  });
  return pdf;
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export async function generateCertificate(
  r: DegreeRequest,
  values: CertValues,
): Promise<{ name: string; data_url: string }> {
  let pdf: PDFDocument;
  switch (r.service_code) {
    case "character_certificate":
      pdf = await characterCertificate(r, values);
      break;
    case "transfer_certificate":
      pdf = await migrationCertificate(r, values);
      break;
    case "diploma_certificate":
      pdf = await awardCertificate(r, values, "diploma");
      break;
    case "provisional_degree":
      pdf = await awardCertificate(r, values, "provisional");
      break;
    case "bonafide":
      pdf = await letterCertificate(r, values, "bonafide");
      break;
    case "medium_certificate":
      pdf = await letterCertificate(r, values, "medium");
      break;
    default:
      throw new Error("No certificate template for this service.");
  }
  const data_url = await pdf.saveAsBase64({ dataUri: true });
  return { name: `KMCLU-${r.service_code}-${r.enrollment_no}.pdf`, data_url };
}
