import BpmnModeler from "bpmn-js/lib/Modeler";
import TouchModule from "diagram-js/lib/navigation/zoomscroll";
import MoveCanvasModule from "diagram-js/lib/navigation/movecanvas";
import KeyboardMoveModule from "diagram-js/lib/navigation/keyboard-move";
// import BpmnViewer from "bpmn-js/lib/NavigatedViewer";
import ElementTemplateIconRenderer from "@bpmn-io/element-template-icon-renderer";
// import TokenSimulationModule from "bpmn-js-token-simulation/lib/viewer";
import "bpmn-js-token-simulation/assets/css/bpmn-js-token-simulation.css";
import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn-codes.css";

import { useEffect, useRef } from "react";

// eslint-disable-next-line react/prop-types
export function BPMNViewer({ bpmnXML }) {
  const containerRef = useRef();

  useEffect(() => {
    if (bpmnXML) {
      const container = containerRef.current;

      let bpmnViewer = new BpmnModeler({
        container,
        additionalModules: [
          ElementTemplateIconRenderer,
          //   TokenSimulationModule,
          TouchModule,
          MoveCanvasModule,
          KeyboardMoveModule,
        ],
      });

      bpmnViewer.importXML(bpmnXML);

      bpmnViewer.on("import.done", () => {
        bpmnViewer.get("canvas").zoom("fit-viewport");
        // bpmnViewer.get("zoomScroll").stepZoom(-0.1);
        bpmnViewer.get("zoomScroll").scroll({ dx: 80, dy: 80 });
      });
    }
  }, [bpmnXML]);

  return <div className="react-bpmn-container" ref={containerRef}></div>;
}
