import { type DataStreamWriter, tool } from 'ai';
import { z } from 'zod';
import { generateUUID } from '@/lib/utils';

interface CreateDocumentProps {
  dataStream: DataStreamWriter;
}

export const generateQuestions = ({ dataStream }: CreateDocumentProps) =>
  tool({
    description: `
      Analyze the provided document and generate 6 total due diligence questions:
      - 3 questions selected from the template library 
      - 3 custom generated questions
      
      All questions must be relevant to the document content but cannot be directly answered by it.
      They should expose gaps, ambiguities, or missing details that require additional investigation.
      Cite the page or slide where the lack of information is observed.

      Available template questions by category:
      
      Financial & Unit Economics:
      ${questionsFromTemplate.financialAndUnitEconomics.map((q, i) => `${i + 1}. ${q}`).join('\n')}
      
      Technology & HR:
      ${questionsFromTemplate.technologyAndHR.map((q, i) => `${i + 1}. ${q}`).join('\n')}
      
      Legal, Compliance & Governance:
      ${questionsFromTemplate.legalComplianceAndGovernance.map((q, i) => `${i + 1}. ${q}`).join('\n')}

      ---
      Examples

      Example of a single question:
      What is the yearly growth rate?
      (ARR progression is graphically depicted, but no explicit annual growth percentage is indicated — slide 14.)

      Example of perfect output:
      Here are three relevant {category} questions from your library:
      1. <library question #1> (brief reason the info is missing — e.g., slide 7)
      2. <library question #2> (brief reason the info is missing — e.g., page 14)
      3. <library question #3> (brief reason the info is missing — e.g., appendix A, slide 24)

      I’ve also drafted three complementary questions:  

      4. <generated question #1> (brief reason the info is missing — e.g., slide 7)
      5. <generated question #2> (brief reason the info is missing — e.g., page 12)
      6. <generated question #3> (brief reason the info is missing — e.g., appendix A, slide 24)
    `,
    parameters: z.object({
      title: z.string(),
      selectedTemplateQuestions: z
        .array(
          z.object({
            question: z.string(),
            category: z.enum([
              'financialAndUnitEconomics',
              'technologyAndHR',
              'legalComplianceAndGovernance',
            ]),
            reasoning: z
              .string()
              .describe(
                'Why this template question is relevant but not answered in the document',
              ),
          }),
        )
        .length(3)
        .describe(
          '3 most relevant template questions that expose gaps in the document',
        ),
      generatedQuestions: z
        .array(
          z.object({
            question: z.string(),
            category: z.enum([
              'financialAndUnitEconomics',
              'technologyAndHR',
              'legalComplianceAndGovernance',
            ]),
            reasoning: z
              .string()
              .describe(
                'Why this custom question exposes missing information in the document',
              ),
          }),
        )
        .length(3)
        .describe(
          '3 additional custom questions where the answer is not addressed in the document',
        ),
    }),

    execute: async ({
      title,
      selectedTemplateQuestions,
      generatedQuestions,
    }) => {
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
        content: 'Analyzing document for relevant categories...',
        toolName: 'generateQuestions',
        progress: 15,
      });

      dataStream.writeData({
        type: 'title',
        content: title,
      });

      dataStream.writeData({
        type: 'tool-progress',
        content: 'Selecting most relevant template questions...',
        toolName: 'generateQuestions',
        progress: 40,
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Stream template questions
      selectedTemplateQuestions.forEach((questionObj, index) => {
        dataStream.writeData({
          type: 'question-generated',
          content: {
            question: questionObj.question,
            category: questionObj.category,
            reasoning: questionObj.reasoning,
          },
          questionIndex: index,
          questionType: 'template',
        });
      });

      dataStream.writeData({
        type: 'tool-progress',
        content: 'Generating custom questions for identified gaps...',
        toolName: 'generateQuestions',
        progress: 70,
      });

      await new Promise((resolve) => setTimeout(resolve, 150));

      // Stream generated questions
      generatedQuestions.forEach((questionObj, index) => {
        dataStream.writeData({
          type: 'question-generated',
          content: {
            question: questionObj.question,
            category: questionObj.category,
            reasoning: questionObj.reasoning,
          },
          questionIndex: index + selectedTemplateQuestions.length,
          questionType: 'custom',
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

      // Calculate category distribution
      const allQuestions = [
        ...selectedTemplateQuestions,
        ...generatedQuestions,
      ];
      const categoryDistribution = allQuestions.reduce(
        (acc, q) => {
          acc[q.category] = (acc[q.category] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      // Additional metadata for the frontend
      dataStream.writeData({
        type: 'questions-meta',
        content: JSON.stringify({
          categoryDistribution,
          templateCount: selectedTemplateQuestions.length,
          customCount: generatedQuestions.length,
          totalCount: allQuestions.length,
        }),
      });

      console.log('Selected template questions:', selectedTemplateQuestions);
      console.log('Generated custom questions:', generatedQuestions);

      return {
        questionsFromTemplate: selectedTemplateQuestions.map((q) => q.question),
        generatedQuestions: generatedQuestions.map((q) => ({
          question: q.question,
          category: q.category,
          reasoning: q.reasoning,
        })),
        allQuestions: allQuestions,
        metadata: {
          categoryDistribution,
          templateCount: selectedTemplateQuestions.length,
          customCount: generatedQuestions.length,
          totalQuestions: allQuestions.length,
          processingTime: Date.now(),
        },
      };
    },
  });

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
