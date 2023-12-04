import * as React from "react";
import type { Globe, Particle } from "../../store";
import { useGlobalStore } from "../../store";

interface GlobeControllerProps {
	/** @defaultValue 2 */
	particleRadius?: number;
	globeRadius?: number;
	/** @defaultValue 500 */
	nParticles?: number;
}

/**
 * There should be only one GlobeController in the page.
 */
export function GlobeController(props: GlobeControllerProps) {
	useGlobeController(props);
	return null;
}

export const DISPLAY_FACTOR = 2;
let globeRadius: number;
export function useGlobeController(props: GlobeControllerProps) {
	React.useEffect(() => {
		useGlobalStore.getState().setParticleRadius(props.particleRadius || 2);
	}, [props.particleRadius]);

	React.useEffect(() => {
		globeRadius = props.globeRadius || Math.min(screen.width, screen.height) / 4;
		const countTarget = process.env.NODE_ENV === "production" ? 0 : 1;
		const { _count, globes, setId, setCount, addGlobe } = useGlobalStore.getState();
		/** Only one active controller */
		if (_count === countTarget) {
			const id = Math.random().toString(36).substring(2, 15); // random id for globe
			setId(id);
			const color = `hsl(${360 / (globes.length + 1)}, 100%, 50%)`;
			addGlobe(generateGlobe(id, color, props.nParticles || 500));
			setUpGlobeSyncChannel(id);
		}
		setCount(_count + 1);
	}, [props.globeRadius, props.nParticles]);
}

function generateGlobe(id: string, color: string, nParticles: number): Globe {
	const x = screenLeft + innerWidth / 2;
	const y = screenTop + innerHeight / 2;
	const particles: Particle[] = [];
	for (let i = 0; i < nParticles * DISPLAY_FACTOR; i++) particles.push(generateParticle(x, y));

	return {
		id,
		color,
		x,
		y,
		particles,
	};
}

function generateParticle(gx: number, gy: number): Particle {
	const r1 = globeRadius * (0.9 + 0.2 * Math.random());
	const theta = 2 * Math.PI * Math.random();

	const x = r1 * Math.cos(theta) + gx;
	const y = r1 * Math.sin(theta) + gy;
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

export const PARTICLE_RADIUS = 1;
async function animateParticles(id: string) {
	const { activeControllerId, globes, updateGlobes } = useGlobalStore.getState();
	if (activeControllerId !== id) return false;
	const t = Date.now();
	globes.forEach(globe => {
		if (globe.id === id) {
			globe.x = screenLeft + innerWidth / 2;
			globe.y = screenTop + innerHeight / 2;
		}
		globe.particles.forEach(particle => {
			let ax = 0;
			let ay = 0;
			globes.forEach(g => {
				const dx = g.x - particle.x;
				const dy = g.y - particle.y;
				const d = Math.sqrt(dx * dx + dy * dy);
				const direction = d > globeRadius ? 1 : -1;
				const a = 1000 / d;
				ax += (direction * a * dx) / d;
				ay += (direction * a * dy) / d;
				/** particle - particle repulsion */
				g.particles.forEach(p => {
					const dx1 = p.x - particle.x;
					const dy1 = p.y - particle.y;
					const d1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
					if (d1 > 0) {
						const a1 = 20 / d1 ** 4;
						ax += (a1 * dx1) / d1;
						ay += (a1 * dy1) / d1;
					}
				});
			});
			particle.vx += ax;
			particle.vy += ay;
			if (particle.vx ** 2 + particle.vy ** 2 > globeRadius / 4) {
				particle.vx *= 0.9;
				particle.vy *= 0.9;
			}
			particle.x += particle.vx;
			particle.y += particle.vy;
			if (particle.x < 0 || particle.x > screen.width) particle.vx *= -1;
			if (particle.y < 0 || particle.y > screen.height) particle.vy *= -1;
			particle.x = Math.floor(particle.x);
			particle.y = Math.floor(particle.y);
		});
	});
	updateGlobes([...globes]);
	await new Promise(resolve => {
		setTimeout(resolve, 66 - (Date.now() - t));
	}); // 15 fps

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
