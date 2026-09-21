import React from "react";
import { BrandLoaderOverlay, RipplePulseMark } from "./brandLoaders";

const LoaderRipplePulse = ({ size = 52 }) => (
  <BrandLoaderOverlay>
    <RipplePulseMark size={size} />
  </BrandLoaderOverlay>
);

export default LoaderRipplePulse;
