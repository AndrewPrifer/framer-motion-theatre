import { useContext } from "react";
import { theatreContext } from "./theatreContext";

export function useTheatre() {
  const { project, studio } = useContext(theatreContext);

  return { project, studio };
}
