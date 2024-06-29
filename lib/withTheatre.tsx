import React, { useContext, useState } from "react";
import { theatreContext } from "./theatreContext";
import { theatreComponentContext } from "./theatreComponentContext";

export function withTheatre<P>(componentId: string, Component: React.FC<P>) {
  return (props: P & { instanceId: string }) => {
    const { project } = useContext(theatreContext);

    const [sheet] = useState(() =>
      project.sheet(componentId, props.instanceId)
    );

    return (
      <theatreComponentContext.Provider value={{ sheet }}>
        <Component {...props} />
      </theatreComponentContext.Provider>
    );
  };
}
