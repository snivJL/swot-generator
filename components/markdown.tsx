import Link from "next/link";
import React, { memo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "./code-block";

const components: Partial<Components> = {
  // @ts-expect-error
  code: CodeBlock,
  pre: ({ children }) => <>{children}</>,
  ol: ({ node, children, ...props }) => {
    return (
      <ol className="list-decimal list-outside ml-4" {...props}>
        {children}
      </ol>
    );
  },
  li: ({ node, children, ...props }) => {
    return (
      <li className="py-1" {...props}>
        {children}
      </li>
    );
  },
  ul: ({ node, children, ...props }) => {
    return (
      <ul className="list-decimal list-outside ml-4" {...props}>
        {children}
      </ul>
    );
  },
  strong: ({ node, children, ...props }) => {
    return (
      <span className="font-semibold" {...props}>
        {children}
      </span>
    );
  },
  a: ({ node, children, ...props }) => {
    return (
      // @ts-expect-error
      <Link
        className="text-blue-500 hover:underline"
        target="_blank"
        rel="noreferrer"
        {...props}
      >
        {children}
      </Link>
    );
  },
  h1: ({ node, children, ...props }) => {
    return (
      <h1 className="text-3xl font-semibold mt-6 mb-2" {...props}>
        {children}
      </h1>
    );
  },
  h2: ({ node, children, ...props }) => {
    return (
      <h2 className="text-2xl font-semibold mt-6 mb-2" {...props}>
        {children}
      </h2>
    );
  },
  h3: ({ node, children, ...props }) => {
    return (
      <h3 className="text-xl font-semibold mt-6 mb-2" {...props}>
        {children}
      </h3>
    );
  },
  h4: ({ node, children, ...props }) => {
    return (
      <h4 className="text-lg font-semibold mt-6 mb-2" {...props}>
        {children}
      </h4>
    );
  },
  h5: ({ node, children, ...props }) => {
    return (
      <h5 className="text-base font-semibold mt-6 mb-2" {...props}>
        {children}
      </h5>
    );
  },
  h6: ({ node, children, ...props }) => {
    return (
      <h6 className="text-sm font-semibold mt-6 mb-2" {...props}>
        {children}
      </h6>
    );
  },
  hr: ({ node, ...props }) => {
    return (
      <hr
        className="my-8 border-0 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent"
        {...props}
      />
    );
  },

  // Enhanced tables
  table: ({ node, children, ...props }) => {
    return (
      <div className="overflow-x-auto my-6">
        <table
          className="min-w-full border-collapse border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden shadow-sm"
          {...props}
        >
          {children}
        </table>
      </div>
    );
  },

  thead: ({ node, children, ...props }) => {
    return (
      <thead className="bg-gray-50 dark:bg-gray-800" {...props}>
        {children}
      </thead>
    );
  },

  tbody: ({ node, children, ...props }) => {
    return (
      <tbody
        className="divide-y divide-gray-200 dark:divide-gray-700"
        {...props}
      >
        {children}
      </tbody>
    );
  },

  tr: ({ node, children, ...props }) => {
    return (
      <tr
        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150"
        {...props}
      >
        {children}
      </tr>
    );
  },

  th: ({ node, children, ...props }) => {
    return (
      <th
        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600"
        {...props}
      >
        {children}
      </th>
    );
  },

  td: ({ node, children, ...props }) => {
    return (
      <td
        className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600"
        {...props}
      >
        {children}
      </td>
    );
  },

  // Task list items (GitHub-style checkboxes)
  input: ({ node, ...props }) => {
    return (
      <input
        className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
        disabled
        {...props}
      />
    );
  },
};

const remarkPlugins = [remarkGfm];

const NonMemoizedMarkdown = ({ children }: { children: string }) => {
  return (
    <ReactMarkdown remarkPlugins={remarkPlugins} components={components}>
      {children}
    </ReactMarkdown>
  );
};

export const Markdown = memo(
  NonMemoizedMarkdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children
);
