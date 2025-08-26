import { type DataStreamWriter, tool } from 'ai';
import { z } from 'zod';
import { generateUUID } from '@/lib/utils';

interface CreateDocumentProps {
  dataStream: DataStreamWriter;
}

export const questionsFromTemplate = {
  financialAndUnitEconomics: [
    'What are the primary revenue streams, and how concentrated are revenues by customer, product, and geography?',
    'What drives gross margin and unit economics, and how sensitive are they to pricing or input-cost changes?',
    'What is the cash conversion cycle and working-capital requirement, and what capex is needed to sustain growth?',
  ],
  marketCustomersAndGrowth: [
    "What is the realistic TAM/SAM/SOM and the company's current share and growth rate?",
    'How are customers acquired and retained—what are CAC, payback period, LTV, and churn/retention?',
    'What does the next 12–24 months of pipeline and expansion (products/geographies/segments) look like, and how accurate are forecasts?',
  ],
  operationsTechnologyAndPeople: [
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
      'Use this tool when the user asks for some due diligence questions. Only use the 6 questions in output for your response.',
    parameters: z.object({
      title: z.string(),
      category: z.enum([
        'financialAndUnitEconomics',
        'marketCustomersAndGrowth',
        'operationsTechnologyAndPeople',
        'legalComplianceAndGovernance',
      ]),
      generatedQuestions: z
        .array(z.string())
        .length(3)
        .describe('3 Questions related to the company'),
    }),

    execute: async ({ title, category, generatedQuestions }) => {
      const id = generateUUID();

      // Send progressive updates during execution
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

      // Simulate some processing time to show progress
      await new Promise((resolve) => setTimeout(resolve, 100));

      dataStream.writeData({
        type: 'tool-progress',
        content: 'Selecting template questions...',
        toolName: 'generateQuestions',
        progress: 75,
      });

      const templateQuestions = questionsFromTemplate[category];

      // Stream each question as it's "generated" for better UX
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
