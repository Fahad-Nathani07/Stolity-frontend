import React from "react";
import { BrandLoaderOverlay, DualRingMark } from "./brandLoaders";

const LoaderDualRing = ({ size = 48 }) => (
  <BrandLoaderOverlay>
    <DualRingMark size={size} />
  </BrandLoaderOverlay>
);

export default LoaderDualRing;
