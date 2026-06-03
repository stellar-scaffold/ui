import { labPrefix } from "@stellar-scaffold/ui-core"
import { NavLink, Outlet, Route, Routes } from "react-router-dom"
import styles from "./App.module.css"
import ConnectAccount from "./components/ConnectAccount"
import Debug from "./pages/Debug"
import Home from "./pages/Home"

function App() {
	return (
		<Routes>
			<Route element={<AppLayout />}>
				<Route path="/" element={<Home />} />
				<Route path="/debug" element={<Debug />} />
				<Route path="/debug/:contractName" element={<Debug />} />
			</Route>
		</Routes>
	)
}

const AppLayout = () => (
	<div className={styles.AppLayout}>
		<header className={styles.header}>
			<span className={styles.logo}>Scaffold</span>
			<nav className={styles.headerNav}>
				<NavLink
					to="/debug"
					className={({ isActive }) => (isActive ? styles.active : "")}
				>
					Contract Explorer
				</NavLink>
				<a href={labPrefix()} target="_blank" rel="noreferrer">
					Transaction Explorer
				</a>
			</nav>
			<ConnectAccount />
		</header>

		<main className={styles.main}>
			<Outlet />
		</main>

		<footer className={styles.footer}>
			<nav className={styles.footerNav}>
				<a
					href="https://github.com/stellar-scaffold/cli"
					target="_blank"
					rel="noreferrer"
				>
					GitHub
				</a>
				<a
					href="https://www.youtube.com/watch?v=0syGaIn3ULk&list=PLmr3tp_7-7Gjj6gn5-bBn-QTMyaWzwOU5"
					target="_blank"
					rel="noreferrer"
				>
					Tutorial
				</a>
				<a href="https://scaffoldstellar.org" target="_blank" rel="noreferrer">
					View docs
				</a>
			</nav>
		</footer>
	</div>
)

export default App
