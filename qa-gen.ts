import { generateCertificate } from "/dev-server/src/lib/certificates";
import { writeFileSync } from "fs";
const base: any = {
  id:"1", full_name:"Vipul Kumar Yadav", enrollment_no:"A-5167", roll_no:"2009054",
  course_name:"B.Tech. Computer Science and Engineering Artificial Intelligence and Machine Learning",
  dob:"2001-01-01", documents:[], history:[], stages:[], status:"pending",
};
const v = { serial_no:"128", issue_date:"2026-08-07", father_name:"Sanjay Nath Yadav", semester:"Eighth", session:"2023-24", division:"First Division", academic_year:"2021-2024", fee_amount:"26650" };
for (const code of ["character_certificate","transfer_certificate","diploma_certificate","provisional_degree","bonafide","medium_certificate"]) {
  const r = { ...base, service_code: code };
  const out = await generateCertificate(r, v as any);
  writeFileSync(`/tmp/qa/${code}.pdf`, Buffer.from(out.data_url.split(",")[1], "base64"));
}
console.log("ok");
