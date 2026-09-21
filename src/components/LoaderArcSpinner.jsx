import React from "react";
import { BrandLoaderOverlay, ArcSpinnerMark } from "./brandLoaders";

const LoaderArcSpinner = ({ size = 44 }) => (
  <BrandLoaderOverlay>
    <ArcSpinnerMark size={size} />
  </BrandLoaderOverlay>
);

export default LoaderArcSpinner;
