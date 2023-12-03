import { create } from "zustand";
import { syncTabs } from "zustand-sync-tabs";

export interface Particle {
	x: number;
	y: number;
	vx: number;
	vy: number;
}

export interface Globe {
	id: string;
	color: string;
	x: number;
	y: number;
	particles: Particle[];
}

export interface GlobalStore {
	_id: string;
	_count: number;
	_globeIds: string[];
	globes: Globe[];
	activeControllerId: string;
	setId: (id: string) => void;
	addGlobe: (globe: Globe) => void;
	updateGlobes: (globes: Globe[]) => void;
	removeGlobe: (id: string) => void;
	setCount: (count: number) => void;
	setGlobeIds: (_globeIds: string[]) => void;
	setActiveControllerId: (id: string) => void;
}

export const useGlobalStore = create<GlobalStore>()(
	syncTabs(
		(set, get) => ({
			_id: "",
			_count: 0,
			globes: [],
			activeControllerId: "",
			_globeIds: [],
			setId: id => {
				set({ ...get(), _id: id });
			},
			addGlobe: globe => {
				const prevState = get();
				set({ ...prevState, globes: [...prevState.globes, globe] });
			},
			setCount: count => {
				set({ ...get(), _count: count });
			},
			updateGlobes(globes) {
				set({ ...get(), globes });
			},
			setGlobeIds(_globeIds) {
				set({ ...get(), _globeIds });
			},
			setActiveControllerId(id) {
				set({ ...get(), activeControllerId: id });
			},
			removeGlobe(id) {
				const prevState = get();
				set({
					...prevState,
					globes: prevState.globes.filter(globe => globe.id !== id),
					_globeIds: prevState._globeIds.filter(globeId => globeId !== id),
				});
			},
		}),
		{ name: "globe", regExpToIgnore: /^_/ },
	),
);
