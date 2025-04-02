export function interpretSyntax(syntax) {
	let isQuestion = false;
	const interpretation = syntax
		.split("\n")
		.map((line) => {
			const scopeLevel = (line.match(new RegExp("\\t", "g")) || [])
				.length;

			let trimmedLine = line.trim().replaceAll("\t", "");

			if (trimmedLine.startsWith("//")) {
				return;
			}

			if (trimmedLine == "" || trimmedLine == "...") {
				// if (isQuestion) {
				// alert("Answer expected!");
				// }
				return {
					type: trimmedLine == "" ? "empty" : "fragmentBorder",
					scopeLevel,
				};
			}

			if (isQuestion) {
				isQuestion = false;
				const firstWord = trimmedLine.split(" ")[0];
				const secondWord =
					typeof trimmedLine.split(" ")[1] !== "undefined"
						? trimmedLine.split(" ")[1]
						: null;
				return {
					type: "answer",
					answerType:
						firstWord == "or"
							? secondWord == "default"
								? "orDefault"
								: "or"
							: firstWord == "default"
							? "xorDefault"
							: "xor",
					value: trimmedLine
						.substring(
							firstWord == "or"
								? secondWord == "default"
									? firstWord.length +
									  1 +
									  secondWord.length +
									  1
									: firstWord.length + 1
								: firstWord == "default"
								? firstWord.length + 1
								: 0,
							trimmedLine.length
						)
						.replaceAll('"', ""),
					scopeLevel,
				};
			}

			if (trimmedLine.endsWith("?") || trimmedLine.endsWith('?"')) {
				isQuestion = true;
				const id = trimmedLine.startsWith("id-")
					? trimmedLine.split(" ")[0]
					: null;
				if (id != null) {
					trimmedLine = trimmedLine.substring(
						id.length + 1,
						trimmedLine.length
					);
				}
				return {
					id,
					type: "question",
					value: trimmedLine.replaceAll('"', ""),
					scopeLevel,
				};
			}

			const boundary = trimmedLine.startsWith("[]");
			if (boundary) {
				trimmedLine = trimmedLine.substring(2, trimmedLine.length);
			}

			if (trimmedLine.startsWith("((") && trimmedLine.endsWith("))")) {
				trimmedLine = trimmedLine.substring(2, trimmedLine.length - 2);
				const eventType = trimmedLine.split(" ")[0];
				const eventDefinition = getEventDefinition(eventType);
				if (eventDefinition) {
					trimmedLine = trimmedLine.substring(
						eventType.length + 1,
						trimmedLine.length
					);
				}
				const id = trimmedLine.startsWith("id-")
					? trimmedLine.split(" ")[0]
					: null;
				if (id != null) {
					trimmedLine = trimmedLine.substring(
						id.length + 1,
						trimmedLine.length
					);
				}
				return {
					id,
					type: "event",
					interrupting: false,
					throwing: false,
					boundary: boundary,
					eventDefinition: eventDefinition,
					value: trimmedLine.replaceAll('"', ""),
					scopeLevel,
				};
			}

			const firstWord = trimmedLine.split(" ")[0];
			const gatewayType =
				firstWord == "or"
					? "inclusive"
					: firstWord == "and"
					? "parallel"
					: "exclusive";
			if (firstWord == "or" || firstWord == "and") {
				trimmedLine = trimmedLine.substring(
					firstWord.length + 1,
					trimmedLine.length
				);
			}
			if (trimmedLine.startsWith("(") && trimmedLine.endsWith(")")) {
				trimmedLine = trimmedLine.substring(1, trimmedLine.length - 1);
				const eventType = trimmedLine.split(" ")[0];
				const eventDefinition = getEventDefinition(eventType);
				if (eventDefinition) {
					trimmedLine = trimmedLine.substring(
						eventType.length + 1,
						trimmedLine.length
					);
				}
				const id = trimmedLine.startsWith("id-")
					? trimmedLine.split(" ")[0]
					: null;
				if (id != null) {
					trimmedLine = trimmedLine.substring(
						id.length + 1,
						trimmedLine.length
					);
				}
				return {
					id,
					type: "event",
					gatewayType,
					interrupting: true,
					throwing: isThrowing(eventType),
					boundary,
					eventDefinition: eventDefinition,
					value: trimmedLine.replaceAll('"', ""),
					scopeLevel,
				};
			}

			if (trimmedLine.startsWith("<") && trimmedLine.endsWith(">")) {
				const id = trimmedLine.substring(1, trimmedLine.length - 1);
				return {
					id: id.replaceAll('"', ""),
					type: "knot",
					gatewayType,
					scopeLevel,
				};
			}

			if (trimmedLine.startsWith("[") && trimmedLine.endsWith("]")) {
				trimmedLine = trimmedLine.substring(1, trimmedLine.length - 1);
			}
			const nextWord = trimmedLine.split(" ")[0];
			const loopCharacteristic =
				nextWord == "parallel"
					? "parallel"
					: nextWord == "sequential"
					? "sequential"
					: null;
			if (nextWord == "parallel" || nextWord == "sequential") {
				trimmedLine = trimmedLine.substring(
					nextWord.length + 1,
					trimmedLine.length
				);
			}
			const lastWord = trimmedLine.split(" ")[0];
			const triggeredByEvent = lastWord == "event";
			trimmedLine = trimmedLine.substring(
				lastWord.length + 1,
				trimmedLine.length
			);

			const id = trimmedLine.startsWith("id-")
				? trimmedLine.split(" ")[0]
				: null;
			if (id != null) {
				trimmedLine = trimmedLine.substring(
					id.length + 1,
					trimmedLine.length
				);
			}

			return {
				id,
				type: "activity",
				gatewayType,
				activityType: getActivityType(lastWord),
				triggeredByEvent,
				value: trimmedLine.replaceAll('"', ""),
				loopCharacteristic,
				scopeLevel,
			};
		})
		.filter((val) => val);

	return interpretation;
}

function getEventDefinition(type) {
	switch (type) {
		case "timer":
			return "TimerEventDefinition";
		case "message":
		case "MESSAGE":
			return "MessageEventDefinition";
		case "signal":
		case "SIGNAL":
			return "SignalEventDefinition";
		case "conditional":
			return "ConditionalEventDefinition";
		case "error":
		case "ERROR":
			return "ErrorEventDefinition";
		case "escalation":
		case "ESCALATION":
			return "EscalationEventDefinition";
		case "compensate":
		case "COMPENSATE":
			return "CompensateEventDefinition";
		case "terminate":
			return "TerminateEventDefinition";
		case "link":
		case "LINK":
			return "LinkEventDefinition";
		case "none":
			return null;
		default:
			return null;
	}
}

function isThrowing(type) {
	return (
		type == "ERROR" ||
		type == "ESCALATION" ||
		type == "COMPENSATE" ||
		type == "MESSAGE" ||
		type == "SIGNAL"
	);
}

function getActivityType(type) {
	switch (type) {
		case "undefined":
			return "Task";
		case "send":
			return "SendTask";
		case "service":
			return "ServiceTask";
		case "rule":
			return "BusinessRuleTask";
		case "user":
			return "UserTask";
		case "manual":
			return "ManualTask";
		case "receive":
			return "ReceiveTask";
		case "script":
			return "ScriptTask";
		case "call":
			return "CallActivity";
		case "subprocess":
		case "event":
			return "SubProcess";
		default:
			return null;
	}
}
