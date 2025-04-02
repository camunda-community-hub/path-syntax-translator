export function isElementRootScopeStartEvent(currentLine) {
  return (
    currentLine.interrupting &&
    (currentLine.eventDefinition == null ||
      currentLine.eventDefinition == "TimerEventDefinition" ||
      currentLine.eventDefinition == "MessageEventDefinition" ||
      currentLine.eventDefinition == "SignalEventDefinition" ||
      currentLine.eventDefinition == "ConditionalEventDefinition")
  );
}

export function isElementQuestion(line) {
  return line?.type == "question";
}

export function isElementAnswer(line) {
  return line?.type == "answer";
}

export function isElementActivity(line) {
  return line?.type == "activity";
}

export function isElementTask(line) {
  return line?.type == "activity" && line?.activityType != "SubProcess";
}

export function isElementSubprocess(line) {
  return (
    line?.type == "activity" &&
    line?.activityType == "SubProcess" &&
    !line?.triggeredByEvent
  );
}

export function isElementEventSubprocess(line) {
  return (
    line?.type == "activity" &&
    line?.activityType == "SubProcess" &&
    line?.triggeredByEvent
  );
}

export function isElementLinkCatchEvent(line) {
  return (
    line?.type == "event" &&
    line?.eventDefinition == "LinkEventDefinition" &&
    line?.interrupting
  );
}

export function isElementNoneStartEvent(line) {
  return (
    line?.type == "event" && line?.interrupting && line?.eventDefinition == null
  );
}

export function isElementEventSubprocessStartEvent(line) {
  return (
    line?.type == "event" &&
    line?.eventDefinition != "TerminateEventDefinition" &&
    line?.eventDefinition != "LinkEventDefinition"
  );
}

export function isElementIntermediateEvent(line) {
  return (
    line?.type == "event" &&
    line?.interrupting &&
    !line?.boundary &&
    line?.eventDefinition != "ErrorEventDefinition" &&
    line?.eventDefinition != "TerminateEventDefinition" &&
    line?.eventDefinition != "LinkEventDefinition"
  );
}

export function isElementEndEvent(line) {
  return (
    line?.type == "event" &&
    line?.interrupting &&
    !line?.boundary &&
    (line?.eventDefinition == null ||
      line?.eventDefinition == "MessageEventDefinition" ||
      line?.eventDefinition == "SignalEventDefinition" ||
      line?.eventDefinition == "ErrorEventDefinition" ||
      line?.eventDefinition == "EscalationEventDefinition" ||
      line?.eventDefinition == "CompensateEventDefinition" ||
      line?.eventDefinition == "TerminateEventDefinition" ||
      line?.eventDefinition == "LinkEventDefinition")
  );
}

export function isElementBoundaryEvent(line) {
  return line?.type == "event" && line?.boundary;
}

export function isElementSuitableForEventBasedGateway(line) {
  return (
    (line?.type == "event" &&
      !line?.boundary &&
      (line?.eventDefinition == "TimerEventDefinition" ||
        line?.eventDefinition == "MessageEventDefinition" ||
        line?.eventDefinition == "SignalEventDefinition" ||
        line?.eventDefinition == "ConditionalEventDefinition")) ||
    line?.activityType == "ReceiveTask"
  );
}

export function isScopeIncrease(currentLine, scopes) {
  return currentLine.scopeLevel > scopes.length - 1;
}

export function isBPMNElementOfType(element, type) {
  return element?.$type == "bpmn:" + type;
}

export function isBPMNElementSuitableForEventBasedGateway(element) {
  return (
    (element?.$type == "bpmn:IntermediateCatchEvent" &&
      (element.eventDefinitions[0].$type == "bpmn:TimerEventDefinition" ||
        element.eventDefinitions[0].$type == "bpmn:MessageEventDefinition" ||
        element.eventDefinitions[0].$type == "bpmn:SignalEventDefinition" ||
        element.eventDefinitions[0].$type ==
          "bpmn:ConditionalEventDefinition")) ||
    element?.$type == "bpmn:ReceiveTask"
  );
}
