import { useContext } from "react";
import { theatreComponentContext } from "./theatreComponentContext";

export function useControls() {
  const { sheet } = useContext(theatreComponentContext);

  return sheet.sequence;
}
