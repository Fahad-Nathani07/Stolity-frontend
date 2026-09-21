import React from "react";
import { BrandLoaderOverlay, OrbitDotsMark } from "./brandLoaders";

const LoaderOrbitDots = ({ size = 48 }) => (
  <BrandLoaderOverlay>
    <OrbitDotsMark size={size} />
  </BrandLoaderOverlay>
);

export default LoaderOrbitDots;
