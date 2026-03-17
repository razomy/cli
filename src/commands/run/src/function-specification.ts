export interface FunctionSpecification {
  description: string;
  examples: { code: string; expected: string; }[];
  name: string;
  parameters: { description: string; name: string; type: string; }[];
  performance: { history: never[]; memoryDataSizeComplexityFn: string; timeDataSizeComplexityFn: string; };
  returns: { description: string; type: string; };
  title: string;
}
