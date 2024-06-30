import React, { useContext, useMemo, useState } from "react";
import { theatreContext } from "./theatreContext";
import { theatreComponentContext } from "./theatreComponentContext";

export function withTheatre<P>(componentId: string, Component: React.FC<P>) {
  return (props: P & { instanceId: string }) => {
    const { project } = useContext(theatreContext);

    const [sheet] = useState(() =>
      project.sheet(componentId, props.instanceId)
    );

    const contextValue = useMemo(() => ({ sheet }), [sheet]);

    return (
      <theatreComponentContext.Provider value={contextValue}>
        <Component {...props} />
      </theatreComponentContext.Provider>
    );
  };
}
