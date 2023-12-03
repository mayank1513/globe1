import * as React from "react";
import { useGlobalStore } from "../../store";

// interface SkylightProps {
// 	children?: React.ReactNode;
// }

/**
 * # Skylight
 *
 */
export function Skylight(props: React.HTMLProps<HTMLDivElement>) {
	const [globeIds, globes, id] = useGlobalStore(st => [st._globeIds, st.globes, st._id]);
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
			if (!globeCtx) return;
			const offsetX = screenLeft + (canvasRef.current?.getBoundingClientRect().left || 0);
			const offsetY = screenTop + (canvasRef.current?.getBoundingClientRect().top || 0);
			globes.forEach(globe => {
				if (!globeIds.includes(globe.id) && globe.id !== id) return;
				// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- misleading error
				if (!offScreenCanvasRef.current[globe.id]) {
					const canvas1 = new OffscreenCanvas(2, 2);
					const ctx = canvas1.getContext("2d", { alpha: false });
					if (!ctx) return;
					ctx.fillStyle = globe.color;
					ctx.beginPath();
					ctx.arc(1, 1, 1, 0, 2 * Math.PI);
					ctx.closePath();
					ctx.fill();
					offScreenCanvasRef.current[globe.id] = canvas1;
				}
				const pointCanvas = offScreenCanvasRef.current[globe.id];

				globeCtx.drawImage(pointCanvas, globe.x - 2 - offsetX, globe.y - 2 - offsetY, 5, 5);
				globe.particles.forEach(particle => {
					globeCtx.drawImage(pointCanvas, particle.x - offsetX, particle.y - offsetY, 1, 1);
				});
			});
			context.drawImage(globeCanvas, 0, 0);
		}
	}, [globeIds, globes, id]);
	return (
		<div {...props} ref={containerRef}>
			<canvas ref={canvasRef} style={{ height: "100%", width: "100%" }} />
		</div>
	);
}

// function renderScene(canvas: HTMLCanvasElement | null) {
// 	const context = canvas?.getContext("2d");
// 	if (!context) return false;
// 	const { globes, _globeIds, _id } = useGlobalStore.getState();
// 	context.clearRect(0, 0, context.canvas.width, context.canvas.height);
// 	globes.forEach(globe => {
// 		if (!_globeIds.includes(globe.id) && globe.id !== _id) return;
// 		context.fillStyle = globe.color;
// 		context.fillRect(globe.x - 2 - screenLeft, globe.y - 2 - screenTop, 5, 5);
// 		globe.particles.forEach(particle => {
// 			context.fillRect(particle.x - screenLeft, particle.y - screenTop, 1, 1);
// 		});
// 	});
// 	requestAnimationFrame(() => renderScene(canvas));
// }
