# BPMN Path Syntax Translator

Created by: Till Stadtler

Test the BPMN Path Syntax Translator here: [BPMN Path Syntax Translator](https://camunda-community-hub.github.io/path-syntax-translator/)

This tool offers the possiblility to design BPMN processes with keyboard only! Yeah! And you do not need to worry about the layout! Wuhuu!
I created the BPMN Path Syntax based on the Sketch Miner Syntax, but I use different apporaches for fragments, gateway logic, and I extended it with a few features.

This react app translates the BPMN Path Syntax into useful BPMN, using bpmn.io libraries. The BPMN Path Syntax is a feature-complete syntax to describe the process part of an xml-based BPMN process model. The layout is done with a the bpmn-auto-layout library from bpmn.io.

## BPMN Path Syntax

The BPMN Path Syntax uses one happy path and diverting fragments to describe a BPMN process. Roughly speaking, each line represents one element. Sequence flows are added implicitely. This keeps the syntax short and easy to use. The syntax analyzes the position of a line in its context to induce if an event is a start, intermediate or end event.

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

To describe elements within a subprocess, indent each line when describing the elements inside of it.

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

[Click here to access the example!](https://camunda-community-hub.github.io/path-syntax-translator?syntax=%28%22process+started%22%29%0A%5Bservice+%22do+something%22%5D%0A%5Bsend+%22notify+someone%22%5D%0ASkip+stuff%3F%0Ano%0A%28timer+%22wait+here+a+bit%22%29%0A%28MESSAGE+%22throw+this%22%29%0A%28message+%22receive+this%22%29%0A%28%22milestone+reached%22%29%0A%28MESSAGE+%22throw+and+end+this%22%29%0A%0A...%0ASkip+stuff%3F%0Ayes%0A%28%22milestone+reached%22%29%0A...%0A%0A...%0A%5Bservice+%22do+something%22%5D%0Aand+%5Buser+%22we+need+manual+intervention%22%5D%0A%3Csplit%3E%0A%0A%3Csplit%3E%0A%5Bsubprocess+%22a+subprocess%22%5D%0A%09%28start+%22this+is+extra+tricky%22%29%0A%09%28SIGNAL+%22do+you+receive+this%3F%22%29%0A%09%28signal+%22got+it+via+signal%22%29%0A%09%28finish+%22nice%21%22%29%0A%0A%09...%0A%09%28SIGNAL+%22do+you+receive+this%3F%22%29%0A%09%28message+%22got+it+via+message%22%29%0A%09%28finish+%22nice%21%22%29%0A%09...%0A%0A%09...%0A%09%28SIGNAL+%22do+you+receive+this%3F%22%29%0A%09%28timer+%22too+late%21%22%29%0A%09%28terminate+%22a+bummer%21%22%29%0A%5Bservice+%22some+more+stuff%22%5D%0A%28finish+%22we+are+done+here%21%29%0A%0A%3Csplit%3E%0Aand+%28timer+%22more+stuff+in+parallel%22%29%0A%28finish+%22good+thing+we+are+done+here+as+well%22%29%0A%0A%5Bevent+%22an+event-based+subprocess%22%5D%0A%09%28%28timer+%22every+few+minutes%22%29%29%0A%09%5Bsend+%22notify+user%22%5D%0A%09%28finish+%22all+done%22%29)

```
("process started")
[service "do something"]
[send "notify someone"]
Skip stuff?
no
(timer "wait here a bit")
(MESSAGE "throw this")
(message "receive this")
("milestone reached")
(MESSAGE "throw and end this")

...
Skip stuff?
yes
("milestone reached")
...

...
[service "do something"]
and [user "we need manual intervention"]
<split>

<split>
[subprocess "a subprocess"]
	(start "this is extra tricky")
	(SIGNAL "do you receive this?")
	(signal "got it via signal")
	(finish "nice!")

	...
	(SIGNAL "do you receive this?")
	(message "got it via message")
	(finish "nice!")
	...

	...
	(SIGNAL "do you receive this?")
	(timer "too late!")
	(terminate "a bummer!")
[service "some more stuff"]
(finish "we are done here!)

<split>
and (timer "more stuff in parallel")
(finish "good thing we are done here as well")

[event "an event-based subprocess"]
	((timer "every few minutes"))
	[send "notify user"]
	(finish "all done")
```

## Limitations and Bugs

There are some issues with using complex gateway logic and knots.

The bpmn-auto-layout library cannot handle associations, so compensations do not work. It also cannot handle pools and lanes. Currently, the translator itself also does not output pools and lanes as part of the process description of the BPMN process. All subprocesses are collapsed.

## Further Development

-   Contribute to bpmn-auto-layout to unblock the limitations
-   Add meta layout data: which processes are collapsed/expanded, which elements should be vertically aligned,...
-   More detailed read.me
-   Editor support (switch lines easily, auto suggestions,...)

## Feedback

If you have feedback, contact me via LinkedIn!
