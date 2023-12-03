import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, test } from "vitest";
import { GlobeController } from "./globe-controller";

describe.concurrent("globe-controller", () => {
	afterEach(cleanup);

	test("check if h1 heading exists", ({ expect }) => {
		render(<GlobeController />);
		expect(screen.getByTestId("globe-controller-h1").textContent).toBe("globe controller");
	});
});
