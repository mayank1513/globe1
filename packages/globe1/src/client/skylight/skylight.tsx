import * as React from "react";
import { useGlobalStore } from "../../store";

// interface SkylightProps {
// 	children?: React.ReactNode;
// }

/**
 * # Skylight
 *
 */
export function Skylight() {
	const [globeIds, id, globes, activateControllerId] = useGlobalStore(state => [
		state._globeIds,
		state._id,
		state.globes,
		state.activeControllerId,
	]);
	return (
		<div>
			<h1 data-testid="skylight-h1">skylight</h1>
			<pre>{JSON.stringify({ globeIds, id, globes, activateControllerId }, null, 2)}</pre>
		</div>
	);
}
