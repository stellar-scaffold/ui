export default function Debug() {
	return (
		<div className="debug">
			<h2>Contract Explorer</h2>
			<p>
				The Contract Explorer is being converted to a standalone Stellar Scaffold Extension that
				runs in its own process. Once available, this page will link to it automatically.
			</p>
			<p>
				In the meantime, use the{" "}
				<a href="https://lab.stellar.org" target="_blank" rel="noreferrer">
					Stellar Lab
				</a>{" "}
				to inspect transactions.
			</p>
		</div>
	)
}
