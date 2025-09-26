import { z } from 'zod';

export function formatZodErrors(issues: z.ZodIssue[]) {
  return issues.map(issue => {
    let expected: unknown;
    let received: unknown;
    let options: string[] | undefined;

    if ('expected' in issue) expected = issue.expected;
    if ('received' in issue) received = issue.received;
    if ('options' in issue) options = issue.options as string[];
    if ('values' in issue) options = issue.values as string[];

    return {
      path: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
      expected,
      received,
      options,
    };
  });
}
