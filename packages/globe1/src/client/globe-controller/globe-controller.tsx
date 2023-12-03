import * as React from "react";
import { useGlobalStore } from "../../store";

/**
 * There should be only one GlobeController in the page.
 *
 */
export function GlobeController() {
	useGlobeController();
	return null;
}

export function useGlobeController() {
	React.useEffect(() => {
		const countTarget = process.env.NODE_ENV === "production" ? 0 : 1;
		const { _count, setId, setCount, addGlobe } = useGlobalStore.getState();
		/** Only one active controller */
		if (_count === countTarget) {
			const id = Math.random().toString(36).substring(2, 15); // random id for globe
			setId(id);
			addGlobe({ particles: [], id, x: 0, y: 0 });
			setUpGlobeSyncChannel(id);
		}
		setCount(_count + 1);
	}, []);
}

interface SyncGlobeData {
	action: "sync-globe" | "init-sync" | "remove-globe";
	payload: { target: string; id: string };
}

function setUpGlobeSyncChannel(id: string) {
	const channel = new BroadcastChannel("globe-sync");
	channel.onmessage = ({ data }) => handleChannelMessage(channel, data as SyncGlobeData, id);
	const onBeforeUnload = () => {
		channel.postMessage({ action: "remove-globe", payload: { id } });
	};
	window.addEventListener("beforeunload", onBeforeUnload);
	addEventListener("focus", () => activateController(channel, id));
	activateController(channel, id);
}

function activateController(channel: BroadcastChannel, id: string) {
	const { setActiveControllerId, setGlobeIds } = useGlobalStore.getState();
	setTimeout(() => {
		setActiveControllerId(id);
		setGlobeIds([]);
		channel.postMessage({ action: "init-sync", payload: { target: id } });

		setTimeout(() => {
			const { _globeIds, globes, updateGlobes } = useGlobalStore.getState();
			updateGlobes(globes.filter(globe => _globeIds.includes(globe.id) || globe.id === id));
		}, 700);
	}, 300);
	return true;
}

function handleChannelMessage(channel: BroadcastChannel, data: SyncGlobeData, id: string) {
	const { action, payload } = data;
	const { _globeIds, setGlobeIds, activeControllerId, removeGlobe } = useGlobalStore.getState();
	switch (action) {
		case "sync-globe":
			if (payload.target === id) {
				setGlobeIds([..._globeIds, payload.id]);
			}
			break;
		case "init-sync":
			channel.postMessage({ action: "sync-globe", payload: { target: payload.target, id } });
			break;
		case "remove-globe":
			if (activeControllerId === id) {
				removeGlobe(payload.id);
			}
	}
	return true;
}
