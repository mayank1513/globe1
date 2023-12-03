import * as React from "react";
import type { Globe, Particle } from "../../store";
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
			addGlobe(generateGlobe(id));
			setUpGlobeSyncChannel(id);
		}
		setCount(_count + 1);
	}, []);
}

const N_PARTICLES = 10_000;
function generateGlobe(id: string): Globe {
	const color = `hsl(${Math.random() * 360}, 100%, 50%)`;
	const particles: Particle[] = [];
	for (let i = 0; i < N_PARTICLES; i++) particles.push(generateParticle());

	return {
		id,
		color,
		x: screenLeft + innerWidth / 2,
		y: screenTop + innerHeight / 2,
		particles,
	};
}

function generateParticle(): Particle {
	const x = Math.random() * screen.width;
	const y = Math.random() * screen.height;
	const vx = Math.random() * 2 - 1;
	const vy = Math.random() * 2 - 1;
	return { x, y, vx, vy };
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
	setActiveControllerId(id);
	void animateParticles(id);
	setTimeout(() => {
		setGlobeIds([]);
		channel.postMessage({ action: "init-sync", payload: { target: id } });
		setTimeout(() => {
			const { _globeIds, globes, updateGlobes } = useGlobalStore.getState();
			updateGlobes(globes.filter(globe => _globeIds.includes(globe.id) || globe.id === id));
		}, 700);
	}, 300);
	return true;
}

async function animateParticles(id: string) {
	const { activeControllerId, globes, updateGlobes } = useGlobalStore.getState();
	if (activeControllerId !== id) return false;
	globes.forEach(globe => {
		if (globe.id === id) {
			globe.particles.forEach(particle => {
				particle.x += particle.vx;
				particle.y += particle.vy;
				if (particle.x < 0 || particle.x > screen.width) particle.vx *= -1;
				if (particle.y < 0 || particle.y > screen.height) particle.vy *= -1;
			});
		}
	});
	updateGlobes([...globes]);
	await new Promise(resolve => {
		setTimeout(resolve, 33);
	}); // 30 fps

	requestAnimationFrame(() => {
		void animateParticles(id);
	});
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
