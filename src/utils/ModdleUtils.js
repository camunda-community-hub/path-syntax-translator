import BPMNModdle from "bpmn-moddle";
import { v4 as uuidv4 } from "uuid";

let moddle = new BPMNModdle();

export function createTask(
  id,
  descriptor,
  name,
  loopCharacteristic,
  isCompensation
) {
  return moddle.create("bpmn:" + descriptor, {
    id: "Activity_" + uuidv4() + (id != null ? id : ""),
    name: name,
    loopCharacteristics: loopCharacteristic
      ? moddle.create("bpmn:MultiInstanceLoopCharacteristics", {
          isSequential: loopCharacteristic == "sequential",
        })
      : null,
    incoming: [],
    outgoing: [],
    isForCompensation: isCompensation,
  });
}

export function createSubprocess(id, name, loopCharacteristic, isCompensation) {
  return moddle.create("bpmn:SubProcess", {
    id: "Activity_" + uuidv4() + (id != null ? id : ""),
    name: name,
    loopCharacteristics: loopCharacteristic
      ? [
          moddle.create("bpmn:MultiInstanceLoopCharacteristics"),
          {
            isSequential: loopCharacteristic == "sequential" ? true : false,
          },
        ]
      : null,
    incoming: [],
    outgoing: [],
    flowElements: [],
    isForCompensation: isCompensation,
  });
}

export function createEventSubprocess(id, name) {
  return moddle.create("bpmn:SubProcess", {
    id: "Activity_" + uuidv4() + (id != null ? id : ""),
    name: name,
    triggeredByEvent: true,
    flowElements: [],
  });
}

export function createStartEvent(id, name, eventDefinition, isInterrupting) {
  return moddle.create("bpmn:StartEvent", {
    id: "Event_" + uuidv4() + (id != null ? id : ""),
    name,
    eventDefinitions: eventDefinition
      ? [
          moddle.create("bpmn:" + eventDefinition, {
            id: eventDefinition + "_" + uuidv4(),
          }),
        ]
      : [],
    isInterrupting,
    outgoing: [],
  });
}

export function createIntermediateCatchEvent(id, name, eventDefinition) {
  return moddle.create("bpmn:IntermediateCatchEvent", {
    id: "Event_" + uuidv4() + (id != null ? id : ""),
    name,
    eventDefinitions: eventDefinition
      ? [
          moddle.create("bpmn:" + eventDefinition, {
            id: eventDefinition + "_" + uuidv4(),
          }),
        ]
      : [],
    incoming: [],
    outgoing: [],
  });
}

export function createIntermediateThrowEvent(id, name, eventDefinition) {
  return moddle.create("bpmn:IntermediateThrowEvent", {
    id: "Event_" + uuidv4() + (id != null ? id : ""),
    name,
    eventDefinitions: eventDefinition
      ? [
          moddle.create("bpmn:" + eventDefinition, {
            id: eventDefinition + "_" + uuidv4(),
          }),
        ]
      : [],
    incoming: [],
    outgoing: [],
  });
}

export function createEndEvent(id, name, eventDefinition) {
  return moddle.create("bpmn:EndEvent", {
    id: "Event_" + uuidv4() + (id != null ? id : ""),
    name,
    eventDefinitions: eventDefinition
      ? [
          moddle.create("bpmn:" + eventDefinition, {
            id: eventDefinition + "_" + uuidv4(),
          }),
        ]
      : [],
    incoming: [],
  });
}

export function createBoundaryEvent(
  id,
  name,
  eventDefinition,
  interrupting,
  prevElement
) {
  return moddle.create("bpmn:BoundaryEvent", {
    id: "Event_" + uuidv4() + (id != null ? id : ""),
    name,
    eventDefinitions: eventDefinition
      ? [
          moddle.create("bpmn:" + eventDefinition, {
            id: eventDefinition + "_" + uuidv4(),
          }),
        ]
      : [],
    attachedToRef: prevElement,
    cancelActivity: interrupting, //#cancelMerz
    outgoing: [],
  });
}

export function createOutgoingSequenceFlow(element, name) {
  return moddle.create("bpmn:SequenceFlow", {
    id: "SequenceFlow_" + uuidv4(),
    name,
    sourceRef: element,
  });
}

export function createSequenceFlow(prevElement, element) {
  return moddle.create("bpmn:SequenceFlow", {
    id: "SequenceFlow_" + uuidv4(),
    sourceRef: prevElement,
    targetRef: element,
  });
}

export function createOutgoingAssociation(element, name) {
  return moddle.create("bpmn:Association", {
    id: "Association_" + uuidv4(),
    name,
    sourceRef: element,
    associationDirection: "One",
  });
}

export function createGateway(id, descriptor, name) {
  return moddle.create("bpmn:" + descriptor, {
    id: "Gateway_" + uuidv4() + (id != null ? id : ""),
    name,
    incoming: [],
    outgoing: [],
  });
}

export function createProcess() {
  return moddle.create("bpmn:Process", {
    id: "MyProcess_1",
    flowElements: [],
  });
}

export async function createRootElement() {
  const xmlStr =
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn"></bpmn:definitions>';

  const { rootElement } = await moddle.fromXML(xmlStr);
  return rootElement;
}

export async function createXML(rootElement) {
  const { xml: updatedXML } = await moddle.toXML(rootElement, {
    format: true,
  });
  return updatedXML;
}
