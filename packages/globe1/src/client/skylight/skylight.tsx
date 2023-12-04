import * as React from "react";
import { useGlobalStore } from "../../store";
import { DISPLAY_FACTOR } from "../globe-controller";

// interface SkylightProps {
// 	children?: React.ReactNode;
// }

/**
 * # Skylight
 *
 */
export function Skylight(props: React.HTMLProps<HTMLDivElement>) {
	const [globeIds, globes, id, _particleRadius] = useGlobalStore(st => [
		st._globeIds,
		st.globes,
		st._id,
		st._particleRadius,
	]);
	const containerRef = React.useRef<HTMLDivElement>(null);
	const canvasRef = React.useRef<HTMLCanvasElement>(null);
	const contextRef = React.useRef<CanvasRenderingContext2D | null>();
	const offScreenCanvasRef = React.useRef<Record<string, OffscreenCanvas>>({});

	React.useEffect(() => {
		const container = containerRef.current;
		/** todo change with resize observer */
		const onResize = () => {
			const canvas = canvasRef.current;
			const ctx = canvasRef.current?.getContext("2d", { alpha: false });
			if (!canvas || !ctx || !container) return;
			// Get the DPR and size of the canvas
			const dpr = window.devicePixelRatio;
			const rect = container.getBoundingClientRect();

			// Set the "actual" size of the canvas
			canvas.width = rect.width * dpr;
			canvas.height = rect.height * dpr;

			// Scale the context to ensure correct drawing operations
			ctx.scale(dpr, dpr);

			// Set the "drawn" size of the canvas
			canvas.style.width = `${rect.width}px`;
			canvas.style.height = `${rect.height}px`;
			contextRef.current = ctx;
		};
		addEventListener("resize", onResize);
		onResize();
		return () => container?.removeEventListener("resize", onResize);
	}, []);

	React.useEffect(() => {
		const context = contextRef.current;
		if (context) {
			const globeCanvas = new OffscreenCanvas(
				canvasRef.current?.width || 0,
				canvasRef.current?.height || 0,
			);

			const globeCtx = globeCanvas.getContext("2d", { alpha: false });
			if (!globeCtx || !canvasRef.current) return;
			const rect = canvasRef.current.getBoundingClientRect();
			const offsetX = Math.floor(screenLeft + rect.left) - _particleRadius;
			const offsetY = Math.floor(screenTop + rect.top) - _particleRadius;
			globes.forEach(globe => {
				// if (!globeIds.includes(globe.id) && globe.id !== id) return;
				// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- misleading error
				if (!offScreenCanvasRef.current[globe.id]) {
					const canvas1 = new OffscreenCanvas(2 * _particleRadius, 2 * _particleRadius);
					const ctx = canvas1.getContext("2d", { alpha: false });
					if (!ctx) return;
					ctx.fillStyle = globe.color;
					ctx.beginPath();
					ctx.arc(_particleRadius, _particleRadius, _particleRadius, 0, 2 * Math.PI);
					ctx.closePath();
					ctx.fill();
					offScreenCanvasRef.current[globe.id] = canvas1;
				}
				const pointCanvas = offScreenCanvasRef.current[globe.id];

				globeCtx.drawImage(
					pointCanvas,
					globe.x - 2 - offsetX,
					globe.y - 2 - offsetY,
					5 * _particleRadius,
					5 * _particleRadius,
				);
				for (let i = 0; i < globe.particles.length; i += DISPLAY_FACTOR) {
					const particle = globe.particles[i];
					globeCtx.drawImage(
						pointCanvas,
						particle.x - offsetX,
						particle.y - offsetY,
						2 * _particleRadius,
						2 * _particleRadius,
					);
				}
			});
			context.drawImage(globeCanvas, 0, 0);
		}
	}, [_particleRadius, globeIds, globes, id]);
	return (
		<div {...props} ref={containerRef}>
			<canvas ref={canvasRef} style={{ height: "100%", width: "100%" }} />
		</div>
	);
}
