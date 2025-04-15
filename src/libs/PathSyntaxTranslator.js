import { layoutProcess } from "bpmn-auto-layout";
import {
	isBPMNElementOfType,
	isBPMNElementSuitableForEventBasedGateway,
	isElementActivity,
	isElementAnswer,
	isElementBoundaryEvent,
	isElementEndEvent,
	isElementEventSubprocess,
	isElementEventSubprocessStartEvent,
	isElementIntermediateEvent,
	isElementLinkCatchEvent,
	isElementNoneStartEvent,
	isElementQuestion,
	isElementRootScopeStartEvent,
	isElementSubprocess,
	isElementSuitableForEventBasedGateway,
	isElementTask,
	isScopeIncrease,
} from "../utils/ElementUtils";
import {
	createBoundaryEvent,
	createEndEvent,
	createEventSubprocess,
	createGateway,
	createIntermediateCatchEvent,
	createIntermediateThrowEvent,
	createOutgoingAssociation,
	createOutgoingSequenceFlow,
	createProcess,
	createRootElement,
	createSequenceFlow,
	createStartEvent,
	createSubprocess,
	createTask,
	createXML,
} from "../utils/ModdleUtils";
import {
	hasLineGatewayType,
	isLineEmpty,
	isLineFragmentBorder,
	isLineKnot,
	isPositionClosedEndOfFragment,
	isPositionClosedStartOfFragmentWithoutScopeChange,
	isPositionRootScopeClosedStartOfFragmentWithoutScopeChange,
	isPositionStartOfEventSubprocess,
	isPositionStartOfSubprocess,
	isPositionWithinFragment,
	isPositionWithinFragmentWithScopeChange,
	isScopeDecrease,
} from "../utils/PositionUtils";
import { interpretSyntax } from "../utils/SyntaxUtils";

function ensureSequenceFlow(prevElement, prevSequenceFlow, target) {
	let sequenceFlow;
	if (prevSequenceFlow != null) {
		prevSequenceFlow.targetRef = target;
		sequenceFlow = prevSequenceFlow;
	} else {
		sequenceFlow = createSequenceFlow(prevElement, target);
		prevElement.outgoing.push(sequenceFlow);
	}
	return sequenceFlow;
}

export default async function generateXML(syntax) {
	const rootElement = await createRootElement();
	const bpmnProcess = createProcess();

	const interpretation = interpretSyntax(syntax);
	console.log(interpretation);

	let prevElement = null;
	let prevSequenceFlow = null;
	let isCompensation = false;
	let scopes = [bpmnProcess];
	let openKnots = [];

	for (let i = 0; i < interpretation.length; i++) {
		const prevPrevLine =
			typeof interpretation[i - 2] !== "undefined"
				? interpretation[i - 2]
				: null;
		const prevLine =
			typeof interpretation[i - 1] !== "undefined"
				? interpretation[i - 1]
				: null;
		const currentLine = interpretation[i];
		const nextLine =
			typeof interpretation[i + 1] !== "undefined"
				? interpretation[i + 1]
				: null;
		let scopeShifted = false;

		if (isScopeIncrease(currentLine, scopes)) {
			// handle scope change
			if (!isBPMNElementOfType(prevElement, "SubProcess")) {
				alert("Scope change failed!");
				break;
			}
			scopes.unshift(prevElement);
			//Staicy war hier - ich liebe dich!
		}

		if (isScopeDecrease(prevLine, currentLine)) {
			const scopesToShift = scopes.length - currentLine.scopeLevel - 1;
			let newScope;
			for (let i = 0; i < scopesToShift; i++) {
				newScope = scopes.shift();
			}
			prevElement = newScope;
			scopeShifted = true;
			console.log(prevElement);
		}

		if (isLineEmpty(currentLine) || isLineFragmentBorder(currentLine)) {
			console.log(currentLine);
			// nothing to do
			continue;
		}

		if (isLineFragmentBorder(prevLine) && !scopeShifted) {
			console.log(currentLine);
			// search for existing element and set as prevElement
			prevElement =
				currentLine.id != null
					? scopes[0].flowElements.find((el) =>
							el.id.endsWith(currentLine.id)
					  )
					: scopes[0].flowElements.find(
							(el) => el.name == currentLine.value
					  );
			console.log(prevElement);
			continue;
		}

		if (
			isLineKnot(currentLine) &&
			(nextLine == null || isLineEmpty(nextLine)) &&
			!openKnots.some((el) => el.id == currentLine.id)
		) {
			console.log(currentLine);
			openKnots.push({
				id: currentLine.id,
				prevElement,
				prevSequenceFlow,
				element: null,
				nextElement: null,
			});
			continue;
		}

		if (isLineKnot(currentLine) && isLineEmpty(prevLine)) {
			console.log(currentLine);
			const knot = openKnots.find((el) => el.id == currentLine.id);
			if (knot == null) {
				alert("Knot " + currentLine.value + " is not registered yet!");
				break;
			}
			if (knot.nextElement == null || knot.element != null) {
				prevElement =
					knot.element != null ? knot.element : knot.prevElement;
				prevSequenceFlow = knot.prevSequenceFlow;
			}
			continue;
		}

		if (
			isPositionRootScopeClosedStartOfFragmentWithoutScopeChange(
				prevLine,
				scopes
			) &&
			isElementRootScopeStartEvent(currentLine)
		) {
			console.log(currentLine);
			let element = createStartEvent(
				currentLine.id,
				currentLine.value,
				currentLine.eventDefinition,
				currentLine.interrupting
			);
			prevSequenceFlow = createOutgoingSequenceFlow(element, "");
			element.outgoing.push(prevSequenceFlow);
			scopes[0].flowElements.push(element);
			prevElement = element;
			continue;
		}

		if (
			isPositionClosedStartOfFragmentWithoutScopeChange(prevLine) &&
			isElementLinkCatchEvent(currentLine)
		) {
			console.log(currentLine);
			let element = createIntermediateCatchEvent(
				currentLine.id,
				currentLine.value,
				currentLine.eventDefinition,
				currentLine.interrupting
			);
			prevSequenceFlow = createOutgoingSequenceFlow(element, "");
			element.outgoing.push(prevSequenceFlow);
			scopes[0].flowElements.push(element);
			prevElement = element;
			continue;
		}

		if (
			isPositionClosedStartOfFragmentWithoutScopeChange(prevLine) &&
			isElementEventSubprocess(currentLine)
		) {
			console.log(currentLine);
			let element = createEventSubprocess(
				currentLine.id,
				currentLine.value
			);
			scopes[0].flowElements.push(element);
			prevElement = element;
			continue;
		}

		if (
			isPositionStartOfSubprocess(prevPrevLine, prevLine) &&
			isElementNoneStartEvent(currentLine)
		) {
			console.log(currentLine);
			let element = createStartEvent(
				currentLine.id,
				currentLine.value,
				currentLine.eventDefinition,
				currentLine.interrupting
			);
			prevSequenceFlow = createOutgoingSequenceFlow(element, "");
			element.outgoing.push(prevSequenceFlow);
			scopes[0].flowElements.push(element);
			prevElement = element;
			continue;
		}

		if (
			isPositionStartOfEventSubprocess(prevPrevLine, prevLine) &&
			isElementEventSubprocessStartEvent(currentLine)
		) {
			console.log(currentLine);
			let element = createStartEvent(
				currentLine.id,
				currentLine.value,
				currentLine.eventDefinition,
				currentLine.interrupting
			);
			prevSequenceFlow = createOutgoingSequenceFlow(element, "");
			element.outgoing.push(prevSequenceFlow);
			scopes[0].flowElements.push(element);
			prevElement = element;
			continue;
		}

		if (isLineKnot(prevLine) && isLineEmpty(prevPrevLine)) {
			const insertParallelGateway =
				hasLineGatewayType(currentLine, "parallel") &&
				openKnots.some(
					(el) => el.id == prevLine.id && el.nextElement != null
				) &&
				(openKnots.some(
					(el) => el.id == prevLine.id && el.element == null
				) ||
					!isBPMNElementOfType(
						openKnots.find((el) => el.id == prevLine.id).element,
						"ParallelGateway"
					));
			const insertEventBasedGateway =
				!hasLineGatewayType(currentLine, "parallel") &&
				openKnots.some(
					(el) => el.id == prevLine.id && el.nextElement != null
				) &&
				(openKnots.some(
					(el) => el.id == prevLine.id && el.element == null
				) ||
					!isBPMNElementOfType(
						openKnots.find((el) => el.id == prevLine.id).element,
						"EventBasedGateway"
					)) &&
				isBPMNElementSuitableForEventBasedGateway(
					openKnots.find((el) => el.id == prevLine.id).nextElement
				) &&
				isElementSuitableForEventBasedGateway(currentLine);
			if (insertParallelGateway || insertEventBasedGateway) {
				console.log(currentLine);
				const knot = openKnots.find((el) => el.id == prevLine.id);
				const previousExistingPrevElement = scopes[0].flowElements.find(
					(el) => el.id == knot.prevElement.id
				);
				const previousExistingNextElement = scopes[0].flowElements.find(
					(el) => el.id == knot.nextElement.id
				);

				let gateway = createGateway(
					null,
					insertParallelGateway
						? "ParallelGateway"
						: "EventBasedGateway",
					""
				);
				const connectingSequenceFlow =
					previousExistingPrevElement.outgoing.find(
						(s) => s.targetRef.id == previousExistingNextElement.id
					);
				connectingSequenceFlow.targetRef = gateway;
				gateway.incoming.push(connectingSequenceFlow);

				let extraSequenceFlow = createSequenceFlow(
					gateway,
					previousExistingNextElement
				);
				gateway.outgoing.push(extraSequenceFlow);
				previousExistingNextElement.incoming = [extraSequenceFlow];

				scopes[0].flowElements.push(gateway, extraSequenceFlow);
				prevElement = gateway;
				knot.element = gateway;
			}
		}

		if (isLineFragmentBorder(prevPrevLine)) {
			console.log("yes");
			// if (
			//   isBPMNElementOfType(prevElement.outgoing[0]?.targetRef, "ParallelGateway") ||
			//   isBPMNElementOfType(prevElement.outgoing[0]?.targetRef, "EventBasedGateway")
			// ) {
			//   prevElement = prevElement.outgoing[0]?.targetRef;
			// }
			const previousExistingNextElement =
				prevElement.outgoing[0]?.targetRef;
			const insertParallelGateway =
				hasLineGatewayType(currentLine, "parallel") &&
				!isBPMNElementOfType(
					previousExistingNextElement,
					"ParallelGateway"
				);
			const insertEventBasedGateway =
				!hasLineGatewayType(currentLine, "parallel") &&
				!isBPMNElementOfType(
					previousExistingNextElement,
					"EventBasedGateway"
				) &&
				isBPMNElementSuitableForEventBasedGateway(
					previousExistingNextElement
				) &&
				isElementSuitableForEventBasedGateway(currentLine);
			if (insertParallelGateway || insertEventBasedGateway) {
				console.log(currentLine);

				let gateway = createGateway(
					null,
					insertParallelGateway
						? "ParallelGateway"
						: "EventBasedGateway",
					""
				);
				prevElement.outgoing[0].targetRef = gateway;
				gateway.incoming.push(prevElement.outgoing[0]);

				let extraSequenceFlow = createSequenceFlow(
					gateway,
					previousExistingNextElement
				);
				gateway.outgoing.push(extraSequenceFlow);
				previousExistingNextElement.incoming = [extraSequenceFlow];

				scopes[0].flowElements.push(gateway, extraSequenceFlow);
				prevElement = gateway;
			} else if (
				(hasLineGatewayType(currentLine, "parallel") &&
					isBPMNElementOfType(
						previousExistingNextElement,
						"ParallelGateway"
					)) ||
				(!hasLineGatewayType(currentLine, "parallel") &&
					isElementSuitableForEventBasedGateway(currentLine) &&
					isBPMNElementOfType(
						previousExistingNextElement,
						"EventBasedGateway"
					))
			) {
				prevElement = prevElement.outgoing[0]?.targetRef;
				console.log("I'm here");
				console.log(prevElement);
			}
		}

		if (
			isLineKnot(currentLine) &&
			(isLineEmpty(nextLine) || nextLine == null)
		) {
			console.log(currentLine);
			const openKnot = openKnots.find((el) => el.id == currentLine.id);
			const noGatewayPresent = openKnot.element == null;
			const existingGateway = openKnot.element;
			const wrongGatewayPresent = !(
				(hasLineGatewayType(currentLine, "parallel") &&
					isBPMNElementOfType(existingGateway, "ParallelGateway")) ||
				(hasLineGatewayType(currentLine, "inclusive") &&
					isBPMNElementOfType(existingGateway, "InclusiveGateway")) ||
				(hasLineGatewayType(currentLine, "exclusive") &&
					isBPMNElementOfType(existingGateway, "ExclusiveGateway"))
			);
			if (noGatewayPresent || wrongGatewayPresent) {
				const previousExistingElement = scopes[0].flowElements.find(
					(el) => el.id == openKnot.prevElement.id
				);

				let gateway = createGateway(
					null,
					hasLineGatewayType(currentLine, "parallel")
						? "ParallelGateway"
						: hasLineGatewayType(currentLine, "inclusive")
						? "InclusiveGateway"
						: "ExclusiveGateway",
					""
				);

				let extraSequenceFlow = createSequenceFlow(
					previousExistingElement,
					gateway
				);
				previousExistingElement.outgoing.push(extraSequenceFlow);
				gateway.incoming.push(extraSequenceFlow);

				let sequenceFlow = ensureSequenceFlow(
					prevElement,
					prevSequenceFlow,
					gateway
				);
				prevSequenceFlow = null;
				openKnot.prevSequenceFlow = null;
				gateway.incoming.push(sequenceFlow);

				openKnot.element = gateway;
				scopes[0].flowElements.push(
					gateway,
					extraSequenceFlow,
					sequenceFlow
				);
				prevElement = gateway;
				continue;
			} else {
				let sequenceFlow = ensureSequenceFlow(
					prevElement,
					prevSequenceFlow,
					existingGateway
				);
				prevSequenceFlow = null;
				openKnot.prevSequenceFlow = null;
				existingGateway.incoming.push(sequenceFlow);

				scopes[0].flowElements.push(sequenceFlow);
				prevElement = existingGateway;
				continue;
			}
		}

		if (isPositionWithinFragment(prevLine, currentLine, nextLine)) {
			const insertIntermediateEvent =
				isElementIntermediateEvent(currentLine) &&
				(!isBPMNElementOfType(prevElement, "EventBasedGateway") ||
					isElementSuitableForEventBasedGateway(currentLine));
			const insertActivity =
				(isElementTask(currentLine) ||
					isElementSubprocess(currentLine)) &&
				(!isBPMNElementOfType(prevElement, "EventBasedGateway") ||
					isElementSuitableForEventBasedGateway(currentLine));
			const insertExclusiveGateway = isElementQuestion(currentLine);

			if (
				insertIntermediateEvent ||
				insertActivity ||
				insertExclusiveGateway
			) {
				console.log(currentLine);
				let element = insertIntermediateEvent
					? currentLine.throwing
						? createIntermediateThrowEvent(
								currentLine.id,
								currentLine.value,
								currentLine.eventDefinition
						  )
						: createIntermediateCatchEvent(
								currentLine.id,
								currentLine.value,
								currentLine.eventDefinition
						  )
					: insertActivity
					? isElementTask(currentLine)
						? createTask(
								currentLine.id,
								currentLine.activityType,
								currentLine.value,
								currentLine.loopCharacteristic,
								isCompensation
						  )
						: createSubprocess(
								currentLine.id,
								currentLine.value,
								currentLine.loopCharacteristic,
								isCompensation
						  )
					: createGateway(
							currentLine.id,
							"ExclusiveGateway",
							currentLine.value
					  );
				let sequenceFlow = ensureSequenceFlow(
					prevElement,
					prevSequenceFlow,
					element
				);
				prevSequenceFlow = null;
				element.incoming.push(sequenceFlow);

				scopes[0].flowElements.push(element, sequenceFlow);
				prevElement = element;
				isCompensation = false;
				if (isLineKnot(prevLine)) {
					const knot = openKnots.find((el) => el.id == prevLine.id);
					knot.nextElement = element;
					knot.prevSequenceFlow = null;
				}
				continue;
			}
		}

		if (
			isPositionWithinFragmentWithScopeChange(
				prevLine,
				currentLine,
				nextLine
			) &&
			isElementSubprocess(currentLine) &&
			!isBPMNElementOfType(prevElement, "EventBasedGateway")
		) {
			console.log(currentLine);
			let element = createSubprocess(
				currentLine.id,
				currentLine.value,
				currentLine.loopCharacteristic,
				isCompensation
			);
			let sequenceFlow = ensureSequenceFlow(
				prevElement,
				prevSequenceFlow,
				element
			);
			prevSequenceFlow = null;
			element.incoming.push(sequenceFlow);

			scopes[0].flowElements.push(element, sequenceFlow);
			prevElement = element;
			isCompensation = false;
			if (isLineKnot(prevLine)) {
				const knot = openKnots.find((el) => el.id == prevLine.id);
				knot.nextElement = element;
				knot.prevSequenceFlow = null;
			}
			continue;
		}

		if (
			!isLineFragmentBorder(prevPrevLine) &&
			isElementQuestion(prevLine) &&
			isElementAnswer(currentLine)
		) {
			console.log(currentLine);
			prevSequenceFlow = createOutgoingSequenceFlow(
				prevElement,
				currentLine.value
			);
			prevElement.outgoing.push(prevSequenceFlow);
			if (
				currentLine.answerType == "xorDefault" ||
				currentLine.answerType == "orDefault"
			) {
				prevElement.default = prevSequenceFlow;
			}
			continue;
		}

		if (
			isLineFragmentBorder(prevPrevLine) &&
			isElementQuestion(prevLine) &&
			isElementAnswer(currentLine)
		) {
			console.log(currentLine);
			prevSequenceFlow = createOutgoingSequenceFlow(
				prevElement,
				currentLine.value
			);
			prevElement.outgoing.push(prevSequenceFlow);
			if (
				currentLine.answerType == "xorDefault" ||
				currentLine.answerType == "orDefault"
			) {
				prevElement.default = prevSequenceFlow;
			}
			if (
				currentLine.answerType == "or" ||
				currentLine.answerType == "orDefault"
			) {
				let newGateway = createGateway(
					prevElement.id,
					"InclusiveGateway",
					prevElement.name
				);

				prevElement.incoming.forEach(
					(flow) => (flow.targetRef = newGateway)
				);
				prevElement.outgoing.forEach(
					(flow) => (flow.sourceRef = newGateway)
				);

				newGateway.incoming.push(...prevElement.incoming);
				newGateway.outgoing.push(...prevElement.outgoing);

				newGateway.default = prevElement.default;

				scopes[0].flowElements.push(newGateway);

				let indexOfOldGateway =
					scopes[0].flowElements.indexOf(prevElement);
				scopes[0].flowElements.splice(indexOfOldGateway, 1);
			}
			continue;
		}

		if (
			isLineFragmentBorder(prevPrevLine) &&
			isElementActivity(prevLine) &&
			!isElementEventSubprocess(prevLine) &&
			isElementBoundaryEvent(currentLine)
		) {
			console.log(currentLine);
			let element = createBoundaryEvent(
				currentLine.id,
				currentLine.value,
				currentLine.eventDefinition,
				currentLine.interrupting,
				prevElement
			);
			if (currentLine.eventDefinition == "CompensateEventDefinition") {
				prevSequenceFlow = createOutgoingAssociation(element, "");
				isCompensation = true;
			}
			scopes[0].flowElements.push(element);
			prevElement = element;
			continue;
		}

		if (
			isPositionClosedEndOfFragment(currentLine, nextLine) &&
			isElementEndEvent(currentLine)
		) {
			console.log(currentLine);
			let element =
				currentLine.eventDefinition == "LinkEventDefinition"
					? createIntermediateThrowEvent(
							currentLine.id,
							currentLine.value,
							currentLine.eventDefinition
					  )
					: createEndEvent(
							currentLine.id,
							currentLine.value,
							currentLine.eventDefinition
					  );
			let sequenceFlow = ensureSequenceFlow(
				prevElement,
				prevSequenceFlow,
				element
			);
			prevSequenceFlow = null;
			element.incoming.push(sequenceFlow);

			scopes[0].flowElements.push(element, sequenceFlow);
			prevElement = element;
			if (isLineKnot(prevLine)) {
				const knot = openKnots.find((el) => el.id == prevLine.id);
				knot.nextElement = element;
				knot.prevSequenceFlow = null;
			}
			continue;
		}

		if (isLineFragmentBorder(nextLine)) {
			console.log(currentLine);
			const mergingElement =
				currentLine.id != null
					? scopes[0].flowElements.find((el) =>
							el.id.endsWith(currentLine.id)
					  )
					: scopes[0].flowElements.find(
							(el) => el.name == currentLine.value
					  );
			let sequenceFlow;
			const previousExistingElement =
				mergingElement.incoming[0].sourceRef;

			const isCorrectGateway =
				(hasLineGatewayType(currentLine, "exclusive") &&
					isBPMNElementOfType(
						previousExistingElement,
						"ExclusiveGateway"
					) &&
					previousExistingElement.outgoing.length == 1) ||
				(hasLineGatewayType(currentLine, "inclusive") &&
					isBPMNElementOfType(
						previousExistingElement,
						"InclusiveGateway"
					) &&
					previousExistingElement.outgoing.length == 1) ||
				(hasLineGatewayType(currentLine, "parallel") &&
					isBPMNElementOfType(
						previousExistingElement,
						"ParallelGateway"
					) &&
					previousExistingElement.outgoing.length == 1);

			if (isCorrectGateway) {
				sequenceFlow = ensureSequenceFlow(
					prevElement,
					prevSequenceFlow,
					previousExistingElement
				);
				previousExistingElement.incoming.push(sequenceFlow);
				if (isLineKnot(prevLine)) {
					const knot = openKnots.find((el) => el.id == prevLine.id);
					knot.nextElement = previousExistingElement;
					knot.prevSequenceFlow = null;
				}
			} else {
				let gateway = createGateway(
					null,
					hasLineGatewayType(currentLine, "exclusive")
						? "ExclusiveGateway"
						: hasLineGatewayType(currentLine, "inclusive")
						? "InclusiveGateway"
						: "ParallelGateway",
					""
				);
				mergingElement.incoming[0].targetRef = gateway;
				gateway.incoming.push(mergingElement.incoming[0]);
				let extraSequenceFlow = createSequenceFlow(
					gateway,
					mergingElement
				);
				gateway.outgoing.push(extraSequenceFlow);
				mergingElement.incoming = [extraSequenceFlow];
				sequenceFlow = ensureSequenceFlow(
					prevElement,
					prevSequenceFlow,
					gateway
				);
				prevSequenceFlow = null;
				gateway.incoming.push(sequenceFlow);

				scopes[0].flowElements.push(gateway, extraSequenceFlow);
				if (isLineKnot(prevLine)) {
					const knot = openKnots.find((el) => el.id == prevLine.id);
					knot.nextElement = gateway;
					knot.prevSequenceFlow = null;
				}
			}
			prevElement.outgoing.push(sequenceFlow);
			scopes[0].flowElements.push(sequenceFlow);
			continue;
		}

		console.log(currentLine);
		alert("Could not handle: " + currentLine.value);
		break;
	}

	// Add the process to the root elements
	rootElement.get("rootElements").push(bpmnProcess);

	console.log(rootElement);

	// Convert the BPMN to XML
	const updatedXML = await createXML(rootElement);

	// Layout the process (use async to return it after layout)
	return await layoutProcess(updatedXML);
}
