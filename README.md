# BPMN Path Syntax Translator

Created by: Till Stadtler

This tool offers the possiblility to design BPMN process with keyboard only! Yeah! And you do not need to worry about the layout! Wuhuu!
I created the BPMN Path Syntax based on the Sketch Miner Syntax, but I use different apporaches for fragments, gateway logic, and I extended it with a few features.

This react app translates the BPMN Path Syntax into useful BPMN using bpmn.io libraries. The BPMN Path Syntax is a feature-complete syntax to describe the process part of an xml-based BPMN process model. The layout is done with a the bpmn-auto-layout library from bpmn.io.

## BPMN Path Syntax

The BPMN Path Syntax uses one happy path and diverting fragments to describe a BPMN process. Roughly, each line represents one element. Sequence flows are added implicitely. This keeps the syntax short and easy to use. The syntax analyzes the position of a line in its context to induce if it is a start, intermediate or end event.

### Defining elements

Elements are defined by various aspects:

-   a delimiter
    -   `()` for interrupting events
    -   `(())` for non interrupting events
    -   `[]()` for interrupting boundary events
    -   `[](())` for non-interrupting boundary events
    -   `[]` for activities
    -   `<>` for knots (placeholders that can become gateways)
-   a type
    -   events: timer, message,... to throw an event, write it in all caps, e.g., MESSAGE
    -   activities: service, user, receive, subprocess, event,...
-   an optional id:
    -   `id-...` - ids can be added if elements in the same scope share the same label, but you need to target a specific one
-   a label: use `""` for the label

To describe elements within a subprocess, indent each line when describing the elements of it.

### Fragements

To add something to an already existing element, create a new fragement by leaving an empty line, then adding ... (three dots). You then have several options:

-   add a boundary events to an activity
-   add an alternative path to create or add to a parallel gateway or event-based gateway
-   add another outgoing sequence flow to an exclusive or inclusive gateway, see below

To merge back into an already existing element, mention it, then add ... (three dots), and then leave an empty line.

### Gateways

Exclusive and inclusive gateway are defined via a question ending with a question mark. The next line will contain the label of the outgoing sequence flow. Then, the path can simply continue with the next element.

The keyword "or" before the answer will change the type of the gateway to an inclusive gateway. The keyword "default" will make the outgoing sequence flow the default sequence flow.

Parallel and event-based gateways do not use questions. For a parallel gateway, start a fragment, mention the element after which you want to add a parallel gateway. Use the keyword "and" to divert from the existing path which will automatically add the parallel gateway.

If you divert without a keyword and all affected elements would conform with an event-based gateway, it is automatically added.

When creating merging gateways, use fragments to merge into an existing element with no keyword for an exclusive merge, with "or" for an inclusive merge and "and" for a parallel merge.

### Knots

Sometimes, it is not possible to describe the gateway logic with just existing elements, e.g., when gateways follow each other. That is why knots are introduced. They can be opened on a path by adding "\<identifier\>" to the end of a path, no dots follow. This knot can then be picked up in a new fragments (no dots). Using the gateway logic described above, the knots can be the origin of a diverting path, or the merging point, without the necessity to mention an existing element. They are placeholders. Like this, a knot could be used for a parallel merge, to then merge exclusively into an existing element.

## Example

Here are some examples for you to try (you must use tabs, so you have to replace the spaces manually, sorry):
In this example, you can see that the layouter still needs some work!

Without subprocesses:

```
("process started")
[service "do something"]
[send "notify someone"]
(timer "wait here a bit")
(MESSAGE "throw this")
(message "receive this")
("milestone reached")
Does this work?
yes
(MESSAGE "throw and end this")

...
(MESSAGE "throw this")
(timer "not received on time")
(ERROR "this did not work...")

...
Does this work?
no
[service "let's try something else"]
<complex split>

<complex split>
Another gateway?
Oh yes
[user "work work"]
<merge>

<complex split>
and [service "do this"]
and <merge>

<merge>
("just end this")

...
Another gateway?
Another yes
(terminate "end all")
```

With subprocesses (manual replacement of spaces neccessary!):

```
("process started")
[service "do something"]
[send "notify someone"]
[subprocess "a subprocess"]
	("subprocess started")
	[user "manual work"]
	("manual work completed")
	("subprocess ended")

	...
	("subprocess started")
	and [service "do something else on the side"]
	and ("subprocess ended")
	...
(timer "wait here a bit")
(MESSAGE "throw this")
(message "receive this")
("milestone reached")
Does this work?
yes
(MESSAGE "throw and end this")

...
(MESSAGE "throw this")
(timer "not received on time")
(ERROR "this did not work...")

...
Does this work?
no
[service "let's try something else"]
<complex split>

<complex split>
Another gateway?
Oh yes
[user "work work"]
<merge>

<complex split>
and [service "do this"]
and <merge>

<merge>
("just end this")

...
Another gateway?
Another yes
(terminate "end all")

[event "this is always collapsed..."]
	((timer "every 5 minutes))
	[send "send stuff"]
	("stuff sent")
```

## Limitations and Bugs

There are some issues with using complex gateway logic and knots.

## Further Development

No plans yet. Depends on user feedback!
-> till.stadtler@camunda.com
