declare module "scratchblocks" {
  type ScratchDoc = unknown;
  const scratchblocks: {
    parse(code: string, options?: { languages?: string[] }): ScratchDoc;
    render(doc: ScratchDoc, options: { style: string; scale?: number }): SVGElement;
    renderMatching(selector: string, options?: { style?: string; scale?: number }): void;
    appendStyles(): void;
  };
  export default scratchblocks;
}
