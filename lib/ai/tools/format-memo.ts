import { type DataStreamWriter, tool } from 'ai';
import { z } from 'zod';

interface FormatMemoProps {
  dataStream: DataStreamWriter;
}
const QUESTION_MAX = 80;
export const Question = z
  .string()
  .trim()
  .max(
    QUESTION_MAX,
    `Each question must be ${QUESTION_MAX} characters or fewer.`,
  );

export const dueDiligenceQuestions = ({ dataStream }: FormatMemoProps) =>
  tool({
    description: `Use this tool when the user asks to write an INITIAL due-diligence request or when NO CATEGORY is specified.
      Do NOT use this tool if the user requests due-diligence questions for a specific category such as "Financial & Commercial", "Legal, Compliance & Governance", or "Technology & HR" (use generateQuestions instead).
       All questions must be relevant to the document content but cannot be directly answered by it.
      They should expose gaps, ambiguities, or missing details that require additional investigation.
      Cite the page where the lack of information is observed.
      Trigger examples (use this tool):
        - "Write an initial due-diligence request"
        - "Write a due-diligence request" (no category)
      Non-trigger examples (do NOT use this tool):
        - "Write Financial & Commercial due-diligence request"
        - "Write a Legal, Compliance & Governance due-diligence request"
        - "Write a Technology & HR due-diligence request"
      <example>
        What is the yearly growth rate?
        (ARR progression is graphically depicted, but no explicit annual growth percentage is indicated – page 14.)  
      </example>   
      ONLY output this in your final answer, do not add "Thank you for this information" or anything similar`,
    parameters: z.object({
      businessModel: z
        .array(Question)
        .length(3)
        .describe('3 Questions related to Business Model'),
      marketOpportunity: z
        .array(Question)
        .length(3)
        .describe('3 Questions related to Market Opportunity'),
      financialHealth: z
        .array(Question)
        .length(3)
        .describe('3 Questions related to Financial Health'),
      leadershipTeam: z
        .array(Question)
        .length(3)
        .describe('3 Questions related to Leadership Team'),
      risksAndChallenges: z
        .array(Question)
        .length(3)
        .describe('3 Questions related to Risks & Challenges'),
    }),
    // Insert questions into the template.
    execute: async ({
      businessModel,
      marketOpportunity,
      financialHealth,
      leadershipTeam,
      risksAndChallenges,
    }: {
      businessModel: string[];
      marketOpportunity: string[];
      financialHealth: string[];
      leadershipTeam: string[];
      risksAndChallenges: string[];
    }) => {
      const clean = (s: string) => s.replace(/\s+/g, ' ').trim();

      const fmt = (qs: string[]) =>
        qs.map((q, i) => `${i + 1}. ${clean(q)}`).join('\n');

      const output = [
        '## Initial due-diligence request',
        '',
        '### A. Business Model',
        fmt(businessModel),
        '',
        '### B. Market Opportunity',
        fmt(marketOpportunity),
        '',
        '### C. Financial Health',
        fmt(financialHealth),
        '',
        '### D. Leadership Team',
        fmt(leadershipTeam),
        '',
        '### E. Risks & Challenges',
        fmt(risksAndChallenges),
        '',
      ].join('\n');

      return output.trimEnd();
    },
  });
