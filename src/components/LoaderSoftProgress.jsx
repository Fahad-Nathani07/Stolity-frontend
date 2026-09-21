import React from "react";
import { BrandLoaderOverlay, SoftProgressMark } from "./brandLoaders";

const LoaderSoftProgress = ({ size = 56 }) => (
  <BrandLoaderOverlay>
    <SoftProgressMark size={size} />
  </BrandLoaderOverlay>
);

export default LoaderSoftProgress;
