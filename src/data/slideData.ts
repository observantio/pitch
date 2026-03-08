import baseSlidesRaw from "./slides.json";
import understandDocsRaw from "./understand-docs.json";
import useDocsRaw from "./use-docs.json";

import type { SlideData, SlidesJson } from "./slideTypes";

const baseSlides = baseSlidesRaw as SlidesJson;
const understandDocs = understandDocsRaw as SlideData[];
const useDocs = useDocsRaw as SlideData[];

export const slidesJson: SlidesJson = {
  understand: baseSlides.understand,
  use: baseSlides.use,
  docs: [...understandDocs, ...useDocs],
};