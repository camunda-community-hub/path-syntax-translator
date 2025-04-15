import { BPMNViewer } from "../libs/BPMNViewer";
import generateXML from "../libs/PathSyntaxTranslator";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

export function Translator() {
	const [syntax, setSyntax] = useState("");
	const [searchParams, setSearchParams] = useSearchParams();
	const paramValue = searchParams.get("syntax");
	const [bpmnXML, setBpmnXML] = useState(() => {
		if (paramValue === null) {
			return "";
		} else setSyntax(paramValue);
	});

	useEffect(() => {
		setSearchParams({ syntax: syntax });
	}, [syntax, setSearchParams]);

	useEffect(() => {
		handleTranslateClick();
	}, []);

	const codeAreaRef = useRef();

	function setSyntaxText(e) {
		setSyntax(e.target.value);
	}

	function handleTab(e) {
		if (e.key == "Tab") {
			e.preventDefault();
			const { selectionStart, selectionEnd } = e.target;

			const newText =
				syntax.substring(0, selectionStart) +
				"\t" + // Edit this for type tab you want
				// Here it's 2 spaces per tab
				syntax.substring(selectionEnd, syntax.length);

			codeAreaRef.current.focus();
			codeAreaRef.current.value = newText;

			codeAreaRef.current.setSelectionRange(
				selectionStart + 1,
				selectionStart + 1
			);

			setSyntax(newText);
		}

		if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
			console.log("Pressed Command/Control + C");
			handleTranslateClick();
		}
	}

	// Make handleTranslateClick async to directly await the result of generateXML
	async function handleTranslateClick() {
		generateXML(syntax).then((layouted) => {
			console.log(layouted);
			setBpmnXML(layouted);
		});
	}

	function handleDownloadClick() {
		// const fileData = JSON.stringify(bpmnXML);
		const blob = new Blob([bpmnXML], { type: "text/xml" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.download = "path-syntax.bpmn";
		link.href = url;
		link.click();
	}

	return (
		<div className="container">
			<div className="left-container">
				<textarea
					className="syntax-textarea"
					value={syntax}
					onChange={setSyntaxText}
					ref={codeAreaRef}
					onKeyDown={handleTab}
				></textarea>
				<div className="buttons">
					<button
						className="translate-button"
						onClick={handleTranslateClick}
					>
						Translate (or press meta/ctrl + enter)
					</button>
					<button
						className="download-button"
						onClick={handleDownloadClick}
					>
						Download BPMN
					</button>
					<button
						className="download-button"
						onClick={() => {
							navigator.clipboard.writeText(window.location.href);
							alert("Copied URL to clipboard!");
						}}
					>
						Share diagram via URL
					</button>
				</div>
			</div>
			<div className="right-container">
				<BPMNViewer key={bpmnXML} bpmnXML={bpmnXML} />
			</div>
		</div>
	);
}
