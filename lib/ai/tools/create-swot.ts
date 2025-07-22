import { generateUUID } from "@/lib/utils";
import { put } from "@vercel/blob";
import { DataStreamWriter, tool } from "ai";

import { z } from "zod";
import PptxGenJS from "pptxgenjs";
import fs from "fs";
import { join } from "path";

interface CreateDocumentProps {
  dataStream: DataStreamWriter;
}

export const createSwot = ({ dataStream }: CreateDocumentProps) =>
  tool({
    description:
      "Use this tool only when the user has confirmed he wants to export the SWOT you generated. The tool result will appear in a component, no need to explicit the link",
    parameters: z.object({
      title: z.string(),
      strengths: z
        .array(
          z.string().max(70).describe("Summarize in maximum 70 characters")
        )
        .length(3)
        .describe("A list of 3 strengths you identified"),
      weaknesses: z
        .array(
          z.string().max(70).describe("Summarize in maximum 70 characters")
        )
        .length(3)
        .describe("A list of 3 weaknesses you identified"),
      opportunities: z
        .array(
          z.string().max(70).describe("Summarize in maximum 70 characters")
        )
        .length(3)
        .describe("A list of 3 opportunities you identified"),
      threats: z
        .array(
          z.string().max(70).describe("Summarize in maximum 70 characters")
        )
        .length(3)
        .describe("A list of 3 threats you identified"),
    }),
    execute: async ({
      title,
      strengths,
      weaknesses,
      opportunities,
      threats,
    }) => {
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

      const url = await generateSwotPptx({
        title,
        strengths,
        weaknesses,
        opportunities,
        threats,
      });
      console.log("URL", url);
      dataStream.writeData({ type: "finish", content: "" });
      return {
        id,
        title,
        url,
      };
    },
  });

export async function generateSwotPptx({
  title,
  strengths,
  weaknesses,
  opportunities,
  threats,
}: {
  title: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}) {
  try {
    const pptx = new PptxGenJS();

    // 16:9 layout (default)
    pptx.defineLayout({ name: "SWOT", width: 10, height: 5.625 });
    pptx.layout = "SWOT";

    const slide = pptx.addSlide();

    // 1) Top header: light blue banner
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: 8,
      h: 0.8,
      fill: { color: "B0C4DE" },
      line: { color: "B0C4DE" },
    });
    // Title text in header
    slide.addText(title, {
      x: 0.4,
      y: 0.2,
      w: 7.0,
      h: 0.4,
      fontSize: 18,
      bold: true,
      color: "000000",
      align: "left",
      fontFace: "Arial",
    });
    // Logo in header (upload logo.png to public/)
    slide.addImage({
      path: join(process.cwd(), "public", "logo.png"),
      x: 8.2,
      y: 0,
      w: 1.6,
      h: 0.8,
    });
    // 2) SWOT grid: two rows, two columns under header
    const grid = [
      { label: "Strengths", items: strengths, x: 0.4, y: 0.9 },
      { label: "Weaknesses", items: weaknesses, x: 5.1, y: 0.9 },
      { label: "Opportunities", items: opportunities, x: 0.4, y: 3.3 },
      { label: "Threats", items: threats, x: 5.1, y: 3.3 },
    ];
    const colW = 4.5;
    const rowH = 1.8;
    const headerH = 0.4;

    grid.forEach(({ label, items, x, y }) => {
      // Black header bar for each quadrant
      slide.addShape(pptx.ShapeType.rect, {
        x,
        y,
        w: colW,
        h: headerH,
        fill: { color: "000000" },
        line: { color: "000000" },
      });
      // Header label in white
      slide.addText(label, {
        x: x + 0.1,
        y: y + 0.05,
        w: colW - 0.2,
        h: headerH - 0.1,
        fontSize: 14,
        bold: true,
        color: "FFFFFF",
        align: "center",
        valign: "middle",
      });
      // White body box under header bar
      slide.addShape(pptx.ShapeType.rect, {
        x,
        y: y + headerH,
        w: colW,
        h: rowH,
        fill: { color: "FFFFFF" },
        line: { color: "000000" },
      });
      // Bullet list inside body box
      slide.addText(items.map((i) => `• ${i}`).join("\n"), {
        x: x + 0.15,
        y: y + headerH + 0.15,
        w: colW - 0.3,
        h: rowH - 0.3,
        fontSize: 12,
        color: "000000",
        align: "left",
        valign: "top",
      });
    });

    slide.addText(
      "Notes: currently Korefocus branded but can re-branded to meet client's existing corporate formats",
      {
        x: 0.4,
        y: 5.4,
        w: 9.2,
        h: 0.7,
        fontSize: 10,
        color: "000000",
        align: "left",
        fontFace: "Arial",
      }
    );

    const filename = `swot-${Date.now()}.pptx`;
    const outPath = join("/tmp", filename);

    await pptx.writeFile({ fileName: outPath });
    const buffer = fs.readFileSync(outPath);

    fs.writeFileSync(`/tmp/${filename}`, buffer);
    const blob = await put(filename, buffer, {
      access: "public",
      contentType:
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    });

    return blob.url;
  } catch (error) {
    return JSON.stringify(error, undefined, 2);
  }
}
