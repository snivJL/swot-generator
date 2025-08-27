import { type DataStreamWriter, tool } from 'ai';
import { z } from 'zod';
import { generateUUID } from '@/lib/utils';

interface CreateDocumentProps {
  dataStream: DataStreamWriter;
}

export const questionsFromTemplate = {
  financialAndUnitEconomics: [
    'What is the revenue split by geography?',
    'What is the revenue concentration by client?',
    'What is the revenue split by product?',
    'What is the account retention rate?',
    'What is the average revenue per client?',
    'What is the net revenue retention?',
    'What is the yearly growth rate?',
    'What was the yearly revenue for the last five years?',
    'What was EBITDA for the last five years?',
    'What was the market growth rate over the last five years?',
    'How many potential clients are there?',
    'What is the free cash flow?',
    'What is the working capital?',
  ],
  technologyAndHR: [
    'What are the critical operational processes and capacity constraints, and how will they scale with demand?',
    'What single points of failure exist in the supply chain, vendors, or infrastructure, and what are the continuity plans?',
    'What is the current tech stack and IP ownership status, and how are security, data protection, and key-person risks managed?',
  ],
  legalComplianceAndGovernance: [
    'Which material contracts and obligations (customers, suppliers, leases, debt) could be impacted by a change of control?',
    'What regulatory and licensing requirements apply, and what is the current compliance posture (e.g., data privacy, industry standards)?',
    'What pending or historical litigation, claims, or contingent liabilities exist, and how is governance structured at the board and management levels?',
  ],
} as const;

export const generateQuestions = ({ dataStream }: CreateDocumentProps) =>
  tool({
    description:
      'Use this tool when the user asks for due diligence questions with the following categories: Financial & Commercial, Technology & HR, Legal, Compliance & Governance. Only use the 6 questions in output for your response.',
    parameters: z.object({
      title: z.string(),
      category: z.enum([
        'financialAndUnitEconomics',
        'technologyAndHR',
        'legalComplianceAndGovernance',
      ]),
      generatedQuestions: z
        .array(z.string())
        .length(3)
        .describe(
          '3 additional concise questions where the answer is not addressed in the attachment',
        ),
    }),

    execute: async ({ title, category, generatedQuestions }) => {
      const id = generateUUID();

      dataStream.writeData({
        type: 'tool-progress',
        content: 'Setting up question framework...',
        toolName: 'generateQuestions',
        progress: 0,
      });

      dataStream.writeData({
        type: 'id',
        content: id,
      });

      dataStream.writeData({
        type: 'tool-progress',
        content: `Analyzing ${category
          .replace(/([A-Z])/g, ' $1')
          .toLowerCase()
          .trim()} category...`,
        toolName: 'generateQuestions',
        progress: 25,
      });

      dataStream.writeData({
        type: 'title',
        content: title,
      });

      dataStream.writeData({
        type: 'tool-progress',
        content: 'Generating custom questions...',
        toolName: 'generateQuestions',
        progress: 50,
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      dataStream.writeData({
        type: 'tool-progress',
        content: 'Selecting template questions...',
        toolName: 'generateQuestions',
        progress: 75,
      });

      const templateQuestions = questionsFromTemplate[category];

      generatedQuestions.forEach((question, index) => {
        dataStream.writeData({
          type: 'question-generated',
          content: question,
          questionIndex: index,
          questionType: 'custom',
        });
      });

      templateQuestions.forEach((question, index) => {
        dataStream.writeData({
          type: 'question-generated',
          content: question,
          questionIndex: index + generatedQuestions.length,
          questionType: 'template',
        });
      });

      dataStream.writeData({
        type: 'tool-progress',
        content: 'Questions ready!',
        toolName: 'generateQuestions',
        progress: 100,
      });

      dataStream.writeData({
        type: 'clear',
        content: '',
      });

      // Additional metadata for the frontend
      dataStream.writeData({
        type: 'questions-meta',
        content: JSON.stringify({
          category,
          customCount: generatedQuestions.length,
          templateCount: templateQuestions.length,
          totalCount: generatedQuestions.length + templateQuestions.length,
        }),
      });

      return {
        questionsFromTemplate: templateQuestions,
        generatedQuestions,
        metadata: {
          category,
          totalQuestions: generatedQuestions.length + templateQuestions.length,
          processingTime: Date.now(), // For potential analytics
        },
      };
    },
  });

export const generateTemplateQuestions = ({
  dataStream,
}: CreateDocumentProps) =>
  tool({
    description:
      'Use this tool to get 3 due diligence questions from the client library with the following categories: Financial & Commercial, Technology & HR, Legal, Compliance & Governance. Only use the 3 questions in output for your response.',
    parameters: z.object({
      title: z.string(),
      category: z.enum([
        'financialAndUnitEconomics',
        'technologyAndHR',
        'legalComplianceAndGovernance',
      ]),
      generatedQuestions: z
        .array(z.string())
        .length(3)
        .describe(
          '3 additional concise questions where the answer is not addressed in the attachment',
        ),
    }),

    execute: async ({ title, category, generatedQuestions }) => {
      const id = generateUUID();

      dataStream.writeData({
        type: 'tool-progress',
        content: 'Setting up question framework...',
        toolName: 'generateQuestions',
        progress: 0,
      });

      dataStream.writeData({
        type: 'id',
        content: id,
      });

      dataStream.writeData({
        type: 'tool-progress',
        content: `Analyzing ${category
          .replace(/([A-Z])/g, ' $1')
          .toLowerCase()
          .trim()} category...`,
        toolName: 'generateQuestions',
        progress: 25,
      });

      dataStream.writeData({
        type: 'title',
        content: title,
      });

      dataStream.writeData({
        type: 'tool-progress',
        content: 'Generating custom questions...',
        toolName: 'generateQuestions',
        progress: 50,
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      dataStream.writeData({
        type: 'tool-progress',
        content: 'Selecting template questions...',
        toolName: 'generateQuestions',
        progress: 75,
      });

      const templateQuestions = questionsFromTemplate[category];

      generatedQuestions.forEach((question, index) => {
        dataStream.writeData({
          type: 'question-generated',
          content: question,
          questionIndex: index,
          questionType: 'custom',
        });
      });

      templateQuestions.forEach((question, index) => {
        dataStream.writeData({
          type: 'question-generated',
          content: question,
          questionIndex: index + generatedQuestions.length,
          questionType: 'template',
        });
      });

      dataStream.writeData({
        type: 'tool-progress',
        content: 'Questions ready!',
        toolName: 'generateQuestions',
        progress: 100,
      });

      dataStream.writeData({
        type: 'clear',
        content: '',
      });

      // Additional metadata for the frontend
      dataStream.writeData({
        type: 'questions-meta',
        content: JSON.stringify({
          category,
          customCount: generatedQuestions.length,
          templateCount: templateQuestions.length,
          totalCount: generatedQuestions.length + templateQuestions.length,
        }),
      });

      return {
        questionsFromTemplate: templateQuestions,
        generatedQuestions,
        metadata: {
          category,
          totalQuestions: generatedQuestions.length + templateQuestions.length,
          processingTime: Date.now(), // For potential analytics
        },
      };
    },
  });
