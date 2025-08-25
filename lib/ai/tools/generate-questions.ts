import { DataStreamWriter, tool } from "ai";
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
import { generateUUID } from "@/lib/utils";

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
interface CreateDocumentProps {
  dataStream: DataStreamWriter;
}

const questionsFromTemplate = [
  "What are the primary sources of revenue, and how stable and diversified are they?",
  "What differentiates your company from competitors, and how sustainable is this advantage?",
  "What are the biggest operational or strategic risks the company faces, and how are they being mitigated?",
];

export const generateQuestions = ({ dataStream }: CreateDocumentProps) =>
  tool({
    description:
      "Use this tool when the user asks for some due diligence questions. Only use the 6 questions in output for your response.",
    parameters: z.object({
      title: z.string(),

      generatedQuestions: z
        .array(z.string())
        .length(3)
        .describe("3 Questions related to the company"),
    }),

    execute: async ({ title, generatedQuestions }) => {
      const id = generateUUID();
      dataStream.writeData({
        type: "id",
        content: id,
      });

      dataStream.writeData({
        type: "title",
        content: title,
      });

      dataStream.writeData({
        type: "clear",
        content: "",
      });
      return {
        questionsFromTemplate,
        generatedQuestions,
      };
    },
  });
