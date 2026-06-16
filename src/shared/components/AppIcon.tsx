import React from "react";
import Svg, { Circle, Line, Path, Polygon, Polyline, Rect } from "react-native-svg";
import type { IconDefinition, IconElementDefinition } from "../../icons/types";

type AppIconProps = {
  definition: IconDefinition;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

export function AppIcon({
  definition,
  size = 24,
  color = "currentColor",
  strokeWidth = 1.75,
}: AppIconProps): React.JSX.Element {
  const [minX, minY, viewWidth, viewHeight] = (definition.viewBox ?? "0 0 24 24").split(" ").map(Number);

  return (
    <Svg
      width={size}
      height={size}
      viewBox={`${minX} ${minY} ${viewWidth} ${viewHeight}`}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {definition.elements.map((element, index) => (
        <IconElement key={`${definition.name}-${index}`} element={element} />
      ))}
    </Svg>
  );
}

function IconElement({ element }: { element: IconElementDefinition }): React.JSX.Element {
  switch (element.tag) {
    case "circle":
      return <Circle {...element.attrs} />;
    case "line":
      return <Line {...element.attrs} />;
    case "path":
      return <Path {...element.attrs} />;
    case "polygon":
      return <Polygon {...element.attrs} />;
    case "polyline":
      return <Polyline {...element.attrs} />;
    case "rect":
      return <Rect {...element.attrs} />;
    default:
      return <Path d="" />;
  }
}
