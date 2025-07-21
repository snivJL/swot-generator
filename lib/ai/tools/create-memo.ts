import { tool } from "ai";
import { z } from "zod";
import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  Header,
  TextRun,
  ImageRun,
} from "docx";
import fs from "fs";
import { join } from "path";
import { put } from "@vercel/blob";

// Helper to generate the DOCX and return a Buffer
async function generateMemoDocx(
  title: string,
  sections: {
    heading: string;
    questions: string[];
  }[]
): Promise<Buffer> {
  const logoPath = join(process.cwd(), "public", "logo.png");
  const logoBuffer = fs.readFileSync(logoPath);

  const doc = new Document({
    title,
    numbering: {
      config: [
        {
          reference: "questions",
          levels: [
            {
              level: 0,
              format: "decimal",
              text: "%1.",
              alignment: "left",
            },
          ],
        },
      ],
    },
    sections: [
      {
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun(""),
                  new ImageRun({
                    data: logoBuffer,
                    transformation: { width: 100, height: 48 },
                    type: "png",
                  }),
                ],
                // push image to the right
                alignment: "right",
              }),
            ],
          }),
        },
        properties: {},
        children: sections.flatMap(({ heading, questions }) => {
          // Section title
          const headingPara = new Paragraph({
            text: heading,
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 200 },
          });
          // Numbered questions
          const listParas = questions.map(
            (q) =>
              new Paragraph({
                text: q,
                numbering: { reference: "questions", level: 0 },
                spacing: { after: 100 },
              })
          );
          // add a bit of space before next section
          const spacer = new Paragraph({ text: "" });
          return [headingPara, ...listParas, spacer];
        }),
      },
    ],
  });

  // Pack and return Buffer
  return Buffer.from(await Packer.toBuffer(doc));
}

export const createMemo = tool({
  description:
    "Use this tool when the user asks to generate due diligence follow-up questions to get the desired output format",
  parameters: z.object({
    title: z.string(),
    businessModel: z
      .array(z.string())
      .length(4)
      .describe("4 Questions related to Business Model"),
    marketOpportunity: z
      .array(z.string())
      .length(4)
      .describe("4 Questions related to Market Opportunity"),
    financialHealth: z
      .array(z.string())
      .length(4)
      .describe("4 Questions related to Financial Health"),
    leadershipTeam: z
      .array(z.string())
      .length(4)
      .describe("4 Questions related to Leadership Team"),
    risksAndChallenges: z
      .array(z.string())
      .length(4)
      .describe("4 Questions related to Risks & Challenges"),
  }),
  execute: async ({
    title,
    businessModel,
    marketOpportunity,
    financialHealth,
    leadershipTeam,
    risksAndChallenges,
  }) => {
    // 1) Build an ordered list of sections
    const sections = [
      { heading: "A. Business Model", questions: businessModel },
      { heading: "B. Market Opportunity", questions: marketOpportunity },
      { heading: "C. Financial Health", questions: financialHealth },
      { heading: "D. Leadership Team", questions: leadershipTeam },
      { heading: "E. Risks & Challenges", questions: risksAndChallenges },
    ];

    // 2) Generate docx buffer
    const buffer = await generateMemoDocx(title, sections);

    // 3) Write to temp file
    const filename = `due-diligence-questions-${Date.now()}.docx`;
    const outPath = join("/tmp", filename);
    fs.writeFileSync(outPath, buffer);

    // 4) Upload to Vercel Blob
    const blob = await put(filename, buffer, {
      access: "public",
      contentType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    // 5) Return the URL
    return blob.url;
  },
});
