import * as React from "react";
import { INIT_SYNC, SYNC_GLOBES } from "../../constants";

interface StarMeProps extends React.HTMLAttributes<HTMLButtonElement> {
	gitHubUrl?: string;
}

/**
 * # StarMe
 * Star repo in a popup window
 *
 */

export function Globe({ gitHubUrl, onClick, ...props }: StarMeProps) {
	const starMe = (e: React.MouseEvent<HTMLButtonElement>) => {
		window.open(gitHubUrl, "_blank", "height: 400,width:1200,left:150,top:150");
		onClick?.(e);
	};

	const [globeIds, setGlobeIds] = React.useState<string[]>([]);

	React.useEffect(() => {
		const id = Math.random().toString(36).substring(2, 15); // random id for globe
		const channel = new BroadcastChannel("sync-globes");
		channel.onmessage = e => {
			const { action, payload } = e.data as {
				action: string;
				payload: { id: string; target?: string };
			};
			switch (action) {
				case INIT_SYNC:
					channel.postMessage({ action: SYNC_GLOBES, payload: { target: payload.id, id } });
					break;
				case SYNC_GLOBES:
					if (payload.target === id) {
						setGlobeIds(ids => [...ids, payload.id]);
					}
					break;
			}
		};
		const syncIds = () => {
			setGlobeIds([]);
			channel.postMessage({ action: INIT_SYNC, payload: { id } });
		};
		window.addEventListener("focus", syncIds);
		syncIds();
		return () => {
			window.removeEventListener("focus", syncIds);
		};
	}, []);

	return (
		<button data-testid="star-me-h1" onClick={starMe} type="button" {...props}>
			<pre>{JSON.stringify(globeIds, null, 2)}</pre>
		</button>
	);
}
