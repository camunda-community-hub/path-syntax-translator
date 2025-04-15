import { BrowserRouter as Router } from "react-router-dom";
import "./App.css";
import { Translator } from "./components/Translator";

function App() {
	return (
		<Router>
			<Translator />
		</Router>
	);
}

export default App;
